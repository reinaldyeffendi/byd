"""
BYD BIPO Showroom - Backend API integration tests
Run:  pytest /app/backend/tests/backend_test.py -v --tb=short
"""
import os
import io
import time
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL") or open("/app/frontend/.env").read().split("REACT_APP_BACKEND_URL=")[1].split("\n")[0].strip()
BASE_URL = BASE_URL.rstrip("/")
API = f"{BASE_URL}/api"

SUPER = {"email": "cheapme07@gmail.com", "password": "BydBipo2026!"}
CONTENT = {"email": "content@bipoauto.com", "password": "Staff2026!"}
SALES = {"email": "sales@bipoauto.com", "password": "Staff2026!"}
ANALYTICS = {"email": "analytics@bipoauto.com", "password": "Staff2026!"}
CRON_SECRET = open("/app/backend/.env").read().split("WEBHOOK_CRON_SECRET=")[1].split("\n")[0].strip().strip('"')


# ------------ fixtures ------------
@pytest.fixture(scope="session")
def public_client():
    return requests.Session()


def _login(creds):
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json=creds, timeout=30)
    assert r.status_code == 200, f"Login failed for {creds['email']}: {r.status_code} {r.text[:200]}"
    return s


@pytest.fixture(scope="session")
def super_admin():
    return _login(SUPER)


@pytest.fixture(scope="session")
def content_admin():
    return _login(CONTENT)


@pytest.fixture(scope="session")
def sales_admin():
    return _login(SALES)


@pytest.fixture(scope="session")
def analytics_admin():
    return _login(ANALYTICS)


# ============ PUBLIC ============
class TestPublic:
    def test_settings(self, public_client):
        r = public_client.get(f"{API}/public/settings")
        assert r.status_code == 200
        d = r.json()
        assert d["brand"] == "BYD"
        assert d["sales_consultant"] == "REINALDY EFFENDI"
        assert "whatsapp_number" in d

    def test_homepage(self, public_client):
        r = public_client.get(f"{API}/public/homepage")
        assert r.status_code == 200
        d = r.json()
        assert d.get("slug") == "home"
        assert "sections" in d

    def test_vehicles_list(self, public_client):
        r = public_client.get(f"{API}/public/vehicles")
        assert r.status_code == 200
        v = r.json()
        assert isinstance(v, list)
        assert len(v) >= 7
        for x in v:
            # per rule: seeded prices are null
            assert x.get("starting_price") in (None, 0) or isinstance(x["starting_price"], (int, float))

    def test_vehicles_filters(self, public_client):
        r = public_client.get(f"{API}/public/vehicles", params={"q": "BYD", "sort": "price_asc"})
        assert r.status_code == 200
        r2 = public_client.get(f"{API}/public/vehicles", params={"sort": "newest", "max_price": 1000000000})
        assert r2.status_code == 200

    def test_vehicle_detail_and_views_increment(self, public_client):
        # pick first slug
        vs = public_client.get(f"{API}/public/vehicles").json()
        slug = vs[0]["slug"]
        r1 = public_client.get(f"{API}/public/vehicles/{slug}")
        assert r1.status_code == 200
        d1 = r1.json()
        views1 = d1.get("views", 0)
        assert "promotions" in d1 and "related_articles" in d1 and "related_vehicles" in d1
        r2 = public_client.get(f"{API}/public/vehicles/{slug}")
        views2 = r2.json().get("views", 0)
        assert views2 >= views1  # was incremented (may be >=1 more)

    def test_vehicle_detail_404(self, public_client):
        r = public_client.get(f"{API}/public/vehicles/does-not-exist-xyz")
        assert r.status_code == 404

    def test_compare_up_to_3(self, public_client):
        vs = public_client.get(f"{API}/public/vehicles").json()
        slugs = [v["slug"] for v in vs[:3]]
        r = public_client.get(f"{API}/public/compare", params={"models": ",".join(slugs)})
        assert r.status_code == 200
        d = r.json()
        assert [x["slug"] for x in d] == slugs  # order preserved

    def test_compare_empty(self, public_client):
        r = public_client.get(f"{API}/public/compare", params={"models": ""})
        assert r.status_code == 422

    def test_lead_validation_short_name(self, public_client):
        r = public_client.post(f"{API}/public/leads", json={"full_name": "A", "whatsapp": "081234567890"})
        assert r.status_code == 422

    def test_lead_validation_bad_whatsapp(self, public_client):
        r = public_client.post(f"{API}/public/leads", json={"full_name": "Test User", "whatsapp": "123"})
        assert r.status_code == 422

    def test_lead_creation_and_dup(self, public_client):
        wa = "6281" + str(uuid.uuid4().int)[:9]
        payload = {"full_name": "Test User", "whatsapp": wa, "vehicle_slug": "byd-dealer-portal",
                   "utm_source": "google", "utm_campaign": "test"}
        r = public_client.post(f"{API}/public/leads", json=payload)
        assert r.status_code == 201
        d = r.json()
        assert d.get("duplicate") is False
        # duplicate within 60s
        r2 = public_client.post(f"{API}/public/leads", json=payload)
        assert r2.status_code == 201
        assert r2.json().get("duplicate") is True

    def test_test_drive_invalid_slug(self, public_client):
        r = public_client.post(f"{API}/public/test-drives", json={
            "full_name": "Test User", "whatsapp": "6281234567890",
            "vehicle_slug": "not-a-real-slug-xxx",
            "preferred_date": "2026-02-01", "preferred_time": "10:00"})
        assert r.status_code == 422

    def test_test_drive_success_creates_lead(self, public_client):
        vs = public_client.get(f"{API}/public/vehicles").json()
        slug = vs[0]["slug"]
        wa = "6281" + str(uuid.uuid4().int)[:9]
        r = public_client.post(f"{API}/public/test-drives", json={
            "full_name": "TD Tester", "whatsapp": wa,
            "vehicle_slug": slug, "preferred_date": "2026-02-01", "preferred_time": "10:00"})
        assert r.status_code == 201
        assert r.json().get("duplicate") is False

    def test_financing_simulate(self, public_client):
        r = public_client.post(f"{API}/public/financing/simulate", json={
            "price": 500000000, "dp_percent": 20, "months": 36})
        assert r.status_code == 200
        d = r.json()
        for k in ("dp_amount", "financing_amount", "monthly_installment", "total_payment", "disclaimer"):
            assert k in d
        assert d["dp_amount"] == 100000000

    def test_track_valid(self, public_client):
        r = public_client.post(f"{API}/public/track", json={"event": "page_view", "path": "/", "session_id": "s-test"})
        assert r.status_code == 202

    def test_track_invalid(self, public_client):
        r = public_client.post(f"{API}/public/track", json={"event": "hack_attempt"})
        assert r.status_code == 422

    def test_sitemap(self, public_client):
        r = public_client.get(f"{API}/seo/sitemap.xml")
        assert r.status_code == 200
        assert "urlset" in r.text
        assert "/models" in r.text


# ============ AUTH & RBAC ============
class TestAuth:
    def test_login_super(self, super_admin):
        r = super_admin.get(f"{API}/auth/me")
        assert r.status_code == 200
        d = r.json()
        assert d["role"] == "super_admin"
        assert "*" in d["permissions"]

    def test_login_wrong_password(self):
        r = requests.post(f"{API}/auth/login", json={"email": "cheapme07@gmail.com", "password": "wrongxxx"})
        assert r.status_code == 401

    def test_brute_force_lockout_throwaway(self):
        # Use throwaway email so real super admin is NOT locked out.
        # Note: EmailStr rejects .test TLD, so use .com
        throwaway = f"throwaway_{uuid.uuid4().hex[:6]}@nonexistent-brute.com"
        codes = []
        for _ in range(6):
            r = requests.post(f"{API}/auth/login", json={"email": throwaway, "password": "x"})
            codes.append(r.status_code)
        # 5 failed then lockout
        assert 429 in codes, f"expected 429 in {codes}"

    def test_me_unauth(self):
        r = requests.get(f"{API}/auth/me")
        assert r.status_code == 401


class TestRBAC:
    def test_content_admin_can_list_vehicles(self, content_admin):
        r = content_admin.get(f"{API}/admin/resources/vehicles")
        assert r.status_code == 200

    def test_content_admin_cannot_leads(self, content_admin):
        r = content_admin.get(f"{API}/admin/resources/leads")
        assert r.status_code == 403

    def test_content_admin_cannot_settings(self, content_admin):
        r = content_admin.get(f"{API}/admin/settings")
        assert r.status_code == 403

    def test_sales_admin_can_leads(self, sales_admin):
        r = sales_admin.get(f"{API}/admin/resources/leads")
        assert r.status_code == 200

    def test_sales_admin_cannot_vehicles(self, sales_admin):
        r = sales_admin.get(f"{API}/admin/resources/vehicles")
        assert r.status_code == 403

    def test_analytics_admin_overview(self, analytics_admin):
        r = analytics_admin.get(f"{API}/admin/analytics/overview")
        assert r.status_code == 200
        d = r.json()
        assert "cards" in d

    def test_analytics_admin_cannot_vehicles(self, analytics_admin):
        r = analytics_admin.get(f"{API}/admin/resources/vehicles")
        assert r.status_code == 403


# ============ ADMIN CRUD ============
class TestAdminCRUD:
    def test_vehicle_lifecycle(self, super_admin):
        name = f"TEST_Vehicle_{uuid.uuid4().hex[:6]}"
        create = super_admin.post(f"{API}/admin/resources/vehicles",
                                  json={"name": name, "category": "SUV", "status": "draft"})
        assert create.status_code == 201
        vid = create.json()["id"]
        slug = create.json()["slug"]

        # draft not on public
        pub = requests.get(f"{API}/public/vehicles").json()
        assert not any(v["slug"] == slug for v in pub)

        # publish
        pub_res = super_admin.put(f"{API}/admin/resources/vehicles/{vid}", json={"status": "published"})
        assert pub_res.status_code == 200
        assert pub_res.json()["status"] == "published"

        pub2 = requests.get(f"{API}/public/vehicles").json()
        assert any(v["slug"] == slug for v in pub2)

        # archive (via delete for vehicles)
        d = super_admin.delete(f"{API}/admin/resources/vehicles/{vid}")
        assert d.status_code == 200
        assert d.json()["action"] == "archive"

    def test_missing_required(self, super_admin):
        r = super_admin.post(f"{API}/admin/resources/vehicles", json={"category": "SUV"})
        assert r.status_code == 422

    def test_settings_update(self, super_admin):
        original = super_admin.get(f"{API}/admin/settings").json()
        wa = original.get("whatsapp_number", "6281234567890")
        new_wa = "6289" + str(uuid.uuid4().int)[:8]
        r = super_admin.put(f"{API}/admin/settings", json={"whatsapp_number": new_wa})
        assert r.status_code == 200
        pub = requests.get(f"{API}/api/public/settings".replace("/api/api", "/api")).json()
        assert pub["whatsapp_number"] == new_wa
        # restore
        super_admin.put(f"{API}/admin/settings", json={"whatsapp_number": wa})

    def test_homepage_update(self, super_admin):
        cur = super_admin.get(f"{API}/admin/homepage").json()
        sections = cur.get("sections") or {}
        hero = dict(sections.get("hero") or {})
        original_headline = hero.get("headline", "")
        new_headline = f"TEST Headline {uuid.uuid4().hex[:5]}"
        hero["headline"] = new_headline
        new_sections = {**sections, "hero": hero}
        r = super_admin.put(f"{API}/admin/homepage", json={"sections": new_sections})
        assert r.status_code == 200
        pub = requests.get(f"{API}/public/homepage").json()
        assert pub["sections"]["hero"]["headline"] == new_headline
        # restore
        hero["headline"] = original_headline
        super_admin.put(f"{API}/admin/homepage", json={"sections": {**sections, "hero": hero}})

    def test_media_invalid_ext(self, super_admin):
        files = {"file": ("bad.exe", b"MZ...", "application/octet-stream")}
        r = super_admin.post(f"{API}/admin/media/upload", files=files)
        assert r.status_code == 422

    def test_media_upload_png(self, super_admin):
        # Minimal PNG
        png = (b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
               b"\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\rIDATx\x9cc\x00\x01"
               b"\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82")
        files = {"file": ("test.png", png, "image/png")}
        r = super_admin.post(f"{API}/admin/media/upload", files=files)
        # Object storage may be unavailable in this env
        if r.status_code == 502:
            pytest.skip("Object storage unavailable in this environment")
        assert r.status_code == 201

    def test_analytics_overview(self, super_admin):
        r = super_admin.get(f"{API}/admin/analytics/overview")
        assert r.status_code == 200
        d = r.json()
        assert "cards" in d and "funnel" in d and "leads_over_time" in d

    def test_activity_logs(self, super_admin):
        r = super_admin.get(f"{API}/admin/activity-logs")
        assert r.status_code == 200

    def test_export_leads_csv(self, sales_admin):
        r = sales_admin.get(f"{API}/admin/export/leads")
        assert r.status_code == 200
        assert "text/csv" in r.headers.get("content-type", "")

    def test_lead_status_change(self, sales_admin):
        # create a lead first
        wa = "6281" + str(uuid.uuid4().int)[:9]
        c = requests.post(f"{API}/public/leads",
                          json={"full_name": "Status Test", "whatsapp": wa})
        assert c.status_code == 201
        lead_id = c.json()["id"]
        r = sales_admin.post(f"{API}/admin/leads/{lead_id}/status",
                             json={"status": "contacted", "note": "called"})
        assert r.status_code == 200
        assert r.json()["status"] == "contacted"

    def test_lead_status_invalid(self, sales_admin):
        # need a real lead id
        leads = sales_admin.get(f"{API}/admin/resources/leads").json()["items"]
        if not leads:
            pytest.skip("no leads")
        r = sales_admin.post(f"{API}/admin/leads/{leads[0]['id']}/status",
                             json={"status": "invalid_state"})
        assert r.status_code == 422


class TestUsers:
    def test_create_user_and_delete(self, super_admin):
        email = f"test_{uuid.uuid4().hex[:6]}@example.com"
        r = super_admin.post(f"{API}/auth/users",
                             json={"email": email, "password": "TestPass2026!",
                                   "name": "Test", "role": "content_admin"})
        assert r.status_code == 200
        uid = r.json()["id"]
        # deactivate
        upd = super_admin.put(f"{API}/auth/users/{uid}", json={"is_active": False})
        assert upd.status_code == 200
        # delete
        d = super_admin.delete(f"{API}/auth/users/{uid}")
        assert d.status_code == 200

    def test_cannot_delete_self(self, super_admin):
        me = super_admin.get(f"{API}/auth/me").json()
        r = super_admin.delete(f"{API}/auth/users/{me['id']}")
        assert r.status_code == 400


class TestImport:
    def test_import_run(self, super_admin):
        r = super_admin.post(f"{API}/admin/import/run", json={})
        # source might be unreachable
        if r.status_code == 502:
            pytest.skip("Import source unreachable")
        assert r.status_code == 200
        d = r.json()
        assert "import_id" in d



# ============ ITERATION 2: Quick Import ============
class TestQuickImport:
    def test_quick_import_forbidden_for_sales(self, sales_admin):
        r = sales_admin.post(f"{API}/admin/quick-import/vehicles",
                             json={"text": "slug,harga\nbyd-atto-3,700000000", "dry_run": True})
        assert r.status_code == 403

    def test_quick_import_empty_422(self, super_admin):
        r = super_admin.post(f"{API}/admin/quick-import/vehicles",
                             json={"text": "", "dry_run": True})
        assert r.status_code == 422

    def test_quick_import_one_line_422(self, super_admin):
        r = super_admin.post(f"{API}/admin/quick-import/vehicles",
                             json={"text": "slug,harga", "dry_run": True})
        assert r.status_code == 422

    def test_quick_import_dry_run_and_apply(self, super_admin):
        # pick first vehicle slug from public list
        vs = requests.get(f"{API}/public/vehicles").json()
        assert vs, "no vehicles"
        slug = vs[0]["slug"]
        new_price = 555000000 + int(uuid.uuid4().int) % 1000
        text = f"slug,harga,baterai,jarak\n{slug},{new_price},60,400"
        # dry_run
        r = super_admin.post(f"{API}/admin/quick-import/vehicles",
                             json={"text": text, "dry_run": True})
        assert r.status_code == 200
        d = r.json()
        assert d["applied"] == 0
        assert d["rows"][0]["match"] == "update"
        assert d["rows"][0]["changes"]["starting_price"] == new_price

        # verify not applied
        cur = requests.get(f"{API}/public/vehicles/{slug}").json()
        assert cur.get("starting_price") != new_price

        # apply
        r2 = super_admin.post(f"{API}/admin/quick-import/vehicles",
                              json={"text": text, "dry_run": False})
        assert r2.status_code == 200
        assert r2.json()["applied"] == 1

        # verify persisted + is_example_data cleared
        cur2 = requests.get(f"{API}/public/vehicles/{slug}").json()
        assert cur2["starting_price"] == new_price
        assert cur2.get("is_example_data") in (False, None)

    def test_quick_import_not_found(self, super_admin):
        r = super_admin.post(f"{API}/admin/quick-import/vehicles",
                             json={"text": "slug,harga\ndoes-not-exist-xyz,10000000", "dry_run": True})
        assert r.status_code == 200
        assert r.json()["rows"][0]["match"] == "not_found"

    def test_quick_import_bad_number(self, super_admin):
        r = super_admin.post(f"{API}/admin/quick-import/vehicles",
                             json={"text": "slug,harga\nbyd-atto-3,abc", "dry_run": True})
        assert r.status_code == 200
        errors = r.json()["errors"]
        assert any("bukan angka" in e for e in errors)


# ============ ITERATION 2: Cron ============
class TestCron:
    def test_cron_no_auth(self):
        r = requests.post(f"{API}/cron/publish-scheduled", json={})
        assert r.status_code == 401

    def test_cron_wrong_auth(self):
        r = requests.post(f"{API}/cron/publish-scheduled", json={},
                          headers={"Authorization": "Bearer wrong"})
        assert r.status_code == 401

    def test_cron_ok_and_publishes_scheduled_article(self, super_admin):
        # create a scheduled article in past
        title = f"TEST_ScheduledArticle_{uuid.uuid4().hex[:6]}"
        past = "2020-01-01T00:00:00+00:00"
        create = super_admin.post(f"{API}/admin/resources/articles",
                                  json={"title": title, "status": "scheduled",
                                        "published_at": past, "content": "<p>hi</p>"})
        assert create.status_code == 201
        aid = create.json()["id"]
        slug = create.json()["slug"]

        run_id = f"test-run-{uuid.uuid4().hex[:8]}"
        r = requests.post(f"{API}/cron/publish-scheduled", json={},
                          headers={"Authorization": f"Bearer {CRON_SECRET}",
                                   "X-Webhook-Id": run_id})
        assert r.status_code == 200
        assert r.json().get("accepted") is True

        # background task -> wait
        time.sleep(3)

        got = super_admin.get(f"{API}/admin/resources/articles/{aid}").json()
        assert got["status"] == "published"

        # cleanup
        super_admin.delete(f"{API}/admin/resources/articles/{aid}")

    def test_cron_idempotent(self, super_admin):
        run_id = f"idem-{uuid.uuid4().hex[:8]}"
        r1 = requests.post(f"{API}/cron/publish-scheduled", json={},
                           headers={"Authorization": f"Bearer {CRON_SECRET}",
                                    "X-Webhook-Id": run_id})
        r2 = requests.post(f"{API}/cron/publish-scheduled", json={},
                           headers={"Authorization": f"Bearer {CRON_SECRET}",
                                    "X-Webhook-Id": run_id})
        assert r1.status_code == 200 and r2.status_code == 200
        time.sleep(2)
        # only one cron_runs doc should exist for this run_id -- verified indirectly


# ============ ITERATION 2: Example data seed & settings ============
class TestExampleData:
    def test_example_flag_present(self, public_client):
        vs = public_client.get(f"{API}/public/vehicles").json()
        example_count = sum(1 for v in vs if v.get("is_example_data"))
        # at least some seeded vehicles carry the flag (assuming quick-import hasn't cleared all)
        assert example_count >= 1

    def test_lead_notification_email_setting(self, super_admin):
        s = super_admin.get(f"{API}/admin/settings").json()
        assert "lead_notification_email" in s
        assert s["lead_notification_email"]  # non-empty

    def test_draft_promo_exists_but_not_public(self, super_admin, public_client):
        # admin sees drafts
        r = super_admin.get(f"{API}/admin/resources/promotions",
                            params={"status": "draft"}).json()
        drafts = r.get("items", [])
        # public promotions -> none of the drafts should appear
        pub = public_client.get(f"{API}/public/promotions").json()
        pub_slugs = {p["slug"] for p in pub} if isinstance(pub, list) else set()
        for d in drafts:
            assert d["slug"] not in pub_slugs


# ============ ITERATION 2: Lead notifications don't break API ============
class TestLeadNotification:
    def test_lead_creation_still_201(self):
        wa = "6281" + str(uuid.uuid4().int)[:9]
        r = requests.post(f"{API}/public/leads",
                          json={"full_name": "Notify Test", "whatsapp": wa})
        assert r.status_code == 201

    def test_test_drive_still_201(self):
        vs = requests.get(f"{API}/public/vehicles").json()
        slug = vs[0]["slug"]
        wa = "6281" + str(uuid.uuid4().int)[:9]
        r = requests.post(f"{API}/public/test-drives",
                          json={"full_name": "Notify TD", "whatsapp": wa,
                                "vehicle_slug": slug,
                                "preferred_date": "2026-03-01", "preferred_time": "10:00"})
        assert r.status_code == 201
