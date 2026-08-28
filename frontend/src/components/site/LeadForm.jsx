import { useState } from "react";
import { toast } from "sonner";
import { api, apiError } from "@/lib/api";
import { attribution, track } from "@/lib/tracking";
import { Loader2 } from "lucide-react";

const TIMELINES = ["Segera (< 1 bulan)", "1 - 3 bulan", "3 - 6 bulan", "Masih riset"];
const BUDGETS = ["< 400 juta", "400 - 600 juta", "600 - 800 juta", "> 800 juta"];
const FINANCING = ["Kredit", "Tunai", "Belum tahu"];

export const LeadForm = ({
  vehicleSlug,
  promotionSlug,
  vehicles = [],
  source = "website",
  compact = false,
  title = "Dapatkan Penawaran",
  subtitle = "Isi data singkat, sales consultant kami akan menghubungi Anda via WhatsApp.",
  testId = "lead-form",
}) => {
  const [form, setForm] = useState({
    full_name: "",
    whatsapp: "",
    email: "",
    city: "",
    vehicle_slug: vehicleSlug || "",
    budget: "",
    timeline: "",
    financing: "",
    trade_in: false,
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [done, setDone] = useState(false);
  const [started, setStarted] = useState(false);

  const set = (key) => (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [key]: value }));
    if (!started) {
      setStarted(true);
      track("form_start", { meta: { source } });
    }
  };

  const validate = () => {
    const err = {};
    if (form.full_name.trim().length < 2) err.full_name = "Nama wajib diisi";
    const digits = form.whatsapp.replace(/\D/g, "");
    if (digits.length < 9) err.whatsapp = "Nomor WhatsApp tidak valid";
    if (form.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) err.email = "Email tidak valid";
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (loading || !validate()) return;
    setLoading(true);
    try {
      const { data } = await api.post("/public/leads", {
        ...form,
        email: form.email || null,
        promotion_slug: promotionSlug || null,
        lead_source: source,
        ...attribution(),
      });
      toast.success(data.message);
      track("lead_submit", { vehicle_slug: form.vehicle_slug, meta: { source } });
      setDone(true);
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setLoading(false);
    }
  };

  if (done)
    return (
      <div data-testid={`${testId}-success`} className="border border-white/10 bg-[#111111] p-8">
        <p className="font-display text-2xl font-semibold text-white">Terima kasih!</p>
        <p className="mt-3 text-sm text-white/60">
          Permintaan Anda sudah kami terima. Sales consultant akan menghubungi Anda melalui WhatsApp.
        </p>
      </div>
    );

  return (
    <form
      onSubmit={submit}
      data-testid={testId}
      noValidate
      className="border border-white/10 bg-[#111111] p-6 sm:p-8"
    >
      <p className="font-display text-2xl font-semibold text-white">{title}</p>
      <p className="mt-2 text-sm text-white/55">{subtitle}</p>

      <div className="mt-7 grid gap-6 sm:grid-cols-2">
        <div className="sm:col-span-1">
          <label htmlFor={`${testId}-name`} className="overline">
            Nama Lengkap <span className="text-[#d92d20]">*</span>
          </label>
          <input
            id={`${testId}-name`}
            data-testid={`${testId}-name`}
            className="field-byd mt-2"
            value={form.full_name}
            onChange={set("full_name")}
            required
          />
          {errors.full_name && <p className="mt-2 text-xs text-[#f87171]">{errors.full_name}</p>}
        </div>
        <div>
          <label htmlFor={`${testId}-whatsapp`} className="overline">
            Nomor WhatsApp <span className="text-[#d92d20]">*</span>
          </label>
          <input
            id={`${testId}-whatsapp`}
            data-testid={`${testId}-whatsapp`}
            className="field-byd mt-2"
            placeholder="08xxxxxxxxxx"
            value={form.whatsapp}
            onChange={set("whatsapp")}
            required
          />
          {errors.whatsapp && <p className="mt-2 text-xs text-[#f87171]">{errors.whatsapp}</p>}
        </div>

        {!compact && (
          <>
            <div>
              <label htmlFor={`${testId}-email`} className="overline">Email</label>
              <input
                id={`${testId}-email`}
                data-testid={`${testId}-email`}
                className="field-byd mt-2"
                value={form.email}
                onChange={set("email")}
              />
              {errors.email && <p className="mt-2 text-xs text-[#f87171]">{errors.email}</p>}
            </div>
            <div>
              <label htmlFor={`${testId}-city`} className="overline">Kota</label>
              <input
                id={`${testId}-city`}
                data-testid={`${testId}-city`}
                className="field-byd mt-2"
                value={form.city}
                onChange={set("city")}
              />
            </div>
            {vehicles.length > 0 && (
              <div>
                <label htmlFor={`${testId}-vehicle`} className="overline">Model Diminati</label>
                <select
                  id={`${testId}-vehicle`}
                  data-testid={`${testId}-vehicle`}
                  className="field-byd mt-2"
                  value={form.vehicle_slug}
                  onChange={set("vehicle_slug")}
                >
                  <option value="" className="bg-black">Pilih model</option>
                  {vehicles.map((v) => (
                    <option key={v.slug} value={v.slug} className="bg-black">
                      {v.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label htmlFor={`${testId}-timeline`} className="overline">Rencana Pembelian</label>
              <select
                id={`${testId}-timeline`}
                data-testid={`${testId}-timeline`}
                className="field-byd mt-2"
                value={form.timeline}
                onChange={set("timeline")}
              >
                <option value="" className="bg-black">Pilih</option>
                {TIMELINES.map((t) => (
                  <option key={t} value={t} className="bg-black">{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor={`${testId}-budget`} className="overline">Perkiraan Budget</label>
              <select
                id={`${testId}-budget`}
                data-testid={`${testId}-budget`}
                className="field-byd mt-2"
                value={form.budget}
                onChange={set("budget")}
              >
                <option value="" className="bg-black">Pilih</option>
                {BUDGETS.map((t) => (
                  <option key={t} value={t} className="bg-black">{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor={`${testId}-financing`} className="overline">Metode Pembayaran</label>
              <select
                id={`${testId}-financing`}
                data-testid={`${testId}-financing`}
                className="field-byd mt-2"
                value={form.financing}
                onChange={set("financing")}
              >
                <option value="" className="bg-black">Pilih</option>
                {FINANCING.map((t) => (
                  <option key={t} value={t} className="bg-black">{t}</option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-3 self-end text-sm text-white/60">
              <input
                type="checkbox"
                data-testid={`${testId}-tradein`}
                checked={form.trade_in}
                onChange={set("trade_in")}
                className="h-4 w-4 accent-[#d92d20]"
              />
              Tertarik tukar tambah
            </label>
          </>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        data-testid={`${testId}-submit`}
        className="btn-primary-byd mt-8 w-full disabled:opacity-60"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {loading ? "Mengirim..." : "Kirim Permintaan"}
      </button>
      <p className="mt-4 text-xs text-white/35">
        Dengan mengirim formulir, Anda menyetujui kebijakan privasi kami.
      </p>
    </form>
  );
};

export default LeadForm;
