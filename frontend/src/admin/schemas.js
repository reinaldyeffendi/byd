export const CATEGORIES = ["SUV", "MPV", "Sedan", "Hatchback", "Crossover", "Commercial"];
export const POWERTRAINS = ["Listrik (BEV)", "Hybrid", "Plug-in Hybrid"];
export const ARTICLE_CATEGORIES = ["BYD News", "EV Education", "Car Tips", "Technology", "Lifestyle", "Promotions", "Events"];
export const PROMO_TYPES = ["Diskon", "Diskon Tunai", "Promo DP", "Promo Cicilan", "Gratis Aksesoris",
  "Gratis Servis", "Trade-In", "Limited Time", "Event", "Paket Kustom"];
export const CONTENT_STATUSES = ["draft", "scheduled", "published", "archived"];
export const EVENT_STATUSES = ["Upcoming", "Ongoing", "Completed", "Cancelled"];

export const SCHEMAS = {
  vehicles: {
    label: "Kendaraan",
    singular: "Kendaraan",
    listColumns: [
      { key: "name", label: "Nama" },
      { key: "category", label: "Kategori" },
      { key: "starting_price", label: "Harga", type: "currency" },
      { key: "featured", label: "Unggulan", type: "bool" },
      { key: "views", label: "Views" },
      { key: "status", label: "Status", type: "status" },
    ],
    groups: [
      {
        title: "Informasi Utama",
        fields: [
          { key: "name", label: "Nama Model", required: true },
          { key: "slug", label: "Slug", hint: "Dibuat otomatis dari nama jika dikosongkan" },
          { key: "category", label: "Kategori", type: "select", options: CATEGORIES, required: true },
          { key: "powertrain", label: "Powertrain", type: "select", options: POWERTRAINS },
          { key: "tagline", label: "Tagline" },
          { key: "short_description", label: "Deskripsi Singkat", type: "textarea" },
          { key: "description", label: "Deskripsi Lengkap (HTML)", type: "richtext" },
          { key: "status", label: "Status", type: "select", options: CONTENT_STATUSES },
          { key: "featured", label: "Tampilkan sebagai unggulan", type: "checkbox" },
        ],
      },
      {
        title: "Harga",
        fields: [
          { key: "starting_price", label: "Harga Mulai (IDR)", type: "number",
            hint: "Kosongkan bila belum tersedia — situs akan menampilkan 'Hubungi sales'." },
          { key: "promo_price", label: "Harga Promo (IDR)", type: "number" },
        ],
      },
      {
        title: "Spesifikasi",
        fields: [
          { key: "battery_kwh", label: "Kapasitas Baterai (kWh)", type: "number" },
          { key: "range_km", label: "Jarak Tempuh (km)", type: "number" },
          { key: "seating", label: "Jumlah Kursi", type: "number" },
          { key: "motor", label: "Motor" },
          { key: "power", label: "Tenaga" },
          { key: "torque", label: "Torsi" },
          { key: "charging", label: "Pengisian Daya" },
          { key: "acceleration", label: "Akselerasi" },
          { key: "top_speed", label: "Kecepatan Maksimal" },
          { key: "warranty", label: "Garansi" },
        ],
      },
      {
        title: "Dimensi",
        fields: [
          { key: "dimensions.length", label: "Panjang" },
          { key: "dimensions.width", label: "Lebar" },
          { key: "dimensions.height", label: "Tinggi" },
          { key: "dimensions.wheelbase", label: "Wheelbase" },
          { key: "dimensions.ground_clearance", label: "Ground Clearance" },
        ],
      },
      {
        title: "Fitur",
        fields: [
          { key: "features.safety", label: "Keselamatan", type: "list" },
          { key: "features.technology", label: "Teknologi", type: "list" },
          { key: "features.interior", label: "Interior", type: "list" },
          { key: "features.exterior", label: "Eksterior", type: "list" },
        ],
      },
      {
        title: "Media",
        fields: [
          { key: "hero_image", label: "Gambar Utama (URL)", type: "image" },
          { key: "images", label: "Galeri", type: "objectlist",
            itemFields: [
              { key: "url", label: "URL Gambar" },
              { key: "type", label: "Tipe (exterior/interior/360)" },
              { key: "alt", label: "Alt text" },
            ] },
          { key: "video_url", label: "URL Video (embed)" },
          { key: "brochure_url", label: "URL Brosur (PDF)" },
        ],
      },
      {
        title: "Varian & Warna",
        fields: [
          { key: "variants", label: "Varian", type: "objectlist",
            itemFields: [
              { key: "name", label: "Nama Varian" },
              { key: "price", label: "Harga", type: "number" },
              { key: "highlights", label: "Catatan" },
            ] },
          { key: "colors", label: "Warna", type: "objectlist",
            itemFields: [
              { key: "name", label: "Nama Warna" },
              { key: "hex", label: "Kode Hex" },
            ] },
        ],
      },
      {
        title: "SEO",
        fields: [
          { key: "seo.title", label: "SEO Title" },
          { key: "seo.description", label: "SEO Description", type: "textarea" },
          { key: "seo.og_image", label: "OG Image URL", type: "image" },
        ],
      },
    ],
  },

  promotions: {
    label: "Promo",
    singular: "Promo",
    listColumns: [
      { key: "title", label: "Judul" },
      { key: "promo_type", label: "Tipe" },
      { key: "start_date", label: "Mulai", type: "date" },
      { key: "end_date", label: "Berakhir", type: "date" },
      { key: "status", label: "Status", type: "status" },
    ],
    groups: [
      {
        title: "Informasi Promo",
        fields: [
          { key: "title", label: "Judul Promo", required: true },
          { key: "slug", label: "Slug" },
          { key: "promo_type", label: "Tipe Promo", type: "select", options: PROMO_TYPES },
          { key: "short_description", label: "Deskripsi Singkat", type: "textarea" },
          { key: "description", label: "Deskripsi Lengkap (HTML)", type: "richtext" },
          { key: "status", label: "Status", type: "select", options: CONTENT_STATUSES },
          { key: "start_date", label: "Tanggal Mulai", type: "date" },
          { key: "end_date", label: "Tanggal Berakhir", type: "date" },
        ],
      },
      {
        title: "Nilai Penawaran",
        fields: [
          { key: "price", label: "Harga Normal (IDR)", type: "number" },
          { key: "discount", label: "Nilai Diskon (IDR)", type: "number" },
          { key: "promo_price", label: "Harga Promo (IDR)", type: "number" },
          { key: "dp", label: "DP Mulai (IDR)", type: "number" },
          { key: "installment", label: "Cicilan Mulai (IDR)", type: "number" },
          { key: "bonus", label: "Bonus", type: "textarea" },
          { key: "terms", label: "Syarat & Ketentuan", type: "textarea" },
        ],
      },
      {
        title: "Media & CTA",
        fields: [
          { key: "hero_image", label: "Hero Image URL", type: "image" },
          { key: "thumbnail", label: "Thumbnail URL", type: "image" },
          { key: "cta_label", label: "Label CTA" },
          { key: "whatsapp_template", label: "Template WhatsApp", type: "textarea" },
          { key: "vehicle_slugs", label: "Slug Model Terkait", type: "list",
            hint: "Contoh: byd-m6, byd-seal" },
        ],
      },
      {
        title: "SEO",
        fields: [
          { key: "seo.title", label: "SEO Title" },
          { key: "seo.description", label: "SEO Description", type: "textarea" },
        ],
      },
    ],
  },

  articles: {
    label: "Artikel",
    singular: "Artikel",
    listColumns: [
      { key: "title", label: "Judul" },
      { key: "category", label: "Kategori" },
      { key: "author", label: "Penulis" },
      { key: "published_at", label: "Publikasi", type: "date" },
      { key: "status", label: "Status", type: "status" },
    ],
    groups: [
      {
        title: "Konten",
        fields: [
          { key: "title", label: "Judul", required: true },
          { key: "slug", label: "Slug" },
          { key: "category", label: "Kategori", type: "select", options: ARTICLE_CATEGORIES },
          { key: "excerpt", label: "Ringkasan", type: "textarea" },
          { key: "content", label: "Isi Artikel (HTML)", type: "richtext" },
          { key: "featured_image", label: "Gambar Utama URL", type: "image" },
          { key: "tags", label: "Tags", type: "list" },
          { key: "author", label: "Penulis" },
          { key: "published_at", label: "Tanggal Publikasi", type: "date" },
          { key: "status", label: "Status", type: "select", options: CONTENT_STATUSES },
        ],
      },
      {
        title: "SEO",
        fields: [
          { key: "seo.title", label: "SEO Title" },
          { key: "seo.description", label: "SEO Description", type: "textarea" },
          { key: "seo.og_image", label: "OG Image URL", type: "image" },
        ],
      },
    ],
  },

  events: {
    label: "Event",
    singular: "Event",
    listColumns: [
      { key: "title", label: "Judul" },
      { key: "event_date", label: "Tanggal", type: "date" },
      { key: "location", label: "Lokasi" },
      { key: "event_status", label: "Fase" },
      { key: "status", label: "Status", type: "status" },
    ],
    groups: [
      {
        title: "Detail Event",
        fields: [
          { key: "title", label: "Judul Event", required: true },
          { key: "slug", label: "Slug" },
          { key: "description", label: "Deskripsi (HTML)", type: "richtext" },
          { key: "event_date", label: "Tanggal", type: "date" },
          { key: "event_time", label: "Waktu" },
          { key: "location", label: "Lokasi" },
          { key: "map_url", label: "URL Peta" },
          { key: "banner", label: "Banner URL", type: "image" },
          { key: "gallery", label: "Galeri", type: "objectlist",
            itemFields: [{ key: "url", label: "URL Gambar" }] },
          { key: "registration_url", label: "URL Pendaftaran" },
          { key: "event_status", label: "Fase Event", type: "select", options: EVENT_STATUSES },
          { key: "status", label: "Status Publikasi", type: "select", options: CONTENT_STATUSES },
        ],
      },
    ],
  },

  testimonials: {
    label: "Testimoni",
    singular: "Testimoni",
    listColumns: [
      { key: "name", label: "Nama" },
      { key: "vehicle_name", label: "Model" },
      { key: "rating", label: "Rating" },
      { key: "status", label: "Status", type: "status" },
    ],
    groups: [
      {
        title: "Testimoni Pelanggan",
        fields: [
          { key: "name", label: "Nama Pelanggan", required: true },
          { key: "city", label: "Kota" },
          { key: "vehicle_name", label: "Model yang Dibeli" },
          { key: "rating", label: "Rating (1-5)", type: "number" },
          { key: "content", label: "Isi Testimoni", type: "textarea", required: true },
          { key: "photo", label: "Foto URL", type: "image" },
          { key: "status", label: "Status", type: "select", options: ["draft", "published", "archived"] },
        ],
      },
    ],
  },
};
