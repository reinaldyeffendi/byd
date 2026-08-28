import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { SlidersHorizontal, X } from "lucide-react";
import { api } from "@/lib/api";
import Seo from "@/components/site/Seo";
import VehicleCard from "@/components/site/VehicleCard";
import SectionHeader, { EmptyState, SkeletonGrid } from "@/components/site/SectionHeader";
import { useSite } from "@/context/SiteContext";

const CATEGORIES = ["SUV", "MPV", "Sedan", "Hatchback", "Crossover", "Commercial"];
const POWERTRAINS = ["Listrik", "Hybrid"];
const SORTS = [
  { value: "featured", label: "Unggulan" },
  { value: "price_asc", label: "Harga Terendah" },
  { value: "price_desc", label: "Harga Tertinggi" },
  { value: "newest", label: "Terbaru" },
  { value: "popular", label: "Terpopuler" },
];

export default function Models() {
  const { settings } = useSite();
  const [params, setParams] = useSearchParams();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [q, setQ] = useState(params.get("q") || "");

  const filters = useMemo(
    () => ({
      q: params.get("q") || "",
      category: params.get("category") || "",
      powertrain: params.get("powertrain") || "",
      seating: params.get("seating") || "",
      max_price: params.get("max_price") || "",
      min_range: params.get("min_range") || "",
      sort: params.get("sort") || "featured",
    }),
    [params]
  );

  useEffect(() => {
    setLoading(true);
    const search = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => v && search.set(k, v));
    api
      .get(`/public/vehicles?${search.toString()}`)
      .then((r) => setVehicles(r.data))
      .finally(() => setLoading(false));
  }, [filters]);

  const update = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next);
  };

  const reset = () => {
    setQ("");
    setParams(new URLSearchParams());
  };

  const activeCount = Object.entries(filters).filter(([k, v]) => v && k !== "sort").length;

  return (
    <>
      <Seo title={`Semua Model BYD — ${settings?.dealer_name || "BYD BIPO"}`}
           description="Katalog lengkap model BYD: SUV, MPV, Sedan, dan Hatchback listrik. Filter berdasarkan kategori, harga, dan jarak tempuh." />

      <section className="container-byd pb-10 pt-28">
        <SectionHeader overline="Katalog Kendaraan" title="Semua Model BYD"
                       subtitle="Telusuri lini kendaraan listrik dan hybrid BYD yang tersedia melalui dealer kami." />
      </section>

      <section className="container-byd pb-24">
        <div className="flex flex-col gap-4 border-y border-white/10 py-5 lg:flex-row lg:items-center lg:justify-between">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              update("q", q);
            }}
            className="w-full max-w-md"
          >
            <input value={q} onChange={(e) => setQ(e.target.value)} data-testid="models-search-input"
                   placeholder="Search BYD model..." className="field-byd" />
          </form>
          <div className="flex flex-wrap items-center gap-3">
            <button onClick={() => setFiltersOpen((v) => !v)} data-testid="models-filter-toggle"
                    className="flex items-center gap-2 border border-white/20 px-4 py-3 text-xs uppercase tracking-[0.14em] text-white/70 hover:text-white">
              <SlidersHorizontal className="h-4 w-4" /> Filter {activeCount > 0 && `(${activeCount})`}
            </button>
            <select value={filters.sort} onChange={(e) => update("sort", e.target.value)}
                    data-testid="models-sort-select"
                    className="border border-white/20 bg-transparent px-4 py-3 text-xs uppercase tracking-[0.14em] text-white/70">
              {SORTS.map((s) => (
                <option key={s.value} value={s.value} className="bg-black">{s.label}</option>
              ))}
            </select>
            {activeCount > 0 && (
              <button onClick={reset} data-testid="models-reset-filters"
                      className="flex items-center gap-1 text-xs uppercase tracking-[0.14em] text-white/50 hover:text-white">
                <X className="h-3.5 w-3.5" /> Reset
              </button>
            )}
          </div>
        </div>

        {filtersOpen && (
          <div className="grid gap-8 border-b border-white/10 py-8 sm:grid-cols-2 lg:grid-cols-4"
               data-testid="models-filter-panel">
            <div>
              <p className="overline">Body Type</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {CATEGORIES.map((c) => (
                  <button key={c} data-testid={`filter-category-${c.toLowerCase()}`}
                          onClick={() => update("category", filters.category === c ? "" : c)}
                          className={`border px-3.5 py-2 text-xs transition-colors duration-300 ${
                            filters.category === c
                              ? "border-[#d92d20] text-white"
                              : "border-white/20 text-white/60 hover:text-white"
                          }`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="overline">Powertrain</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {POWERTRAINS.map((c) => (
                  <button key={c} data-testid={`filter-powertrain-${c.toLowerCase()}`}
                          onClick={() => update("powertrain", filters.powertrain === c ? "" : c)}
                          className={`border px-3.5 py-2 text-xs transition-colors duration-300 ${
                            filters.powertrain === c
                              ? "border-[#d92d20] text-white"
                              : "border-white/20 text-white/60 hover:text-white"
                          }`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="overline" htmlFor="filter-seating">Kapasitas Minimal</label>
              <select id="filter-seating" data-testid="filter-seating" className="field-byd mt-3"
                      value={filters.seating} onChange={(e) => update("seating", e.target.value)}>
                <option value="" className="bg-black">Semua</option>
                {[2, 4, 5, 7].map((s) => (
                  <option key={s} value={s} className="bg-black">{s}+ kursi</option>
                ))}
              </select>
            </div>
            <div>
              <label className="overline" htmlFor="filter-price">Harga Maksimal (IDR)</label>
              <input id="filter-price" type="number" data-testid="filter-max-price" className="field-byd mt-3"
                     placeholder="contoh: 700000000" value={filters.max_price}
                     onChange={(e) => update("max_price", e.target.value)} />
            </div>
          </div>
        )}

        <div className="mt-12">
          {loading ? (
            <SkeletonGrid count={6} />
          ) : vehicles.length === 0 ? (
            <EmptyState testId="models-empty" title="Tidak ada model yang cocok"
                        description="Coba ubah filter atau kata kunci pencarian Anda."
                        action={
                          <button onClick={reset} className="btn-ghost-byd mt-4" data-testid="models-empty-reset">
                            Reset Filter
                          </button>
                        } />
          ) : (
            <>
              <p className="mb-8 text-sm text-white/45" data-testid="models-count">
                {vehicles.length} model ditemukan
              </p>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {vehicles.map((v, i) => (
                  <VehicleCard key={v.id} vehicle={v} index={i} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}
