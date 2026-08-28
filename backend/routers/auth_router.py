import os
from datetime import timedelta

from fastapi import APIRouter, HTTPException, Request, Response, Depends
from pydantic import BaseModel, EmailStr, Field

from core import (db, ser, oid, now_utc, iso_now, hash_password, verify_password,
                  create_access_token, create_refresh_token, set_auth_cookies,
                  get_current_user, require_perm, log_activity, ROLE_PERMISSIONS)
import jwt
from core import get_jwt_secret, JWT_ALGORITHM

router = APIRouter(prefix="/auth", tags=["auth"])

MAX_ATTEMPTS = 5
LOCKOUT_MINUTES = 15


class LoginInput(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=200)


class UserInput(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=200)
    name: str = Field(min_length=1, max_length=120)
    role: str = "content_admin"


class UserUpdate(BaseModel):
    name: str | None = None
    role: str | None = None
    is_active: bool | None = None
    password: str | None = None


async def _check_lockout(identifier: str):
    rec = await db.login_attempts.find_one({"identifier": identifier})
    if rec and rec.get("count", 0) >= MAX_ATTEMPTS:
        locked_until = rec.get("locked_until")
        if locked_until and locked_until > iso_now():
            raise HTTPException(status_code=429, detail="Terlalu banyak percobaan login. Coba lagi dalam 15 menit.")


async def _register_failure(identifier: str):
    rec = await db.login_attempts.find_one({"identifier": identifier})
    count = (rec or {}).get("count", 0) + 1
    update = {"count": count, "last_attempt": iso_now()}
    if count >= MAX_ATTEMPTS:
        update["locked_until"] = (now_utc() + timedelta(minutes=LOCKOUT_MINUTES)).isoformat()
    await db.login_attempts.update_one({"identifier": identifier}, {"$set": update}, upsert=True)


@router.post("/login")
async def login(payload: LoginInput, request: Request, response: Response):
    email = payload.email.lower()
    identifier = email
    await _check_lockout(identifier)
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(payload.password, user.get("password_hash", "")):
        await _register_failure(identifier)
        raise HTTPException(status_code=401, detail="Email atau password salah")
    if not user.get("is_active", True):
        raise HTTPException(status_code=403, detail="Akun tidak aktif")
    await db.login_attempts.delete_one({"identifier": identifier})
    uid = str(user["_id"])
    set_auth_cookies(response, create_access_token(uid, email), create_refresh_token(uid))
    await db.users.update_one({"_id": user["_id"]}, {"$set": {"last_login": iso_now()}})
    data = ser(user)
    data["permissions"] = sorted(ROLE_PERMISSIONS.get(user.get("role", ""), set()))
    return data


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"success": True}


@router.get("/me")
async def me(user: dict = Depends(get_current_user)):
    user["permissions"] = sorted(ROLE_PERMISSIONS.get(user.get("role", ""), set()))
    return user


@router.post("/refresh")
async def refresh(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="Refresh token tidak ada")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Refresh token tidak valid")
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Tipe token tidak valid")
    user = await db.users.find_one({"_id": oid(payload["sub"])})
    if not user:
        raise HTTPException(status_code=401, detail="User tidak ditemukan")
    response.set_cookie("access_token", create_access_token(str(user["_id"]), user["email"]),
                        httponly=True, secure=True, samesite="none", max_age=28800, path="/")
    return ser(user)


# ---------- User management (super admin only) ----------
@router.get("/users")
async def list_users(user: dict = Depends(require_perm("users"))):
    docs = await db.users.find().sort("created_at", -1).to_list(200)
    return [ser(d) for d in docs]


@router.post("/users")
async def create_user(payload: UserInput, user: dict = Depends(require_perm("users"))):
    if payload.role not in ROLE_PERMISSIONS:
        raise HTTPException(status_code=422, detail="Role tidak valid")
    if await db.users.find_one({"email": payload.email.lower()}):
        raise HTTPException(status_code=409, detail="Email sudah digunakan")
    doc = {"email": payload.email.lower(), "password_hash": hash_password(payload.password),
           "name": payload.name, "role": payload.role, "is_active": True, "created_at": iso_now()}
    res = await db.users.insert_one(doc)
    await log_activity(user, "create", "users", str(res.inserted_id), None, {"email": doc["email"], "role": doc["role"]})
    return ser(await db.users.find_one({"_id": res.inserted_id}))


@router.put("/users/{user_id}")
async def update_user(user_id: str, payload: UserUpdate, user: dict = Depends(require_perm("users"))):
    target = await db.users.find_one({"_id": oid(user_id)})
    if not target:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")
    update = {}
    if payload.name:
        update["name"] = payload.name
    if payload.role:
        if payload.role not in ROLE_PERMISSIONS:
            raise HTTPException(status_code=422, detail="Role tidak valid")
        update["role"] = payload.role
    if payload.is_active is not None:
        update["is_active"] = payload.is_active
    if payload.password:
        if len(payload.password) < 8:
            raise HTTPException(status_code=422, detail="Password minimal 8 karakter")
        update["password_hash"] = hash_password(payload.password)
    if update:
        await db.users.update_one({"_id": target["_id"]}, {"$set": update})
    await log_activity(user, "update", "users", user_id, ser(target), {k: v for k, v in update.items() if k != "password_hash"})
    return ser(await db.users.find_one({"_id": target["_id"]}))


@router.delete("/users/{user_id}")
async def delete_user(user_id: str, user: dict = Depends(require_perm("users"))):
    if user_id == user["id"]:
        raise HTTPException(status_code=400, detail="Tidak dapat menghapus akun sendiri")
    target = await db.users.find_one({"_id": oid(user_id)})
    if not target:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")
    await db.users.delete_one({"_id": target["_id"]})
    await log_activity(user, "delete", "users", user_id, ser(target), None)
    return {"success": True}
