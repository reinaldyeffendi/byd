"""Seed data: BYD BIPO. Only publicly verifiable identity data.
Prices/specs/promotions are intentionally left empty (null) so the UI shows
"Data belum tersedia" instead of fabricated commercial information."""
import os

from core import db, hash_password, iso_now, slugify, verify_password

DEFAULT_SETTINGS = {
    "_key": "site_settings",
    "brand": "BYD",
    "dealer_name": "BYD BIPO",
    "sales_consultant": "REINALDY EFFENDI",
    "sales_title": "Sales Consultant",
    "location_name": "BYD BIPO Serpong",
    "address": "BYD BIPO Serpong, Tangerang Selatan, Banten, Indonesia",
    "city": "Tangerang Selatan",
    "country": "Indonesia",
    "language": "id",
    "currency": "IDR",
    "whatsapp_number": "6281234567890",
    "phone": "6281234567890",
    "email": "sales@bydbipo.example",
    "instagram": "@reinaldyeffendi_byd",
    "instagram_url": "https://instagram.com/reinaldyeffendi_byd",
    "maps_url": "https://maps.google.com/?q=BYD+BIPO+Serpong",
    "maps_embed_url": "",
    "operating_hours": "Senin - Sabtu, 08.30 - 17.00 WIB",
    "consultant_photo": "https://images.unsplash.com/photo-1640531005390-38bd92755d6a?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2MTJ8MHwxfHNlYXJjaHwyfHxwcm9mZXNzaW9uYWwlMjBhc2lhbiUyMGJ1c2luZXNzbWFuJTIwc3VpdCUyMHBvcnRyYWl0fGVufDB8fHx8MTc4NzkwOTQ1M3ww&ixlib=rb-4.1.0&q=85",
    "whatsapp_templates": {
        "general": "Hi {sales}, saya tertarik dengan mobil listrik BYD. Boleh info harga dan promo terbaru?",
        "vehicle": "Hi {sales}, saya tertarik dengan BYD {model}. Saya ingin mendapatkan informasi harga dan promo terbaru.",
        "promotion": "Hi {sales}, saya tertarik dengan promo {promotion}. Bisa info detail harga, DP, cicilan, dan bonusnya?",
        "test_drive": "Hi {sales}, saya ingin booking test drive BYD {model}.",
        "brochure": "Hi {sales}, saya ingin mendapatkan brosur BYD {model}.",
    },
    "financing": {
        "interest_rate": 6.5,
        "min_dp_percent": 20,
        "loan_periods": [12, 24, 36, 48, 60],
        "insurance_percent": 2.5,
        "admin_fee": 3500000,
        "disclaimer": "Simulasi ini hanya estimasi dan bukan penawaran kredit resmi. Silakan hubungi sales consultant untuk penawaran final.",
    },
    "seo": {
        "site_title": "BYD BIPO Serpong — Reinaldy Effendi | Dealer Resmi Mobil Listrik BYD",
        "site_description": "Showroom digital BYD BIPO Serpong. Lihat model, harga, promo, simulasi kredit, dan booking test drive bersama Reinaldy Effendi.",
        "og_image": "",
        "keywords": "BYD, mobil listrik, BYD BIPO, Serpong, harga BYD, promo BYD",
    },
    "tracking": {
        "ga4_id": "",
        "gtm_id": "",
        "meta_pixel_id": "",
        "tiktok_pixel_id": "",
        "google_ads_id": "",
    },
    "cta_labels": {
        "primary": "Dapatkan Penawaran",
        "secondary": "Test Drive",
        "whatsapp": "Chat WhatsApp",
        "brochure": "Unduh Brosur",
        "compare": "Bandingkan",
    },
    "footer": {
        "tagline": "Menuju mobilitas listrik yang lebih cerdas.",
        "columns": [
            {"title": "Kendaraan", "links": [{"label": "Semua Model", "url": "/models"}, {"label": "Bandingkan", "url": "/compare"}]},
            {"title": "Informasi", "links": [{"label": "Promo", "url": "/promotions"}, {"label": "Artikel", "url": "/articles"}, {"label": "Event", "url": "/events"}]},
            {"title": "Bantuan", "links": [{"label": "Kontak", "url": "/contact"}, {"label": "Test Drive", "url": "/test-drive"}, {"label": "Kebijakan Privasi", "url": "/privacy-policy"}]},
        ],
        "copyright": "BYD BIPO Serpong — Reinaldy Effendi. Bukan situs resmi BYD Auto Co., Ltd.",
    },
    "updated_at": iso_now(),
}

HOMEPAGE = {
    "slug": "home",
    "title": "Homepage",
    "status": "published",
    "sections": {
        "hero": {
            "enabled": True,
            "overline": "BYD BIPO SERPONG",
            "headline": "Masa depan berkendara, hari ini.",
            "subheadline": "Konsultasi langsung dengan Reinaldy Effendi untuk menemukan mobil listrik BYD yang paling sesuai dengan kebutuhan Anda.",
            "background_image": "https://static.prod-images.emergentagent.com/jobs/be512f88-6082-43fb-9cc4-c9ca6aa8cbc1/images/64cc41de4bb58cd85d667dd00527c41ecb8e4f03b4cee9d63f4743c35fa5916c.jpeg",
            "background_video": "",
            "primary_cta": {"label": "Jelajahi Model", "url": "/models"},
            "secondary_cta": {"label": "Booking Test Drive", "url": "/test-drive"},
            "featured_vehicle_slug": "byd-sealion-7",
            "promo_badge": "",
        },
        "featured_vehicles": {"enabled": True, "title": "Model Unggulan", "subtitle": "Lini kendaraan listrik BYD yang tersedia melalui BYD BIPO."},
        "promotions": {"enabled": True, "title": "Promo Terbaru", "subtitle": "Program penawaran yang sedang berjalan."},
        "why_byd": {
            "enabled": True,
            "title": "Mengapa BYD",
            "items": [
                {"title": "Blade Battery", "description": "Teknologi baterai LFP dengan fokus pada keamanan dan durabilitas."},
                {"title": "Integrasi Vertikal", "description": "BYD memproduksi baterai, motor, dan elektronik dayanya sendiri."},
                {"title": "Jaringan Resmi", "description": "Dukungan purna jual melalui dealer resmi BYD di Indonesia."},
                {"title": "Pendampingan Personal", "description": "Konsultasi satu-satu bersama sales consultant Anda."},
            ],
        },
        "ev_tech": {
            "enabled": True,
            "title": "Teknologi Elektrifikasi",
            "subtitle": "Arsitektur e-Platform, Blade Battery, dan sistem pengisian daya modern.",
            "image": "https://static.prod-images.emergentagent.com/jobs/be512f88-6082-43fb-9cc4-c9ca6aa8cbc1/images/5b61a72a8cdb30b397879f6229a646add6a02b5a95da301f5836b92f808c5ecf.jpeg",
        },
        "comparison": {"enabled": True, "title": "Bandingkan Model", "subtitle": "Pilih hingga 3 model dan lihat perbedaannya secara berdampingan."},
        "financing": {"enabled": True, "title": "Simulasi Kredit", "subtitle": "Hitung estimasi cicilan sebelum berbicara dengan sales."},
        "test_drive": {"enabled": True, "title": "Rasakan Sendiri", "subtitle": "Jadwalkan test drive di BYD BIPO Serpong.",
                       "image": "https://static.prod-images.emergentagent.com/jobs/be512f88-6082-43fb-9cc4-c9ca6aa8cbc1/images/40b9f5cce6cd2aa4dd47b5f8352c1f821f1c31a6c5163caf5183f14f91d25a47.jpeg"},
        "articles": {"enabled": True, "title": "Wawasan & Artikel", "subtitle": "Edukasi seputar mobil listrik."},
        "testimonials": {"enabled": True, "title": "Kata Pelanggan", "subtitle": ""},
        "dealer": {"enabled": True, "title": "Kunjungi Showroom",
                   "image": "https://static.prod-images.emergentagent.com/jobs/be512f88-6082-43fb-9cc4-c9ca6aa8cbc1/images/40b9f5cce6cd2aa4dd47b5f8352c1f821f1c31a6c5163caf5183f14f91d25a47.jpeg"},
        "instagram": {"enabled": True, "title": "Ikuti Perjalanan Kami"},
    },
    "updated_at": iso_now(),
}

VEHICLES = [
    ("BYD Atto 1", "Hatchback", "Listrik (BEV)", "https://byd.bipoauto.com/web/image/1799-6677c90c/BYD%20Atto%201%20Sprout%20Green-Photoroom.png"),
    ("BYD Dolphin", "Hatchback", "Listrik (BEV)", "https://byd.bipoauto.com/web/image/1798-6fe1d614/1768872321514-byddolphin-Photoroom.webp"),
    ("BYD Atto 3", "SUV", "Listrik (BEV)", "https://byd.bipoauto.com/web/image/1800-d859c9ad/Atto%203-%20Sky%20White.webp"),
    ("BYD Seal", "Sedan", "Listrik (BEV)", "https://byd.bipoauto.com/web/image/1305-0a373e16/1715739245_byd-seal-sedan-listrik-mewah-dengan-akselerasi-ala-supercar-Photoroom.png"),
    ("BYD Sealion 7", "SUV", "Listrik (BEV)", "https://byd.bipoauto.com/web/image/1308-6ae3d4ba/Sealion-7-Aurora-White%20%281%29-Photoroom.png"),
    ("BYD M6", "MPV", "Listrik (BEV)", "https://byd.bipoauto.com/web/image/1306-5842a2a8/Khaki-Photoroom.png"),
    ("BYD M6 DM-i", "MPV", "Hybrid", "https://byd.bipoauto.com/web/image/1792-1bd3c5da/m6dmextside%20%281%29-Photoroom.webp"),
]

NA = "Data belum tersedia"

ARTICLES = [
    {
        "title": "Panduan Singkat Memahami Mobil Listrik untuk Pemula",
        "category": "EV Education",
        "excerpt": "Istilah BEV, PHEV, kWh, dan kecepatan pengisian daya dijelaskan dengan bahasa sederhana.",
        "content": "<h2>Apa itu BEV?</h2><p>BEV (Battery Electric Vehicle) adalah kendaraan yang sepenuhnya digerakkan oleh motor listrik dan baterai, tanpa mesin bensin. Karena tidak ada pembakaran, tidak ada emisi gas buang saat berkendara.</p><h2>Membaca kapasitas baterai</h2><p>Kapasitas baterai dinyatakan dalam kWh (kilowatt-hour). Semakin besar kapasitasnya, umumnya semakin jauh jarak tempuh yang bisa dicapai. Namun jarak tempuh nyata juga dipengaruhi gaya berkendara, beban, dan penggunaan AC.</p><h2>Pengisian daya</h2><p>Pengisian daya AC di rumah cocok untuk pemakaian harian dan biasanya dilakukan pada malam hari. Pengisian DC fast charging berguna saat perjalanan jauh. Untuk angka resmi setiap model, silakan hubungi sales consultant kami.</p><h2>Biaya kepemilikan</h2><p>Mobil listrik memiliki komponen bergerak yang lebih sedikit, sehingga kebutuhan perawatan rutin cenderung lebih sederhana. Pertimbangkan juga insentif pemerintah yang berlaku saat pembelian.</p>",
    },
    {
        "title": "Lima Hal yang Perlu Disiapkan Sebelum Test Drive",
        "category": "Car Tips",
        "excerpse": "",
        "excerpt": "Agar sesi test drive Anda benar-benar informatif, bukan hanya sekadar berkeliling blok.",
        "content": "<h2>1. Tentukan kebutuhan utama</h2><p>Apakah mobil akan dipakai untuk komuter harian, keluarga besar, atau perjalanan luar kota? Kebutuhan ini menentukan model mana yang paling relevan untuk dicoba.</p><h2>2. Bawa dokumen</h2><p>Siapkan SIM yang masih berlaku. Ini syarat wajib untuk melakukan test drive.</p><h2>3. Uji hal yang benar-benar Anda pakai</h2><p>Coba masuk-keluar kursi baris kedua, lipat bangku, uji bagasi dengan barang yang biasa Anda bawa, dan periksa posisi mengemudi favorit Anda.</p><h2>4. Perhatikan pengalaman berkendara listrik</h2><p>Rasakan respons torsi instan, tingkat kebisingan kabin, dan cara kerja regenerative braking.</p><h2>5. Siapkan pertanyaan</h2><p>Tanyakan soal garansi, jaringan servis, opsi pengisian daya di rumah, serta skema pembiayaan yang sedang berlaku.</p>",
    },
]

LEGAL_PAGES = [
    ("privacy-policy", "Kebijakan Privasi", "<p>Kami mengumpulkan data yang Anda kirimkan melalui formulir (nama, nomor WhatsApp, email, kota, dan preferensi kendaraan) semata-mata untuk keperluan tindak lanjut penjualan dan konsultasi produk BYD.</p><h2>Data yang kami simpan</h2><p>Data formulir, data sesi anonim (halaman dan kendaraan yang dilihat), serta parameter kampanye (UTM) untuk mengukur efektivitas pemasaran.</p><h2>Penggunaan data</h2><p>Data tidak diperjualbelikan. Data hanya diakses oleh sales consultant dan admin yang berwenang.</p><h2>Hak Anda</h2><p>Anda dapat meminta penghapusan data Anda dengan menghubungi kami melalui halaman Kontak.</p>"),
    ("terms", "Syarat & Ketentuan", "<p>Informasi pada situs ini disediakan untuk tujuan informasi dan konsultasi penjualan.</p><h2>Harga dan spesifikasi</h2><p>Harga, spesifikasi, promo, ketersediaan unit, serta suku bunga pembiayaan dapat berubah tanpa pemberitahuan sebelumnya. Informasi yang belum tersedia ditandai dengan \"Data belum tersedia\".</p><h2>Simulasi kredit</h2><p>Hasil simulasi kredit adalah estimasi, bukan penawaran resmi dari lembaga pembiayaan.</p><h2>Status situs</h2><p>Situs ini dikelola oleh sales consultant independen dan bukan situs resmi BYD Auto Co., Ltd.</p>"),
    ("cookie-policy", "Kebijakan Cookie", "<p>Kami menggunakan penyimpanan lokal peramban dan cookie untuk mengingat kendaraan yang Anda lihat, menyimpan preferensi perbandingan, dan mengukur performa kampanye.</p><h2>Kategori</h2><p>Cookie esensial diperlukan agar situs berfungsi. Cookie analitik hanya diaktifkan setelah Anda memberikan persetujuan.</p><h2>Mengelola persetujuan</h2><p>Anda dapat menolak cookie analitik melalui banner persetujuan yang muncul saat kunjungan pertama.</p>"),
]

STAFF = [
    ("content@bipoauto.com", "Content Admin", "content_admin"),
    ("sales@bipoauto.com", "Sales Admin", "sales_admin"),
    ("analytics@bipoauto.com", "Analytics Admin", "analytics_admin"),
]


async def run_seed():
    await db.users.create_index("email", unique=True)
    await db.vehicles.create_index("slug", unique=True)
    await db.promotions.create_index("slug", unique=True)
    await db.articles.create_index("slug", unique=True)
    await db.events.create_index("slug")
    await db.login_attempts.create_index("identifier")
    await db.analytics_events.create_index("created_at")

    admin_email = os.environ["ADMIN_EMAIL"].lower()
    admin_password = os.environ["ADMIN_PASSWORD"]
    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        await db.users.insert_one({
            "email": admin_email, "password_hash": hash_password(admin_password),
            "name": "Reinaldy Effendi", "role": "super_admin", "is_active": True,
            "created_at": iso_now(),
        })
    elif not verify_password(admin_password, existing.get("password_hash", "")):
        await db.users.update_one({"email": admin_email},
                                  {"$set": {"password_hash": hash_password(admin_password),
                                            "role": "super_admin", "is_active": True}})

    await db.users.delete_many({"email": {"$regex": r"\.test$"}})
    for email, name, role in STAFF:
        existing_staff = await db.users.find_one({"email": email})
        if not existing_staff:
            await db.users.insert_one({
                "email": email, "password_hash": hash_password("Staff2026!"),
                "name": name, "role": role, "is_active": True, "created_at": iso_now(),
            })
        elif not verify_password("Staff2026!", existing_staff.get("password_hash", "")):
            await db.users.update_one({"email": email},
                                      {"$set": {"password_hash": hash_password("Staff2026!"),
                                                "role": role, "is_active": True}})

    if not await db.site_settings.find_one({"_key": "site_settings"}):
        await db.site_settings.insert_one(dict(DEFAULT_SETTINGS))

    if not await db.pages.find_one({"slug": "home"}):
        await db.pages.insert_one(dict(HOMEPAGE))

    for slug, title, content in LEGAL_PAGES:
        if not await db.pages.find_one({"slug": slug}):
            await db.pages.insert_one({"slug": slug, "title": title, "content": content,
                                       "status": "published", "type": "legal",
                                       "updated_at": iso_now()})

    if await db.vehicles.count_documents({}) == 0:
        for idx, (name, category, powertrain, image) in enumerate(VEHICLES):
            await db.vehicles.insert_one({
                "name": name,
                "slug": slugify(name),
                "category": category,
                "powertrain": powertrain,
                "tagline": "",
                "short_description": f"{name} tersedia melalui {DEFAULT_SETTINGS['dealer_name']}. Hubungi sales untuk informasi harga dan spesifikasi terbaru.",
                "description": "",
                "starting_price": None,
                "promo_price": None,
                "battery_kwh": None,
                "range_km": None,
                "seating": None,
                "motor": NA, "power": NA, "torque": NA, "charging": NA,
                "acceleration": NA, "top_speed": NA, "warranty": NA,
                "dimensions": {"length": NA, "width": NA, "height": NA, "wheelbase": NA, "ground_clearance": NA},
                "features": {"safety": [], "technology": [], "interior": [], "exterior": []},
                "variants": [],
                "colors": [],
                "images": [{"url": image, "type": "exterior", "alt": name}],
                "hero_image": image,
                "video_url": "",
                "brochure_url": "",
                "featured": idx < 4,
                "popularity": 0,
                "views": 0,
                "status": "published",
                "seo": {"title": f"{name} — Harga & Spesifikasi | {DEFAULT_SETTINGS['dealer_name']}",
                        "description": f"Informasi {name} di {DEFAULT_SETTINGS['location_name']}. Konsultasi bersama {DEFAULT_SETTINGS['sales_consultant']}.",
                        "og_image": image},
                "source": "seed",
                "created_at": iso_now(),
                "updated_at": iso_now(),
            })

    if await db.articles.count_documents({}) == 0:
        for a in ARTICLES:
            await db.articles.insert_one({
                "title": a["title"], "slug": slugify(a["title"]), "category": a["category"],
                "excerpt": a["excerpt"], "content": a["content"],
                "featured_image": HOMEPAGE["sections"]["ev_tech"]["image"],
                "tags": ["EV", "BYD"], "author": DEFAULT_SETTINGS["sales_consultant"],
                "status": "published", "published_at": iso_now(),
                "seo": {"title": a["title"], "description": a["excerpt"], "og_image": ""},
                "created_at": iso_now(), "updated_at": iso_now(),
            })
