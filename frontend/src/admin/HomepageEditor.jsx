import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Eye, Save } from "lucide-react";
import { api, apiError } from "@/lib/api";
import { AdminButton, Card, Field, PageHeader, inputClass } from "./ui";
import { useSite } from "@/context/SiteContext";

const TEXT_FIELDS = {
  hero: [
    ["overline", "Overline"],
    ["headline", "Headline"],
    ["subheadline", "Subheadline"],
    ["background_image", "Background Image URL"],
    ["background_video", "Background Video URL"],
    ["featured_vehicle_slug", "Slug Model Sorotan"],
    ["promo_badge", "Badge Promo"],
  ],
};

export default function HomepageEditor() {
  const { reload } = useSite();
  const [sections, setSections] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get("/admin/homepage")
      .then((r) => setSections(r.data?.sections || {}))
      .catch((e) => toast.error(apiError(e)));
  }, []);

  const setField = (section, key, value) =>
    setSections((s) => ({ ...s, [section]: { ...(s[section] || {}), [key]: value } }));

  const setCta = (section, cta, key, value) =>
    setSections((s) => ({
      ...s,
      [section]: { ...(s[section] || {}), [cta]: { ...((s[section] || {})[cta] || {}), [key]: value } },
    }));

  const save = async () => {
    setSaving(true);
    try {
      await api.put("/admin/homepage", { sections, status: "published" });
      toast.success("Homepage diperbarui dan langsung tayang");
      reload?.();
    } catch (e) {
      toast.error(apiError(e));
    } finally {
      setSaving(false);
    }
  };

  if (!sections) return <p className="text-white/40" data-testid="homepage-loading">Memuat konfigurasi…</p>;

  const hero = sections.hero || {};
  const simpleSections = Object.keys(sections).filter((k) => k !== "hero");

  return (
    <div data-testid="admin-homepage-page">
      <PageHeader title="Homepage Editor"
                  description="Semua konten homepage berasal dari konfigurasi ini."
                  actions={
                    <>
                      <a href="/" target="_blank" rel="noreferrer" data-testid="homepage-preview">
                        <AdminButton variant="ghost" as="span">
                          <Eye className="h-3.5 w-3.5" /> Preview
                        </AdminButton>
                      </a>
                      <AdminButton onClick={save} disabled={saving} data-testid="homepage-save">
                        <Save className="h-3.5 w-3.5" /> {saving ? "Menyimpan…" : "Simpan & Publish"}
                      </AdminButton>
                    </>
                  } />

      <Card className="mb-6 p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#d92d20]">Hero Section</p>
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {TEXT_FIELDS.hero.map(([key, label]) => (
            <Field key={key} label={label}>
              {key === "subheadline" ? (
                <textarea rows={3} className={inputClass} value={hero[key] || ""}
                          data-testid={`hero-${key}`}
                          onChange={(e) => setField("hero", key, e.target.value)} />
              ) : (
                <input className={inputClass} value={hero[key] || ""} data-testid={`hero-${key}`}
                       onChange={(e) => setField("hero", key, e.target.value)} />
              )}
            </Field>
          ))}
          {["primary_cta", "secondary_cta"].map((cta) => (
            <div key={cta} className="grid gap-4 sm:grid-cols-2">
              <Field label={`${cta === "primary_cta" ? "CTA Utama" : "CTA Sekunder"} — Label`}>
                <input className={inputClass} value={hero[cta]?.label || ""}
                       data-testid={`hero-${cta}-label`}
                       onChange={(e) => setCta("hero", cta, "label", e.target.value)} />
              </Field>
              <Field label="URL">
                <input className={inputClass} value={hero[cta]?.url || ""}
                       data-testid={`hero-${cta}-url`}
                       onChange={(e) => setCta("hero", cta, "url", e.target.value)} />
              </Field>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        {simpleSections.map((key) => {
          const section = sections[key] || {};
          return (
            <Card key={key} className="p-6" data-testid={`homepage-section-${key}`}>
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
                  {key.replace(/_/g, " ")}
                </p>
                <label className="flex items-center gap-2 text-xs text-white/50">
                  <input type="checkbox" checked={section.enabled !== false}
                         data-testid={`homepage-toggle-${key}`}
                         onChange={(e) => setField(key, "enabled", e.target.checked)}
                         className="h-4 w-4 accent-[#d92d20]" />
                  Tampilkan
                </label>
              </div>
              <div className="mt-5 space-y-4">
                {["title", "subtitle", "image"].map((f) =>
                  f in section || f === "title" ? (
                    <Field key={f} label={f}>
                      <input className={inputClass} value={section[f] || ""}
                             data-testid={`homepage-${key}-${f}`}
                             onChange={(e) => setField(key, f, e.target.value)} />
                    </Field>
                  ) : null
                )}
                {Array.isArray(section.items) && (
                  <div className="space-y-3">
                    {section.items.map((item, i) => (
                      <div key={i} className="border border-white/10 p-3">
                        <input className={inputClass} value={item.title || ""}
                               data-testid={`homepage-${key}-item-${i}-title`}
                               onChange={(e) => {
                                 const items = [...section.items];
                                 items[i] = { ...items[i], title: e.target.value };
                                 setField(key, "items", items);
                               }} />
                        <textarea rows={2} className={`${inputClass} mt-2`} value={item.description || ""}
                                  data-testid={`homepage-${key}-item-${i}-desc`}
                                  onChange={(e) => {
                                    const items = [...section.items];
                                    items[i] = { ...items[i], description: e.target.value };
                                    setField(key, "items", items);
                                  }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
