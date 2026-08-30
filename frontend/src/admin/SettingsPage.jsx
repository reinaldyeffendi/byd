import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { api, apiError } from "@/lib/api";
import { AdminButton, Card, Field, PageHeader, inputClass } from "./ui";
import { useSite } from "@/context/SiteContext";

const GROUPS = [
  {
    title: "Identitas Bisnis",
    fields: [
      ["brand", "Brand"],
      ["dealer_name", "Nama Dealer"],
      ["sales_consultant", "Nama Sales Consultant"],
      ["sales_title", "Jabatan"],
      ["location_name", "Nama Lokasi"],
      ["address", "Alamat"],
      ["city", "Kota"],
      ["country", "Negara"],
      ["currency", "Mata Uang"],
      ["language", "Bahasa"],
      ["operating_hours", "Jam Operasional"],
      ["consultant_photo", "Foto Sales (URL)"],
    ],
  },
  {
    title: "Kontak & Sosial",
    fields: [
      ["whatsapp_number", "Nomor WhatsApp (628…)"],
      ["phone", "Telepon"],
      ["email", "Email"],
      ["lead_notification_email", "Email Notifikasi Lead"],
      ["instagram", "Handle Instagram"],
      ["instagram_url", "URL Instagram"],
      ["maps_url", "URL Google Maps"],
      ["maps_embed_url", "URL Embed Maps"],
    ],
  },
  {
    title: "Template WhatsApp",
    prefix: "whatsapp_templates",
    textarea: true,
    fields: [
      ["general", "Umum"],
      ["vehicle", "Model — gunakan {model}"],
      ["promotion", "Promo — gunakan {promotion}"],
      ["test_drive", "Test Drive — gunakan {model}"],
      ["brochure", "Brosur"],
    ],
  },
  {
    title: "Pengaturan Pembiayaan",
    prefix: "financing",
    fields: [
      ["interest_rate", "Asumsi Bunga (%/tahun)", "number"],
      ["min_dp_percent", "DP Minimum (%)", "number"],
      ["insurance_percent", "Asuransi (%/tahun)", "number"],
      ["admin_fee", "Biaya Admin (IDR)", "number"],
      ["disclaimer", "Disclaimer", "textarea"],
    ],
  },
  {
    title: "SEO Global",
    prefix: "seo",
    fields: [
      ["site_title", "Site Title"],
      ["site_description", "Site Description", "textarea"],
      ["keywords", "Keywords"],
      ["og_image", "OG Image URL"],
    ],
  },
  {
    title: "Tracking & Analytics",
    prefix: "tracking",
    fields: [
      ["ga4_id", "Google Analytics 4 ID"],
      ["gtm_id", "Google Tag Manager ID"],
      ["meta_pixel_id", "Meta Pixel ID"],
      ["tiktok_pixel_id", "TikTok Pixel ID"],
      ["google_ads_id", "Google Ads Conversion ID"],
    ],
  },
  {
    title: "Label CTA",
    prefix: "cta_labels",
    fields: [
      ["primary", "CTA Utama"],
      ["secondary", "CTA Sekunder"],
      ["whatsapp", "CTA WhatsApp"],
      ["brochure", "CTA Brosur"],
      ["compare", "CTA Bandingkan"],
    ],
  },
];

export default function SettingsPage() {
  const { reload } = useSite();
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/admin/settings").then((r) => setSettings(r.data)).catch((e) => toast.error(apiError(e)));
  }, []);

  const setValue = (prefix, key, value) =>
    setSettings((s) =>
      prefix ? { ...s, [prefix]: { ...(s[prefix] || {}), [key]: value } } : { ...s, [key]: value }
    );

  const setLoanPeriods = (value) =>
    setSettings((s) => ({
      ...s,
      financing: {
        ...(s.financing || {}),
        loan_periods: value.split(",").map((v) => Number(v.trim())).filter((n) => !Number.isNaN(n) && n > 0),
      },
    }));

  const save = async () => {
    setSaving(true);
    try {
      await api.put("/admin/settings", settings);
      toast.success("Pengaturan tersimpan dan langsung berlaku di website");
      reload?.();
    } catch (e) {
      toast.error(apiError(e));
    } finally {
      setSaving(false);
    }
  };

  if (!settings) return <p className="text-white/40" data-testid="settings-loading">Memuat pengaturan…</p>;

  return (
    <div data-testid="admin-settings-page">
      <PageHeader title="Site Settings"
                  description="Konfigurasi terpusat: identitas bisnis, kontak, template WhatsApp, pembiayaan, SEO, dan tracking."
                  actions={
                    <AdminButton onClick={save} disabled={saving} data-testid="settings-save">
                      <Save className="h-3.5 w-3.5" /> {saving ? "Menyimpan…" : "Simpan"}
                    </AdminButton>
                  } />

      <div className="space-y-6">
        {GROUPS.map((group) => (
          <Card key={group.title} className="p-6" data-testid={`settings-group-${group.prefix || "root"}`}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#d92d20]">
              {group.title}
            </p>
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              {group.fields.map(([key, label, type]) => {
                const value = group.prefix ? settings[group.prefix]?.[key] : settings[key];
                const testId = `setting-${group.prefix || "root"}-${key}`;
                const isTextarea = type === "textarea" || group.textarea;
                return (
                  <div key={key} className={isTextarea ? "lg:col-span-2" : ""}>
                    <Field label={label}>
                      {isTextarea ? (
                        <textarea rows={3} className={inputClass} value={value ?? ""} data-testid={testId}
                                  onChange={(e) => setValue(group.prefix, key, e.target.value)} />
                      ) : (
                        <input type={type === "number" ? "number" : "text"} className={inputClass}
                               value={value ?? ""} data-testid={testId}
                               onChange={(e) =>
                                 setValue(group.prefix, key,
                                   type === "number"
                                     ? (e.target.value === "" ? null : Number(e.target.value))
                                     : e.target.value)
                               } />
                      )}
                    </Field>
                  </div>
                );
              })}
              {group.prefix === "financing" && (
                <div className="lg:col-span-2">
                  <Field label="Pilihan Tenor (bulan, pisahkan dengan koma)">
                    <input className={inputClass} data-testid="setting-financing-loan-periods"
                           value={(settings.financing?.loan_periods || []).join(", ")}
                           onChange={(e) => setLoanPeriods(e.target.value)} />
                  </Field>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
