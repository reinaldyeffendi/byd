# PRD — BYD BIPO Showroom (Reinaldy Effendi)

## Problem Statement (asli, ringkas)
Bangun website penjualan mobil BYD premium yang production-ready untuk sales consultant REINALDY EFFENDI, dealer BYD BIPO Serpong, Indonesia — lengkap dengan CMS + admin dashboard, database-driven, SEO-ready, aman, responsif. Bukan landing page statis, bukan mockup. Harus mencakup katalog kendaraan, halaman detail, engine perbandingan, engine promo, lead generation + WhatsApp dinamis, test drive booking, simulasi kredit, CMS penuh, analitik nyata, import/sync konten publik dari https://byd.bipoauto.com/, SEO, security, RBAC, activity log. Larangan: memfabrikasi harga/spesifikasi/promo — tandai "Data belum tersedia" / "Hubungi sales untuk informasi terbaru".

## User Choices
- Scope: MVP inti (public site + admin CMS lengkap modul utama)
- Auth: JWT custom (email + password, role-based)
- Media: Emergent managed object storage
- Seed data: impor dari byd.bipoauto.com bila memungkinkan, sisanya "Data belum tersedia"
- WhatsApp: nomor placeholder, editable dari Admin
- Catatan user: "make it as good as possible and as sophisticated as possible"

## Arsitektur
- Backend: FastAPI modular — `core.py` (db, auth, RBAC, storage, activity log), `seed.py`, `routers/auth_router.py`, `routers/public_router.py`, `routers/admin_router.py`
- Database: MongoDB — users, site_settings, pages, vehicles, promotions, articles, events, testimonials, leads, test_drive_requests, media, analytics_events, utm_sessions, activity_logs, imports, import_records, login_attempts
- Frontend: React (CRA) + Tailwind + shadcn/ui + recharts + sonner; routing react-router; `SiteContext` (settings/homepage) & `AuthContext` (JWT cookie)
- Design: dark premium automotive (Bricolage Grotesque + Manrope, hitam/grafit/metallic + aksen merah #d92d20) sesuai `design_guidelines.json`

## Personas
1. Pengunjung/calon pembeli — mencari model, harga, promo, ingin cepat chat WhatsApp / booking test drive
2. Reinaldy (super admin) — mengelola seluruh konten, melihat lead dan analitik
3. Content admin — kendaraan, promo, artikel, event, media, homepage, import
4. Sales admin — leads, test drive, pipeline
5. Analytics admin — hanya membaca analitik

## Sudah diimplementasikan (2026-06)
- Public: Home (14 seksi CMS-driven), /models (search/filter/sort), /models/:slug (galeri, spesifikasi, varian, warna, CTA, simulasi kredit, related), /compare (maks 3, highlight perbedaan, URL shareable), /promotions + detail (countdown, state otomatis), /articles + detail, /events + detail, /contact, /test-drive, /privacy-policy /terms /cookie-policy, 404
- WhatsApp dinamis per model/promo/test drive dengan template editable
- Lead form + test drive form: validasi, loading/success state, proteksi duplikat, atribusi UTM/device/landing page
- Simulasi kredit server-side dengan disclaimer estimasi
- Tracking event (page_view, vehicle_view, click_whatsapp, lead_submit, dst.), cookie consent, personalisasi "Masih mempertimbangkan …", rekomendasi berbasis kategori yang dilihat
- Admin CMS: dashboard analitik nyata (empty state bila kosong), CRUD schema-driven untuk kendaraan/promo/artikel/event/testimoni, draft-publish-archive, bulk action, pagination, export CSV/JSON, leads (status pipeline + catatan), test drive (status workflow), media library (upload object storage), homepage editor, site settings (identitas, kontak, template WA, pembiayaan, SEO, tracking, CTA), import/sync dengan preview & approve, activity log, users & roles
- Security: bcrypt, JWT httpOnly cookie + refresh, brute-force lockout per email (5x/15 menit), RBAC per modul, validasi server-side, whitelist ekstensi upload, /admin noindex, robots.txt
- SEO: meta/OG/Twitter/canonical dinamis, JSON-LD AutoDealer/Product/Article/LocalBusiness, /api/seo/sitemap.xml
- Seed: 7 model BYD (Atto 1, Dolphin, Atto 3, Seal, Sealion 7, M6, M6 DM-i) tanpa harga/spesifikasi fabrikasi, 2 artikel edukasi, halaman legal, 4 akun peran

## Backlog
### P0
- Verifikasi upload media di produksi (object storage init gagal di preview → 502 ditangani dengan pesan jelas)
- Nomor WhatsApp & data dealer sebenarnya diisi oleh admin
### P1
- Rich text editor WYSIWYG (saat ini HTML textarea)
- Scheduled publish otomatis (cron) untuk konten "scheduled"
- Preview draft konten sebelum publish (saat ini preview hanya untuk slug published)
- Notifikasi email/WhatsApp API saat lead masuk
### P2
- Integrasi CRM / Meta Leads / Google Ads
- Multi-bahasa (ID/EN)
- 360° gallery viewer
- Recently viewed carousel di semua halaman

## Next Tasks
1. Isi data komersial nyata (harga, spesifikasi, promo) melalui Admin
2. Aktifkan GA4/Meta Pixel via Site Settings
3. Tambah testimoni & event pertama
4. Uji upload media setelah deploy produksi
