from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).parent / ".env")

import logging
import os

from fastapi import APIRouter, FastAPI, Header, HTTPException, Query, Request, Response
from fastapi.responses import JSONResponse, PlainTextResponse
from starlette.middleware.cors import CORSMiddleware

from core import client, db, get_object, ser, get_current_user
from routers.admin_router import router as admin_router
from routers.auth_router import router as auth_router
from routers.public_router import router as public_router
from seed import run_seed

logging.basicConfig(level=logging.INFO,
                    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("byd")

app = FastAPI(title="BYD BIPO Showroom API", docs_url=None, redoc_url=None)
api_router = APIRouter(prefix="/api")


@api_router.get("/")
async def root():
    return {"service": "byd-bipo-showroom", "status": "ok"}


@api_router.get("/files/{path:path}")
async def serve_file(path: str):
    record = await db.media.find_one({"storage_path": path, "is_deleted": False})
    if not record:
        raise HTTPException(status_code=404, detail="File tidak ditemukan")
    try:
        data, content_type = get_object(path)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Gagal mengambil file: {exc}")
    return Response(content=data, media_type=record.get("content_type", content_type),
                    headers={"Cache-Control": "public, max-age=31536000"})


@api_router.get("/seo/sitemap.xml")
async def sitemap(request: Request):
    base = os.environ.get("PUBLIC_SITE_URL") or str(request.base_url).rstrip("/")
    urls = ["/", "/models", "/promotions", "/articles", "/events", "/compare", "/contact",
            "/test-drive", "/privacy-policy", "/terms", "/cookie-policy"]
    for coll, prefix in (("vehicles", "/models"), ("promotions", "/promotions"),
                         ("articles", "/articles"), ("events", "/events")):
        for doc in await db[coll].find({"status": "published"}, {"slug": 1}).to_list(500):
            if doc.get("slug"):
                urls.append(f"{prefix}/{doc['slug']}")
    body = "".join(f"<url><loc>{base}{u}</loc></url>" for u in urls)
    xml = f'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">{body}</urlset>'
    return Response(content=xml, media_type="application/xml")


api_router.include_router(auth_router)
api_router.include_router(public_router)
api_router.include_router(admin_router)
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def unhandled_exception(request: Request, exc: Exception):
    logger.exception("Unhandled error on %s", request.url.path)
    return JSONResponse(status_code=500,
                        content={"detail": "Terjadi kesalahan pada server. Silakan coba lagi."})


@app.on_event("startup")
async def startup():
    await run_seed()
    try:
        from core import init_storage
        init_storage()
        logger.info("Object storage siap")
    except Exception as exc:
        logger.warning("Storage init gagal: %s", exc)
    logger.info("Startup selesai")


@app.on_event("shutdown")
async def shutdown():
    client.close()
