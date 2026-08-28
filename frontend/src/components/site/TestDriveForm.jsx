import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { api, apiError } from "@/lib/api";
import { attribution, track } from "@/lib/tracking";
import { useSite } from "@/context/SiteContext";

const TIMES = ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00"];

export const TestDriveForm = ({ vehicles = [], defaultVehicle = "", testId = "test-drive-form" }) => {
  const { settings } = useSite();
  const [form, setForm] = useState({
    full_name: "",
    whatsapp: "",
    email: "",
    vehicle_slug: defaultVehicle,
    preferred_date: "",
    preferred_time: "",
    location: settings?.location_name || "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [done, setDone] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const validate = () => {
    const err = {};
    if (form.full_name.trim().length < 2) err.full_name = "Nama wajib diisi";
    if (form.whatsapp.replace(/\D/g, "").length < 9) err.whatsapp = "Nomor WhatsApp tidak valid";
    if (!form.vehicle_slug) err.vehicle_slug = "Pilih model";
    if (!form.preferred_date) err.preferred_date = "Pilih tanggal";
    if (!form.preferred_time) err.preferred_time = "Pilih waktu";
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (loading || !validate()) return;
    setLoading(true);
    try {
      const { data } = await api.post("/public/test-drives", {
        ...form,
        email: form.email || null,
        location: form.location || settings?.location_name,
        lead_source: "test_drive",
        ...attribution(),
      });
      toast.success(data.message);
      track("click_test_drive", { vehicle_slug: form.vehicle_slug });
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
        <p className="font-display text-2xl font-semibold text-white">Permintaan terkirim</p>
        <p className="mt-3 text-sm text-white/60">
          Kami akan mengonfirmasi jadwal test drive Anda melalui WhatsApp.
        </p>
      </div>
    );

  return (
    <form onSubmit={submit} noValidate data-testid={testId} className="border border-white/10 bg-[#111111] p-6 sm:p-8">
      <p className="font-display text-2xl font-semibold text-white">Booking Test Drive</p>
      <p className="mt-2 text-sm text-white/55">
        Rasakan langsung pengalaman berkendara listrik di {settings?.location_name}.
      </p>
      <div className="mt-7 grid gap-6 sm:grid-cols-2">
        <div>
          <label className="overline" htmlFor={`${testId}-name`}>
            Nama Lengkap <span className="text-[#d92d20]">*</span>
          </label>
          <input id={`${testId}-name`} data-testid={`${testId}-name`} className="field-byd mt-2"
                 value={form.full_name} onChange={set("full_name")} />
          {errors.full_name && <p className="mt-2 text-xs text-[#f87171]">{errors.full_name}</p>}
        </div>
        <div>
          <label className="overline" htmlFor={`${testId}-whatsapp`}>
            WhatsApp <span className="text-[#d92d20]">*</span>
          </label>
          <input id={`${testId}-whatsapp`} data-testid={`${testId}-whatsapp`} className="field-byd mt-2"
                 value={form.whatsapp} onChange={set("whatsapp")} placeholder="08xxxxxxxxxx" />
          {errors.whatsapp && <p className="mt-2 text-xs text-[#f87171]">{errors.whatsapp}</p>}
        </div>
        <div>
          <label className="overline" htmlFor={`${testId}-email`}>Email</label>
          <input id={`${testId}-email`} data-testid={`${testId}-email`} className="field-byd mt-2"
                 value={form.email} onChange={set("email")} />
        </div>
        <div>
          <label className="overline" htmlFor={`${testId}-vehicle`}>
            Model <span className="text-[#d92d20]">*</span>
          </label>
          <select id={`${testId}-vehicle`} data-testid={`${testId}-vehicle`} className="field-byd mt-2"
                  value={form.vehicle_slug} onChange={set("vehicle_slug")}>
            <option value="" className="bg-black">Pilih model</option>
            {vehicles.map((v) => (
              <option key={v.slug} value={v.slug} className="bg-black">{v.name}</option>
            ))}
          </select>
          {errors.vehicle_slug && <p className="mt-2 text-xs text-[#f87171]">{errors.vehicle_slug}</p>}
        </div>
        <div>
          <label className="overline" htmlFor={`${testId}-date`}>
            Tanggal <span className="text-[#d92d20]">*</span>
          </label>
          <input type="date" id={`${testId}-date`} data-testid={`${testId}-date`} className="field-byd mt-2"
                 min={new Date().toISOString().slice(0, 10)}
                 value={form.preferred_date} onChange={set("preferred_date")} />
          {errors.preferred_date && <p className="mt-2 text-xs text-[#f87171]">{errors.preferred_date}</p>}
        </div>
        <div>
          <label className="overline" htmlFor={`${testId}-time`}>
            Waktu <span className="text-[#d92d20]">*</span>
          </label>
          <select id={`${testId}-time`} data-testid={`${testId}-time`} className="field-byd mt-2"
                  value={form.preferred_time} onChange={set("preferred_time")}>
            <option value="" className="bg-black">Pilih waktu</option>
            {TIMES.map((t) => (
              <option key={t} value={t} className="bg-black">{t} WIB</option>
            ))}
          </select>
          {errors.preferred_time && <p className="mt-2 text-xs text-[#f87171]">{errors.preferred_time}</p>}
        </div>
        <div className="sm:col-span-2">
          <label className="overline" htmlFor={`${testId}-notes`}>Catatan</label>
          <textarea id={`${testId}-notes`} data-testid={`${testId}-notes`} rows={3}
                    className="field-byd mt-2 resize-none" value={form.notes} onChange={set("notes")} />
        </div>
      </div>
      <button type="submit" disabled={loading} data-testid={`${testId}-submit`}
              className="btn-primary-byd mt-8 w-full disabled:opacity-60">
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {loading ? "Mengirim..." : "Kirim Permintaan Test Drive"}
      </button>
    </form>
  );
};

export default TestDriveForm;
