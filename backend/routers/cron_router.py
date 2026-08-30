"""Cron endpoint: publikasi terjadwal & pengarsipan promo kedaluwarsa."""
import hmac
import os

from fastapi import APIRouter, BackgroundTasks, Header, HTTPException

from core import db, iso_now, log_activity

router = APIRouter(prefix="/cron", tags=["cron"])

SCHEDULED_COLLECTIONS = [
    ("promotions", "start_date"),
    ("articles", "published_at"),
    ("events", "event_date"),
    ("vehicles", "created_at"),
]


async def _run_publish(run_id: str):
    if await db.cron_runs.find_one({"run_id": run_id}):
        return
    await db.cron_runs.insert_one({"run_id": run_id, "job": "publish-scheduled",
                                   "created_at": iso_now()})
    now = iso_now()
    published, archived = 0, 0
    for collection, date_field in SCHEDULED_COLLECTIONS:
        result = await db[collection].update_many(
            {"status": "scheduled", date_field: {"$lte": now}},
            {"$set": {"status": "published", "updated_at": now}},
        )
        published += result.modified_count
    expired = await db.promotions.update_many(
        {"status": "published", "end_date": {"$ne": None, "$lt": now}},
        {"$set": {"status": "archived", "updated_at": now}},
    )
    archived += expired.modified_count
    await db.cron_runs.update_one({"run_id": run_id},
                                  {"$set": {"published": published, "archived": archived,
                                            "finished_at": iso_now()}})
    if published or archived:
        await log_activity(None, "cron_publish_scheduled", "content", run_id, None,
                           {"published": published, "archived": archived})


@router.post("/publish-scheduled")
async def publish_scheduled(background: BackgroundTasks, payload: dict | None = None,
                            authorization: str = Header(None),
                            x_webhook_id: str = Header(None)):
    # Cron endpoints must ack 2xx immediately; enqueue/background the actual work.
    secret = os.environ["WEBHOOK_CRON_SECRET"]
    token = authorization[7:] if (authorization or "").startswith("Bearer ") else ""
    if not token or not hmac.compare_digest(token, secret):
        raise HTTPException(status_code=401, detail="Unauthorized")
    run_id = x_webhook_id or (payload or {}).get("run_id") or iso_now()
    background.add_task(_run_publish, run_id)
    return {"accepted": True, "run_id": run_id}
