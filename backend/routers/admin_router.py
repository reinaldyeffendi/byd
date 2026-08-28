import csv
import io
import json
import re
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

import requests
from bs4 import BeautifulSoup
from fastapi import (APIRouter, Depends, File, HTTPException, Query, Request,
                     Response, UploadFile)
from pydantic import BaseModel

from core import (APP_NAME, MIME_TYPES, db, get_current_user, get_object, iso_now,
                  log_activity, now_utc, oid, put_object, require_perm, ser, slugify,
                  has_perm)

router = APIRouter(prefix="/admin", tags=["admin"])

# resource -> (collection, permission, slug_source)
RESOURCES = {
    "vehicles": ("vehicles", "vehicles", "name"),
    "promotions": ("promotions", "promotions", "title"),
    "articles": ("articles", "articles", "title"),
    "events": ("events", "events", "title"),
    "testimonials": ("testimonials", "testimonials", None),
    "leads": ("leads", "leads", None),
    "test-drives": ("test_drive_requests", "test_drives", None),
    "media": ("media", "media", None),
    "pages": ("pages", "homepage", "slug"),
}

SEARCH_FIELDS = {
    "vehicles": ["name", "category", "slug"],
    "promotions": ["title", "slug"],
    "articles": ["title", "category", "slug"],
    "events": ["title", "location"],
    "testimonials": ["name", "content"],
    "leads": ["full_name", "whatsapp", "email", "city", "vehicle_name"],
    "test-drives": ["full_name", "whatsapp", "vehicle_name"],
    "media": ["original_filename", "alt_text", "caption"],
    "pages": ["slug", "title"],
}

DEFAULTS = {
    "vehicles": {"status": "draft", "featured": False, "views": 0, "images": [], "variants": [],
                 "colors": [], "features": {"safety": [], "technology": [], "interior": [], "exterior": []},
                 "dimensions": {}, "seo": {}},
    "promotions": {"status": "draft", "vehicle_slugs": [], "seo": {}},
    "articles": {"status": "draft", "tags": [], "seo": {}},
    "events": {"status": "draft", "gallery": []},
    "testimonials": {"status": "published", "rating": 5},
    "pages": {"status": "draft"},
}

REQUIRED = {
    "vehicles": ["name", "category"],
    "promotions": ["title"],
    "articles": ["title"],
    "events": ["title"],
    "testimonials": ["name", "content"],
    "pages": ["slug", "title"],
}


def _resource(name: str):
    if name not in RESOURCES:
        raise HTTPException(status_code=404, detail="Resource tidak dikenal")
    return RESOURCES[name]


async def _guard(request: Request, resource: str):
    collection, perm, _ = _resource(resource)
    user = await get_current_user(request)
    if not has_perm(user, perm):
        raise HTTPException(status_code=403, detail=f"Akses ditolak untuk modul '{perm}'")
    return user, collection


@router.get("/resources/{resource}")
async def list_items(resource: str, request: Request, q: Optional[str] = None,
                     status: Optional[str] = None, category: Optional[str] = None,
                     page: int = 1, limit: int = Query(20, le=200), sort: str = "-created_at"):
    user, collection = await _guard(request, resource)
    query: dict = {}
    if q:
        fields = SEARCH_FIELDS.get(resource, [])
        query["$or"] = [{f: {"$regex": re.escape(q), "$options": "i"}} for f in fields]
    if status:
        query["status"] = status
    if category:
        query["category"] = category
    direction = -1 if sort.startswith("-") else 1
    field = sort.lstrip("-")
    total = await db[collection].count_documents(query)
    docs = await db[collection].find(query).sort(field, direction) \
        .skip(max(0, (page - 1) * limit)).limit(limit).to_list(limit)
    return {"items": [ser(d) for d in docs], "total": total, "page": page, "limit": limit}


@router.get("/resources/{resource}/{item_id}")
async def get_item(resource: str, item_id: str, request: Request):
    user, collection = await _guard(request, resource)
    doc = await db[collection].find_one({"_id": oid(item_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Data tidak ditemukan")
    return ser(doc)


@router.post("/resources/{resource}", status_code=201)
async def create_item(resource: str, payload: dict, request: Request):
    user, collection = await _guard(request, resource)
    for field in REQUIRED.get(resource, []):
        if not str(payload.get(field) or "").strip():
            raise HTTPException(status_code=422, detail=f"Field '{field}' wajib diisi")
    doc = dict(DEFAULTS.get(resource, {}))
    doc.update({k: v for k, v in payload.items() if k not in ("id", "_id")})
    _, _, slug_source = _resource(resource)
    if slug_source and resource != "pages":
        doc["slug"] = slugify(doc.get("slug") or doc.get(slug_source, ""))
        if await db[collection].find_one({"slug": doc["slug"]}):
            doc["slug"] = f"{doc['slug']}-{uuid.uuid4().hex[:4]}"
    doc["created_at"] = iso_now()
    doc["updated_at"] = iso_now()
    res = await db[collection].insert_one(doc)
    await log_activity(user, "create", resource, str(res.inserted_id), None, ser(doc))
    return ser(await db[collection].find_one({"_id": res.inserted_id}))


@router.put("/resources/{resource}/{item_id}")
async def update_item(resource: str, item_id: str, payload: dict, request: Request):
    user, collection = await _guard(request, resource)
    existing = await db[collection].find_one({"_id": oid(item_id)})
    if not existing:
        raise HTTPException(status_code=404, detail="Data tidak ditemukan")
    update = {k: v for k, v in payload.items()
              if k not in ("id", "_id", "created_at", "password_hash", "source")}
    if "slug" in update and update["slug"]:
        update["slug"] = slugify(update["slug"])
    update["updated_at"] = iso_now()
    await db[collection].update_one({"_id": existing["_id"]}, {"$set": update})
    await log_activity(user, "update", resource, item_id, ser(existing), update)
    return ser(await db[collection].find_one({"_id": existing["_id"]}))


@router.delete("/resources/{resource}/{item_id}")
async def delete_item(resource: str, item_id: str, request: Request):
    user, collection = await _guard(request, resource)
    existing = await db[collection].find_one({"_id": oid(item_id)})
    if not existing:
        raise HTTPException(status_code=404, detail="Data tidak ditemukan")
    if resource in ("vehicles", "promotions", "articles", "events", "media"):
        await db[collection].update_one({"_id": existing["_id"]},
                                        {"$set": {"status": "archived", "is_deleted": True,
                                                  "updated_at": iso_now()}})
        action = "archive"
    else:
        await db[collection].delete_one({"_id": existing["_id"]})
        action = "delete"
    await log_activity(user, action, resource, item_id, ser(existing), None)
    return {"success": True, "action": action}


class BulkInput(BaseModel):
    ids: list[str]
    action: str
    value: Optional[str] = None


@router.post("/resources/{resource}/bulk")
async def bulk_action(resource: str, payload: BulkInput, request: Request):
    user, collection = await _guard(request, resource)
    ids = [oid(i) for i in payload.ids]
    if payload.action == "delete":
        result = await db[collection].delete_many({"_id": {"$in": ids}})
        await log_activity(user, "bulk_delete", resource, ",".join(payload.ids))
        return {"affected": result.deleted_count}
    if payload.action == "status" and payload.value:
        result = await db[collection].update_many({"_id": {"$in": ids}},
                                                 {"$set": {"status": payload.value, "updated_at": iso_now()}})
        await log_activity(user, f"bulk_status:{payload.value}", resource, ",".join(payload.ids))
        return {"affected": result.modified_count}
    raise HTTPException(status_code=422, detail="Aksi tidak valid")


@router.get("/export/{resource}")
async def export_resource(resource: str, request: Request, format: str = "csv"):
    user, collection = await _guard(request, resource)
    docs = [ser(d) for d in await db[collection].find().to_list(5000)]
    if format == "json":
        return Response(content=json.dumps(docs, ensure_ascii=False, indent=2),
                        media_type="application/json",
                        headers={"Content-Disposition": f"attachment; filename={resource}.json"})
    if not docs:
        return Response(content="", media_type="text/csv")
    keys = sorted({k for d in docs for k in d.keys()})
    buf = io.StringIO()
    writer = csv.DictWriter(buf, fieldnames=keys, extrasaction="ignore")
    writer.writeheader()
    for d in docs:
        writer.writerow({k: json.dumps(v, ensure_ascii=False) if isinstance(v, (dict, list)) else v
                         for k, v in d.items()})
    return Response(content=buf.getvalue(), media_type="text/csv",
                    headers={"Content-Disposition": f"attachment; filename={resource}.csv"})


# ---------- Leads / test drive workflow ----------
LEAD_STATUSES = ["new", "contacted", "qualified", "test_drive_scheduled", "negotiation",
                 "booking", "won", "lost", "follow_up"]
TD_STATUSES = ["requested", "confirmed", "rescheduled", "completed", "cancelled"]


class StatusInput(BaseModel):
    status: str
    note: Optional[str] = None
    preferred_date: Optional[str] = None
    preferred_time: Optional[str] = None
    assigned_to: Optional[str] = None


@router.post("/leads/{lead_id}/status")
async def update_lead_status(lead_id: str, payload: StatusInput, user: dict = Depends(require_perm("leads"))):
    if payload.status not in LEAD_STATUSES:
        raise HTTPException(status_code=422, detail="Status tidak valid")
    lead = await db.leads.find_one({"_id": oid(lead_id)})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead tidak ditemukan")
    update = {"status": payload.status, "updated_at": iso_now()}
    if payload.assigned_to is not None:
        update["assigned_to"] = payload.assigned_to
    push = {}
    if payload.note:
        push = {"notes": {"text": payload.note, "author": user["email"], "created_at": iso_now()}}
    ops = {"$set": update}
    if push:
        ops["$push"] = push
    await db.leads.update_one({"_id": lead["_id"]}, ops)
    await log_activity(user, "lead_status", "leads", lead_id, {"status": lead.get("status")}, update)
    return ser(await db.leads.find_one({"_id": lead["_id"]}))


@router.post("/test-drives/{td_id}/status")
async def update_td_status(td_id: str, payload: StatusInput, user: dict = Depends(require_perm("test_drives"))):
    if payload.status not in TD_STATUSES:
        raise HTTPException(status_code=422, detail="Status tidak valid")
    td = await db.test_drive_requests.find_one({"_id": oid(td_id)})
    if not td:
        raise HTTPException(status_code=404, detail="Permintaan tidak ditemukan")
    update = {"status": payload.status, "updated_at": iso_now()}
    if payload.note:
        update["admin_notes"] = payload.note
    if payload.preferred_date:
        update["preferred_date"] = payload.preferred_date
    if payload.preferred_time:
        update["preferred_time"] = payload.preferred_time
    await db.test_drive_requests.update_one({"_id": td["_id"]}, {"$set": update})
    await log_activity(user, "test_drive_status", "test_drives", td_id, {"status": td.get("status")}, update)
    return ser(await db.test_drive_requests.find_one({"_id": td["_id"]}))


# ---------- Settings / homepage ----------
@router.get("/settings")
async def get_settings(user: dict = Depends(require_perm("settings"))):
    doc = await db.site_settings.find_one({"_key": "site_settings"})
    return ser(doc)


@router.put("/settings")
async def update_settings(payload: dict, user: dict = Depends(require_perm("settings"))):
    existing = await db.site_settings.find_one({"_key": "site_settings"})
    update = {k: v for k, v in payload.items() if k not in ("id", "_id", "_key")}
    update["updated_at"] = iso_now()
    await db.site_settings.update_one({"_key": "site_settings"}, {"$set": update}, upsert=True)
    await log_activity(user, "update", "site_settings", "site_settings", ser(existing), update)
    return ser(await db.site_settings.find_one({"_key": "site_settings"}))


@router.get("/homepage")
async def get_homepage(user: dict = Depends(require_perm("homepage"))):
    return ser(await db.pages.find_one({"slug": "home"}))


@router.put("/homepage")
async def update_homepage(payload: dict, user: dict = Depends(require_perm("homepage"))):
    existing = await db.pages.find_one({"slug": "home"})
    update = {"sections": payload.get("sections", (existing or {}).get("sections", {})),
              "status": payload.get("status", (existing or {}).get("status", "published")),
              "updated_at": iso_now()}
    await db.pages.update_one({"slug": "home"}, {"$set": update}, upsert=True)
    await log_activity(user, "update", "homepage", "home", ser(existing), {"status": update["status"]})
    return ser(await db.pages.find_one({"slug": "home"}))


# ---------- Media ----------
MAX_UPLOAD_MB = 15
ALLOWED_EXT = set(MIME_TYPES.keys())


@router.post("/media/upload", status_code=201)
async def upload_media(file: UploadFile = File(...), user: dict = Depends(require_perm("media"))):
    filename = file.filename or "file"
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext not in ALLOWED_EXT:
        raise HTTPException(status_code=422, detail=f"Tipe file tidak diizinkan: .{ext}")
    data = await file.read()
    if len(data) > MAX_UPLOAD_MB * 1024 * 1024:
        raise HTTPException(status_code=413, detail=f"Ukuran file maksimal {MAX_UPLOAD_MB}MB")
    path = f"{APP_NAME}/uploads/{user['id']}/{uuid.uuid4()}.{ext}"
    try:
        result = put_object(path, data, MIME_TYPES[ext])
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Upload gagal: {exc}")
    doc = {
        "storage_path": result["path"], "original_filename": filename,
        "content_type": MIME_TYPES[ext], "size": result.get("size", len(data)),
        "kind": "pdf" if ext == "pdf" else ("video" if ext == "mp4" else "image"),
        "folder": "general", "alt_text": "", "caption": "",
        "is_deleted": False, "uploaded_by": user["email"],
        "status": "published", "created_at": iso_now(), "updated_at": iso_now(),
    }
    res = await db.media.insert_one(doc)
    await log_activity(user, "upload", "media", str(res.inserted_id), None, {"file": filename})
    saved = ser(await db.media.find_one({"_id": res.inserted_id}))
    saved["url"] = f"/api/files/{result['path']}"
    return saved


# ---------- Analytics ----------
@router.get("/analytics/overview")
async def analytics_overview(days: int = 30, user: dict = Depends(require_perm("analytics"))):
    since = (now_utc() - timedelta(days=days)).isoformat()

    async def count(coll, query):
        return await db[coll].count_documents(query)

    total_leads = await count("leads", {})
    new_leads = await count("leads", {"created_at": {"$gte": since}})
    qualified = await count("leads", {"status": {"$in": ["qualified", "negotiation", "booking", "won"]}})
    won = await count("leads", {"status": "won"})
    test_drives = await count("test_drive_requests", {})
    wa_clicks = await count("analytics_events", {"event": "click_whatsapp", "created_at": {"$gte": since}})
    brochures = await count("analytics_events", {"event": "brochure_download", "created_at": {"$gte": since}})
    page_views = await count("analytics_events", {"event": "page_view", "created_at": {"$gte": since}})
    visitors = len(await db.analytics_events.distinct("session_id", {"created_at": {"$gte": since}}))
    promos = await db.promotions.find({"status": {"$nin": ["draft", "archived"]}}).to_list(200)
    today = iso_now()
    active_promos = sum(1 for p in promos
                        if (not p.get("start_date") or p["start_date"] <= today)
                        and (not p.get("end_date") or p["end_date"] >= today))

    async def group(coll, field, match=None):
        pipeline = [{"$match": match or {}}, {"$group": {"_id": f"${field}", "count": {"$sum": 1}}},
                    {"$sort": {"count": -1}}, {"$limit": 10}]
        rows = await db[coll].aggregate(pipeline).to_list(10)
        return [{"label": (r["_id"] or "direct"), "count": r["count"]} for r in rows]

    leads_over_time_raw = await db.leads.aggregate([
        {"$match": {"created_at": {"$gte": since}}},
        {"$group": {"_id": {"$substr": ["$created_at", 0, 10]}, "count": {"$sum": 1}}},
        {"$sort": {"_id": 1}},
    ]).to_list(200)

    return {
        "cards": {
            "total_leads": total_leads, "new_leads": new_leads, "qualified_leads": qualified,
            "won_leads": won, "test_drives": test_drives, "active_promotions": active_promos,
            "visitors": visitors, "page_views": page_views, "whatsapp_clicks": wa_clicks,
            "brochure_downloads": brochures,
            "conversion_rate": round((won / total_leads * 100), 1) if total_leads else 0,
        },
        "leads_over_time": [{"date": r["_id"], "count": r["count"]} for r in leads_over_time_raw],
        "leads_by_source": await group("leads", "lead_source"),
        "leads_by_vehicle": await group("leads", "vehicle_name"),
        "leads_by_campaign": await group("leads", "utm_campaign"),
        "leads_by_status": await group("leads", "status"),
        "vehicle_views": [{"label": v["name"], "count": v.get("views", 0)} for v in
                          await db.vehicles.find({}, {"name": 1, "views": 1}).sort("views", -1).to_list(10)],
        "funnel": [
            {"stage": "Kunjungan", "count": visitors},
            {"stage": "Lihat Model", "count": await count("analytics_events", {"event": "vehicle_view", "created_at": {"$gte": since}})},
            {"stage": "Klik CTA", "count": wa_clicks + await count("analytics_events", {"event": "click_test_drive", "created_at": {"$gte": since}})},
            {"stage": "Lead", "count": total_leads},
            {"stage": "Won", "count": won},
        ],
        "days": days,
    }


@router.get("/activity-logs")
async def activity_logs(page: int = 1, limit: int = Query(30, le=200),
                        user: dict = Depends(require_perm("logs"))):
    total = await db.activity_logs.count_documents({})
    docs = await db.activity_logs.find().sort("created_at", -1) \
        .skip((page - 1) * limit).limit(limit).to_list(limit)
    return {"items": [ser(d) for d in docs], "total": total, "page": page, "limit": limit}


# ---------- Import / Sync ----------
class ImportInput(BaseModel):
    url: Optional[str] = None


class ApproveInput(BaseModel):
    import_id: str
    record_ids: list[str]
    action: str = "approve"


def _scrape_candidates(url: str) -> list[dict]:
    resp = requests.get(url, timeout=25, headers={"User-Agent": "BYDBIPO-Showroom-Importer/1.0"})
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")
    candidates: dict[str, dict] = {}
    for img in soup.find_all("img"):
        src = img.get("src") or ""
        if not src or "/web/image/" not in src:
            continue
        if src.startswith("/"):
            src = url.rstrip("/") + src
        raw = (img.get("alt") or src.rsplit("/", 1)[-1]).replace("%20", " ")
        raw = re.sub(r"[-_]?Photoroom", "", raw, flags=re.I)
        raw = re.sub(r"\.(webp|png|jpe?g)$", "", raw, flags=re.I)
        raw = re.sub(r"[^A-Za-z0-9 ]+", " ", raw)
        name_match = re.search(r"(atto\s*\d|dolphin|seal(?:ion)?\s*\d?|m6(?:\s*dm[- ]?i)?|denza\s*d9)", raw, re.I)
        if not name_match:
            continue
        model = re.sub(r"\s+", " ", name_match.group(1)).strip().title()
        name = f"BYD {model}" if not model.lower().startswith("denza") else model
        slug = slugify(name)
        if slug in candidates:
            continue
        category = "SUV" if re.search(r"atto 3|sealion", name, re.I) else \
            ("Sedan" if re.search(r"seal$", name, re.I) else
             ("MPV" if re.search(r"m6|d9", name, re.I) else "Hatchback"))
        candidates[slug] = {
            "name": name, "slug": slug, "category": category,
            "powertrain": "Hybrid" if re.search(r"dm", name, re.I) else "Listrik (BEV)",
            "hero_image": src, "source_url": url,
        }
    return list(candidates.values())


@router.post("/import/run")
async def run_import(payload: ImportInput, user: dict = Depends(require_perm("import"))):
    import os
    url = payload.url or os.environ.get("IMPORT_SOURCE_URL", "https://byd.bipoauto.com/")
    log = {"source_url": url, "status": "running", "started_at": iso_now(),
           "created_by": user["email"], "records_found": 0, "errors": []}
    res = await db.imports.insert_one(log)
    import_id = str(res.inserted_id)
    try:
        candidates = _scrape_candidates(url)
    except Exception as exc:
        await db.imports.update_one({"_id": res.inserted_id},
                                    {"$set": {"status": "failed", "finished_at": iso_now(),
                                              "errors": [str(exc)]}})
        raise HTTPException(status_code=502,
                            detail=f"Import gagal mengakses sumber. Anda tetap dapat menambah data manual. ({exc})")
    inserted = 0
    for c in candidates:
        existing = await db.vehicles.find_one({"slug": c["slug"]})
        await db.import_records.insert_one({
            "import_id": import_id, "data": c, "slug": c["slug"],
            "match_type": "update" if existing else "create",
            "existing_id": str(existing["_id"]) if existing else None,
            "state": "pending", "created_at": iso_now(),
        })
        inserted += 1
    await db.imports.update_one({"_id": res.inserted_id},
                                {"$set": {"status": "pending_review", "records_found": inserted,
                                          "finished_at": iso_now()}})
    await log_activity(user, "import_run", "imports", import_id, None, {"found": inserted, "url": url})
    return {"import_id": import_id, "records_found": inserted, "status": "pending_review"}


@router.get("/import/history")
async def import_history(user: dict = Depends(require_perm("import"))):
    docs = await db.imports.find().sort("started_at", -1).to_list(50)
    return [ser(d) for d in docs]


@router.get("/import/{import_id}/records")
async def import_records(import_id: str, user: dict = Depends(require_perm("import"))):
    docs = await db.import_records.find({"import_id": import_id}).to_list(500)
    return [ser(d) for d in docs]


@router.post("/import/apply")
async def apply_import(payload: ApproveInput, user: dict = Depends(require_perm("import"))):
    records = await db.import_records.find(
        {"_id": {"$in": [oid(i) for i in payload.record_ids]}}).to_list(500)
    applied, skipped = 0, 0
    for rec in records:
        if payload.action == "reject":
            await db.import_records.update_one({"_id": rec["_id"]}, {"$set": {"state": "rejected"}})
            skipped += 1
            continue
        data = rec["data"]
        existing = await db.vehicles.find_one({"slug": data["slug"]})
        if existing:
            # never overwrite manually edited fields
            update = {k: v for k, v in data.items()
                      if not existing.get(k) or existing.get("source") == "import"}
            update["updated_at"] = iso_now()
            update["source"] = existing.get("source") or "import"
            await db.vehicles.update_one({"_id": existing["_id"]}, {"$set": update})
        else:
            await db.vehicles.insert_one({
                **DEFAULTS["vehicles"], **data, "status": "draft", "source": "import",
                "short_description": f"{data['name']} — hubungi sales untuk informasi harga dan spesifikasi terbaru.",
                "starting_price": None, "images": [{"url": data["hero_image"], "type": "exterior", "alt": data["name"]}],
                "created_at": iso_now(), "updated_at": iso_now(),
            })
        await db.import_records.update_one({"_id": rec["_id"]}, {"$set": {"state": "approved"}})
        applied += 1
    await log_activity(user, f"import_{payload.action}", "imports", payload.import_id,
                       None, {"applied": applied, "rejected": skipped})
    return {"applied": applied, "rejected": skipped}
