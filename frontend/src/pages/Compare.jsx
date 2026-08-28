import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Plus, X, Share2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import Seo from "@/components/site/Seo";
import SectionHeader, { EmptyState } from "@/components/site/SectionHeader";
import { formatIDR, formatNumber, NA, orNA } from "@/lib/format";
import { track } from "@/lib/tracking";

const ROWS = [
  ["Harga mulai", (v) => formatIDR(v.starting_price)],
  ["Kategori", (v) => orNA(v.category)],
  ["Powertrain", (v) => orNA(v.powertrain)],
  ["Baterai", (v) => (v.battery_kwh ? `${v.battery_kwh} kWh` : NA)],
  ["Jarak tempuh", (v) => (v.range_km ? `${formatNumber(v.range_km)} km` : NA)],
  ["Motor", (v) => orNA(v.motor)],
  ["Tenaga", (v) => orNA(v.power)],
  ["Torsi", (v) => orNA(v.torque)],
  ["Pengisian daya", (v) => orNA(v.charging)],
  ["Akselerasi", (v) => orNA(v.acceleration)],
  ["Kursi", (v) => (v.seating ? `${v.seating}` : NA)],
  ["Panjang", (v) => orNA(v.dimensions?.length)],
  ["Lebar", (v) => orNA(v.dimensions?.width)],
  ["Tinggi", (v) => orNA(v.dimensions?.height)],
  ["Wheelbase", (v) => orNA(v.dimensions?.wheelbase)],
  ["Garansi", (v) => orNA(v.warranty)],
  ["Fitur keselamatan", (v) => (v.features?.safety?.length ? v.features.safety.join(", ") : NA)],
  ["Teknologi", (v) => (v.features?.technology?.length ? v.features.technology.join(", ") : NA)],
];

export default function Compare() {
  const [params, setParams] = useSearchParams();
  const [all, setAll] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);

  const slugs = (params.get("models") || "").split(",").filter(Boolean).slice(0, 3);

  useEffect(() => {
    api.get("/public/vehicles?limit=60").then((r) => setAll(r.data)).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!slugs.length) {
      setSelected([]);
      return;
    }
    api.get(`/public/compare?models=${slugs.join(",")}`).then((r) => {
      setSelected(r.data);
      track("compare_vehicle", { meta: { models: slugs.join(",") } });
    });
  }, [params]);

  const setSlugs = (next) => {
    const p = new URLSearchParams();
    if (next.length) p.set("models", next.join(","));
    setParams(p);
  };

  const add = (slug) => {
    if (slugs.includes(slug)) return;
    if (slugs.length >= 3) {
      toast.error("Maksimal 3 model dapat dibandingkan");
      return;
    }
    setSlugs([...slugs, slug]);
  };

  const share = async () => {
    await navigator.clipboard.writeText(window.location.href);
    toast.success("Tautan perbandingan disalin");
  };

  const differs = (fn) => {
    if (selected.length < 2) return false;
    const values = selected.map((v) => String(fn(v)));
    return new Set(values).size > 1;
  };

  return (
    <>
      <Seo title="Bandingkan Model BYD" description="Bandingkan hingga tiga model BYD berdasarkan harga, baterai, jarak tempuh, dimensi, dan fitur." />

      <section className="container-byd pb-10 pt-28">
        <SectionHeader overline="Alat Bantu" title="Bandingkan Model"
                       subtitle="Pilih hingga 3 model. Tautan halaman ini dapat dibagikan."
                       action={
                         selected.length > 0 && (
                           <button onClick={share} className="btn-ghost-byd" data-testid="compare-share">
                             <Share2 className="h-4 w-4" /> Bagikan
                           </button>
                         )
                       } />
      </section>

      <section className="container-byd pb-16">
        <p className="overline">Tambahkan model</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {loading ? (
            <span className="text-sm text-white/40">Memuat…</span>
          ) : (
            all.map((v) => (
              <button key={v.id} onClick={() => add(v.slug)} data-testid={`compare-add-${v.slug}`}
                      disabled={slugs.includes(v.slug)}
                      className={`flex items-center gap-2 border px-4 py-2.5 text-xs transition-colors duration-300 ${
                        slugs.includes(v.slug)
                          ? "border-[#d92d20] text-white/40"
                          : "border-white/20 text-white/70 hover:border-white/50 hover:text-white"
                      }`}>
                <Plus className="h-3 w-3" /> {v.name}
              </button>
            ))
          )}
        </div>
      </section>

      <section className="container-byd pb-28">
        {selected.length === 0 ? (
          <EmptyState testId="compare-empty" title="Belum ada model dipilih"
                      description="Pilih minimal dua model di atas untuk melihat tabel perbandingan." />
        ) : (
          <div className="overflow-x-auto border border-white/10" data-testid="compare-table">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead>
                <tr className="bg-[#111111]">
                  <th className="w-48 p-5 text-xs uppercase tracking-[0.16em] text-white/40">Spesifikasi</th>
                  {selected.map((v) => (
                    <th key={v.id} className="p-5 align-top">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <img src={v.hero_image} alt={v.name} className="mb-3 h-20 w-32 object-contain" />
                          <Link to={`/models/${v.slug}`} className="font-semibold text-white hover:text-[#d92d20]">
                            {v.name}
                          </Link>
                        </div>
                        <button onClick={() => setSlugs(slugs.filter((s) => s !== v.slug))}
                                data-testid={`compare-table-remove-${v.slug}`}
                                aria-label={`Hapus ${v.name}`} className="text-white/40 hover:text-white">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROWS.map(([label, fn]) => {
                  const highlight = differs(fn);
                  return (
                    <tr key={label} className={highlight ? "bg-[#d92d20]/[0.06]" : ""}>
                      <th scope="row" className="border-t border-white/10 p-5 text-sm font-normal text-white/45">
                        {label}
                      </th>
                      {selected.map((v) => (
                        <td key={v.id} className="border-t border-white/10 p-5 text-sm text-white/85">
                          {fn(v)}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
