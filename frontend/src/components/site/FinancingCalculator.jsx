import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { formatIDR } from "@/lib/format";
import { useSite } from "@/context/SiteContext";
import { track } from "@/lib/tracking";

export const FinancingCalculator = ({ defaultPrice = 500000000, vehicles = [] }) => {
  const { settings } = useSite();
  const fin = settings?.financing || {};
  const periods = fin.loan_periods?.length ? fin.loan_periods : [12, 24, 36, 48, 60];

  const [price, setPrice] = useState(defaultPrice);
  const [dpPercent, setDpPercent] = useState(fin.min_dp_percent || 20);
  const [months, setMonths] = useState(periods[Math.floor(periods.length / 2)]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const priceOptions = useMemo(
    () => vehicles.filter((v) => v.starting_price).map((v) => ({ label: v.name, value: v.starting_price })),
    [vehicles]
  );

  useEffect(() => {
    let cancel = false;
    const run = async () => {
      if (!price || price <= 0) return;
      setLoading(true);
      try {
        const { data } = await api.post("/public/financing/simulate", {
          price: Number(price),
          dp_percent: Number(dpPercent),
          months: Number(months),
        });
        if (!cancel) setResult(data);
      } finally {
        if (!cancel) setLoading(false);
      }
    };
    const t = setTimeout(run, 350);
    return () => {
      cancel = true;
      clearTimeout(t);
    };
  }, [price, dpPercent, months]);

  return (
    <div className="grid gap-10 border border-white/10 bg-[#111111] p-6 sm:p-10 lg:grid-cols-2"
         data-testid="financing-calculator">
      <div>
        <p className="overline">Simulasi Kredit</p>
        <h3 className="mt-3 text-2xl font-semibold text-white">Hitung estimasi cicilan</h3>

        <div className="mt-8 space-y-8">
          {priceOptions.length > 0 && (
            <div>
              <label className="overline" htmlFor="fin-vehicle">Pilih Model (opsional)</label>
              <select id="fin-vehicle" data-testid="financing-vehicle" className="field-byd mt-2"
                      onChange={(e) => e.target.value && setPrice(Number(e.target.value))}>
                <option value="" className="bg-black">Input harga manual</option>
                {priceOptions.map((o) => (
                  <option key={o.label} value={o.value} className="bg-black">{o.label}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="overline" htmlFor="fin-price">Harga Kendaraan (IDR)</label>
            <input id="fin-price" type="number" data-testid="financing-price" className="field-byd mt-2"
                   value={price} min={0} step={1000000} onChange={(e) => setPrice(e.target.value)} />
          </div>
          <div>
            <label className="overline" htmlFor="fin-dp">
              Uang Muka — {dpPercent}% ({formatIDR((price * dpPercent) / 100, "-")})
            </label>
            <input id="fin-dp" type="range" min={fin.min_dp_percent || 10} max={70} step={1}
                   value={dpPercent} data-testid="financing-dp"
                   onChange={(e) => setDpPercent(e.target.value)}
                   className="mt-4 w-full accent-[#d92d20]" />
          </div>
          <div>
            <p className="overline">Tenor</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {periods.map((p) => (
                <button key={p} type="button" data-testid={`financing-tenor-${p}`}
                        onClick={() => setMonths(p)}
                        className={`border px-4 py-2.5 text-xs uppercase tracking-[0.14em] transition-colors duration-300 ${
                          Number(months) === p
                            ? "border-[#d92d20] bg-[#d92d20]/10 text-white"
                            : "border-white/20 text-white/60 hover:text-white"
                        }`}>
                  {p} bln
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col justify-between border-t border-white/10 pt-8 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
        <div>
          <p className="overline">Estimasi Cicilan / Bulan</p>
          <p className="mt-3 font-display text-4xl font-extrabold text-white sm:text-5xl"
             data-testid="financing-monthly">
            {loading ? "Menghitung..." : formatIDR(result?.monthly_installment, "-")}
          </p>
          <dl className="mt-8 space-y-4 text-sm">
            {[
              ["Uang muka", result?.dp_amount],
              ["Pokok pembiayaan", result?.financing_amount],
              ["Estimasi bunga", result?.total_interest],
              ["Estimasi asuransi", result?.insurance],
              ["Biaya lain", result?.fees],
              ["Total pembayaran", result?.total_payment],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between border-b border-white/10 pb-3">
                <dt className="text-white/50">{label}</dt>
                <dd className="font-medium text-white">{formatIDR(value, "-")}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-xs text-white/40">
            Asumsi bunga flat {result?.interest_rate ?? fin.interest_rate}% per tahun.
          </p>
        </div>
        <div className="mt-8 border border-[#d92d20]/30 bg-[#d92d20]/10 p-4 text-xs leading-relaxed text-white/70"
             data-testid="financing-disclaimer">
          {result?.disclaimer || fin.disclaimer}
        </div>
        <button type="button" data-testid="financing-track-cta"
                onClick={() => track("financing_calculation", { meta: { price, months } })}
                className="btn-ghost-byd mt-6">
          Simpan Simulasi Ini
        </button>
      </div>
    </div>
  );
};

export default FinancingCalculator;
