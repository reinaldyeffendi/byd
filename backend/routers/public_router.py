from datetime import datetime, timezone
from typing import Optional, List

from fastapi import APIRouter, HTTPException, Request, Query
from pydantic import BaseModel, EmailStr, Field, field_validator

from core import db, ser, iso_now, now_utc, log_activity

router = APIRouter(prefix="/public", tags=["public"])

PUBLISHED = {"status": "published"}


def promo_state(p: dict) -> str:
    if p.get("status") in ("draft", "archived"):
        return p["status"]
    today = iso_now()
    start, end = p.get("start_date"), p.get("end_date")
    if start and start > today:
        return "scheduled"
    if end and end < today:
        return "expired"
    return "active"


async def get_settings() -> dict:
    doc = await db.site_settings.find_one({"_key": "site_settings"})
    return ser(doc) or {}


@router.get("/settings")
async def settings():
    s = await get_settings()
    s.pop("_key", None)
    return s


@router.get("/homepage")
async def homepage():
    page = await db.pages.find_one({"slug": "home"})
    if not page:
        raise HTTPException(status_code=404, detail="Homepage belum dikonfigurasi")
    return ser(page)


@router.get("/pages/{slug}")
async def page(slug: str):
    doc = await db.pages.find_one({"slug": slug, "status": "published"})
    if not doc:
        raise HTTPException(status_code=404, detail="Halaman tidak ditemukan")
    return ser(doc)


# ---------- Vehicles ----------
@router.get("/vehicles")
async def vehicles(
    q: Optional[str] = None,
    category: Optional[str] = None,
    powertrain: Optional[str] = None,
    seating: Optional[int] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    min_range: Optional[int] = None,
    featured: Optional[bool] = None,
    sort: str = "featured",
    limit: int = Query(60, le=100),
):
    query: dict = dict(PUBLISHED)
    if q:
        query["$or"] = [{"name": {"$regex": q, "$options": "i"}},
                        {"short_description": {"$regex": q, "$options": "i"}},
                        {"category": {"$regex": q, "$options": "i"}}]
    if category:
        query["category"] = {"$in": category.split(",")}
    if powertrain:
        query["powertrain"] = {"$regex": powertrain, "$options": "i"}
    if seating:
        query["seating"] = {"$gte": seating}
    if min_range:
        query["range_km"] = {"$gte": min_range}
    if featured is not None:
        query["featured"] = featured
    price_q = {}
    if min_price is not None:
        price_q["$gte"] = min_price
    if max_price is not None:
        price_q["$lte"] = max_price
    if price_q:
        query["starting_price"] = price_q

    sorts = {
        "featured": [("featured", -1), ("created_at", 1)],
        "price_asc": [("starting_price", 1)],
        "price_desc": [("starting_price", -1)],
        "newest": [("created_at", -1)],
        "popular": [("views", -1)],
    }
    docs = await db.vehicles.find(query).sort(sorts.get(sort, sorts["featured"])).to_list(limit)
    active_promos = await db.promotions.find({"status": {"$nin": ["draft", "archived"]}}).to_list(200)
    promo_slugs = set()
    for p in active_promos:
        if promo_state(p) == "active":
            promo_slugs.update(p.get("vehicle_slugs") or [])
    out = []
    for d in docs:
        v = ser(d)
        v["has_promotion"] = v["slug"] in promo_slugs
        out.append(v)
    return out


@router.get("/vehicles/{slug}")
async def vehicle_detail(slug: str):
    doc = await db.vehicles.find_one({"slug": slug, "status": "published"})
    if not doc:
        raise HTTPException(status_code=404, detail="Model tidak ditemukan")
    await db.vehicles.update_one({"_id": doc["_id"]}, {"$inc": {"views": 1}})
    vehicle = ser(doc)
    promos = await db.promotions.find({"vehicle_slugs": slug, "status": {"$nin": ["draft", "archived"]}}).to_list(20)
    vehicle["promotions"] = [ser(p) | {"state": promo_state(p)} for p in promos if promo_state(p) == "active"]
    arts = await db.articles.find(PUBLISHED).sort("published_at", -1).to_list(3)
    vehicle["related_articles"] = [ser(a) for a in arts]
    related = await db.vehicles.find({"category": doc.get("category"), "slug": {"$ne": slug}, **PUBLISHED}).to_list(3)
    vehicle["related_vehicles"] = [ser(r) for r in related]
    return vehicle


@router.get("/compare")
async def compare(models: str = Query(..., description="slug dipisahkan koma")):
    slugs = [s.strip() for s in models.split(",") if s.strip()][:3]
    if not slugs:
        raise HTTPException(status_code=422, detail="Minimal satu model diperlukan")
    docs = await db.vehicles.find({"slug": {"$in": slugs}, **PUBLISHED}).to_list(3)
    ordered = sorted([ser(d) for d in docs], key=lambda v: slugs.index(v["slug"]))
    return ordered


@router.get("/recommendations")
async def recommendations(viewed: str = "", limit: int = 4):
    viewed_slugs = [s for s in viewed.split(",") if s]
    categories = []
    if viewed_slugs:
        docs = await db.vehicles.find({"slug": {"$in": viewed_slugs}}).to_list(10)
        categories = list({d.get("category") for d in docs if d.get("category")})
    query = dict(PUBLISHED)
    if categories:
        query["category"] = {"$in": categories}
    if viewed_slugs:
        query["slug"] = {"$nin": viewed_slugs}
    docs = await db.vehicles.find(query).sort([("featured", -1), ("views", -1)]).to_list(limit)
    if not docs:
        docs = await db.vehicles.find(PUBLISHED).sort("featured", -1).to_list(limit)
    return [ser(d) for d in docs]


# ---------- Promotions / Articles / Events / Testimonials ----------
@router.get("/promotions")
async def promotions(vehicle: Optional[str] = None, include_expired: bool = False, limit: int = 50):
    query: dict = {"status": {"$nin": ["draft", "archived"]}}
    if vehicle:
        query["vehicle_slugs"] = vehicle
    docs = await db.promotions.find(query).sort("start_date", -1).to_list(limit)
    out = []
    for d in docs:
        state = promo_state(d)
        if state == "expired" and not include_expired:
            continue
        out.append(ser(d) | {"state": state})
    return out


@router.get("/promotions/{slug}")
async def promotion_detail(slug: str):
    doc = await db.promotions.find_one({"slug": slug, "status": {"$nin": ["draft", "archived"]}})
    if not doc:
        raise HTTPException(status_code=404, detail="Promo tidak ditemukan")
    data = ser(doc) | {"state": promo_state(doc)}
    if doc.get("vehicle_slugs"):
        vs = await db.vehicles.find({"slug": {"$in": doc["vehicle_slugs"]}, **PUBLISHED}).to_list(10)
        data["vehicles"] = [ser(v) for v in vs]
    else:
        data["vehicles"] = []
    return data


@router.get("/articles")
async def articles(category: Optional[str] = None, q: Optional[str] = None, limit: int = 30):
    query: dict = dict(PUBLISHED)
    if category:
        query["category"] = category
    if q:
        query["title"] = {"$regex": q, "$options": "i"}
    docs = await db.articles.find(query).sort("published_at", -1).to_list(limit)
    return [ser(d) for d in docs]


@router.get("/articles/{slug}")
async def article_detail(slug: str):
    doc = await db.articles.find_one({"slug": slug, **PUBLISHED})
    if not doc:
        raise HTTPException(status_code=404, detail="Artikel tidak ditemukan")
    data = ser(doc)
    related = await db.articles.find({"category": doc.get("category"), "slug": {"$ne": slug}, **PUBLISHED}).to_list(3)
    data["related"] = [ser(r) for r in related]
    return data


@router.get("/events")
async def events(limit: int = 30):
    docs = await db.events.find(PUBLISHED).sort("event_date", -1).to_list(limit)
    return [ser(d) for d in docs]


@router.get("/events/{slug}")
async def event_detail(slug: str):
    doc = await db.events.find_one({"slug": slug, **PUBLISHED})
    if not doc:
        raise HTTPException(status_code=404, detail="Event tidak ditemukan")
    return ser(doc)


@router.get("/testimonials")
async def testimonials(limit: int = 12):
    docs = await db.testimonials.find(PUBLISHED).sort("created_at", -1).to_list(limit)
    return [ser(d) for d in docs]


# ---------- Lead capture ----------
class Attribution(BaseModel):
    lead_source: Optional[str] = "website"
    campaign: Optional[str] = None
    landing_page: Optional[str] = None
    utm_source: Optional[str] = None
    utm_medium: Optional[str] = None
    utm_campaign: Optional[str] = None
    utm_content: Optional[str] = None
    utm_term: Optional[str] = None
    device: Optional[str] = None
    session_id: Optional[str] = None


class LeadInput(Attribution):
    full_name: str = Field(min_length=2, max_length=120)
    whatsapp: str = Field(min_length=8, max_length=20)
    email: Optional[EmailStr] = None
    city: Optional[str] = Field(default=None, max_length=80)
    vehicle_slug: Optional[str] = None
    variant: Optional[str] = None
    budget: Optional[str] = None
    timeline: Optional[str] = None
    financing: Optional[str] = None
    trade_in: Optional[bool] = False
    promotion_slug: Optional[str] = None
    message: Optional[str] = Field(default=None, max_length=1000)

    @field_validator("whatsapp")
    @classmethod
    def clean_phone(cls, v: str) -> str:
        digits = "".join(c for c in v if c.isdigit())
        if len(digits) < 8:
            raise ValueError("Nomor WhatsApp tidak valid")
        return digits


class TestDriveInput(Attribution):
    full_name: str = Field(min_length=2, max_length=120)
    whatsapp: str = Field(min_length=8, max_length=20)
    email: Optional[EmailStr] = None
    vehicle_slug: str
    preferred_date: str
    preferred_time: str
    location: Optional[str] = None
    notes: Optional[str] = Field(default=None, max_length=1000)

    @field_validator("whatsapp")
    @classmethod
    def clean_phone(cls, v: str) -> str:
        digits = "".join(c for c in v if c.isdigit())
        if len(digits) < 8:
            raise ValueError("Nomor WhatsApp tidak valid")
        return digits


async def _dup_guard(collection, whatsapp: str, extra: dict):
    recent = await collection.find_one({"whatsapp": whatsapp, **extra},
                                       sort=[("created_at", -1)])
    if recent:
        created = recent.get("created_at", "")
        if created and (now_utc() - datetime.fromisoformat(created)).total_seconds() < 60:
            return recent
    return None


@router.post("/leads", status_code=201)
async def create_lead(payload: LeadInput, request: Request):
    data = payload.model_dump()
    dup = await _dup_guard(db.leads, data["whatsapp"], {"vehicle_slug": data.get("vehicle_slug")})
    if dup:
        return {"id": str(dup["_id"]), "duplicate": True,
                "message": "Permintaan Anda sudah kami terima."}
    vehicle_name = None
    if data.get("vehicle_slug"):
        v = await db.vehicles.find_one({"slug": data["vehicle_slug"]}, {"name": 1})
        vehicle_name = (v or {}).get("name")
    doc = data | {
        "vehicle_name": vehicle_name,
        "status": "new",
        "assigned_to": None,
        "notes": [],
        "ip": request.client.host if request.client else None,
        "user_agent": request.headers.get("user-agent", "")[:300],
        "created_at": iso_now(),
        "updated_at": iso_now(),
    }
    res = await db.leads.insert_one(doc)
    await db.analytics_events.insert_one({"event": "lead_submit", "session_id": data.get("session_id"),
                                          "vehicle_slug": data.get("vehicle_slug"),
                                          "utm_source": data.get("utm_source"),
                                          "created_at": iso_now()})
    return {"id": str(res.inserted_id), "duplicate": False,
            "message": "Terima kasih! Sales consultant kami akan menghubungi Anda."}


@router.post("/test-drives", status_code=201)
async def create_test_drive(payload: TestDriveInput, request: Request):
    data = payload.model_dump()
    v = await db.vehicles.find_one({"slug": data["vehicle_slug"], **PUBLISHED}, {"name": 1})
    if not v:
        raise HTTPException(status_code=422, detail="Model tidak ditemukan")
    dup = await _dup_guard(db.test_drive_requests, data["whatsapp"], {"vehicle_slug": data["vehicle_slug"]})
    if dup:
        return {"id": str(dup["_id"]), "duplicate": True, "message": "Permintaan test drive Anda sudah kami terima."}
    doc = data | {"vehicle_name": v.get("name"), "status": "requested", "admin_notes": "",
                  "created_at": iso_now(), "updated_at": iso_now()}
    res = await db.test_drive_requests.insert_one(doc)
    lead = {k: data.get(k) for k in ("full_name", "whatsapp", "email", "vehicle_slug", "lead_source",
                                     "campaign", "landing_page", "utm_source", "utm_medium",
                                     "utm_campaign", "utm_content", "utm_term", "device", "session_id")}
    await db.leads.insert_one(lead | {"vehicle_name": v.get("name"), "status": "test_drive_scheduled",
                                      "lead_source": data.get("lead_source") or "test_drive",
                                      "notes": [], "assigned_to": None,
                                      "created_at": iso_now(), "updated_at": iso_now()})
    await db.analytics_events.insert_one({"event": "click_test_drive", "session_id": data.get("session_id"),
                                          "vehicle_slug": data["vehicle_slug"], "created_at": iso_now()})
    return {"id": str(res.inserted_id), "duplicate": False,
            "message": "Permintaan test drive terkirim. Kami akan mengonfirmasi jadwal Anda."}


# ---------- Tracking ----------
class TrackInput(BaseModel):
    event: str = Field(max_length=60)
    session_id: Optional[str] = None
    path: Optional[str] = None
    vehicle_slug: Optional[str] = None
    promotion_slug: Optional[str] = None
    article_slug: Optional[str] = None
    device: Optional[str] = None
    utm_source: Optional[str] = None
    utm_medium: Optional[str] = None
    utm_campaign: Optional[str] = None
    utm_content: Optional[str] = None
    utm_term: Optional[str] = None
    meta: Optional[dict] = None


ALLOWED_EVENTS = {"page_view", "vehicle_view", "promotion_view", "compare_vehicle", "click_whatsapp",
                  "click_test_drive", "lead_submit", "brochure_download", "financing_calculation",
                  "promotion_cta", "form_start", "article_view"}


@router.post("/track", status_code=202)
async def track(payload: TrackInput):
    if payload.event not in ALLOWED_EVENTS:
        raise HTTPException(status_code=422, detail="Event tidak dikenal")
    doc = payload.model_dump()
    doc["created_at"] = iso_now()
    await db.analytics_events.insert_one(doc)
    if payload.session_id:
        await db.utm_sessions.update_one(
            {"session_id": payload.session_id},
            {"$setOnInsert": {"created_at": iso_now(),
                              "utm_source": payload.utm_source, "utm_medium": payload.utm_medium,
                              "utm_campaign": payload.utm_campaign, "utm_content": payload.utm_content,
                              "utm_term": payload.utm_term, "landing_page": payload.path},
             "$set": {"last_seen": iso_now()},
             "$inc": {"events": 1}},
            upsert=True)
    return {"ok": True}


# ---------- Financing ----------
class FinancingInput(BaseModel):
    price: float = Field(gt=0)
    dp_percent: float = Field(ge=0, le=90)
    months: int = Field(ge=6, le=84)
    interest_rate: Optional[float] = None
    insurance_percent: Optional[float] = None
    extra_fees: Optional[float] = 0


@router.post("/financing/simulate")
async def simulate(payload: FinancingInput):
    settings = await get_settings()
    fin = settings.get("financing", {})
    rate = payload.interest_rate if payload.interest_rate is not None else fin.get("interest_rate", 6.5)
    ins_pct = payload.insurance_percent if payload.insurance_percent is not None else fin.get("insurance_percent", 2.5)
    admin_fee = fin.get("admin_fee", 0)
    dp = payload.price * payload.dp_percent / 100
    principal = payload.price - dp
    years = payload.months / 12
    insurance = payload.price * ins_pct / 100 * years
    interest = principal * rate / 100 * years
    fees = (payload.extra_fees or 0) + admin_fee
    total_financed = principal + interest + insurance + fees
    monthly = total_financed / payload.months
    await db.analytics_events.insert_one({"event": "financing_calculation", "created_at": iso_now(),
                                          "meta": {"price": payload.price, "months": payload.months}})
    return {
        "dp_amount": round(dp),
        "financing_amount": round(principal),
        "monthly_installment": round(monthly),
        "total_interest": round(interest),
        "insurance": round(insurance),
        "fees": round(fees),
        "total_payment": round(dp + total_financed),
        "interest_rate": rate,
        "disclaimer": fin.get("disclaimer", "Hasil ini merupakan estimasi, bukan penawaran resmi."),
    }
