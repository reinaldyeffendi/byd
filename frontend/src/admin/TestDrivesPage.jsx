import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api, apiError } from "@/lib/api";
import { AdminButton, Card, EmptyRow, PageHeader, StatusBadge, inputClass } from "./ui";
import { formatDateTime } from "@/lib/format";

const STATUSES = ["requested", "confirmed", "rescheduled", "completed", "cancelled"];

export default function TestDrivesPage() {
  const [data, setData] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null);
  const [form, setForm] = useState({ preferred_date: "", preferred_time: "", note: "" });

  const load = async () => {
    setLoading(true);
    try {
      const { data: res } = await api.get("/admin/resources/test-drives?limit=50");
      setData(res);
    } catch (e) {
      toast.error(apiError(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openModal = (td) => {
    setActive(td);
    setForm({ preferred_date: (td.preferred_date || "").slice(0, 10), preferred_time: td.preferred_time || "", note: td.admin_notes || "" });
  };

  const setStatus = async (status) => {
    try {
      await api.post(`/admin/test-drives/${active.id}/status`, { status, ...form });
      toast.success("Status test drive diperbarui");
      setActive(null);
      load();
    } catch (e) {
      toast.error(apiError(e));
    }
  };

  return (
    <div data-testid="admin-testdrives-page">
      <PageHeader title="Permintaan Test Drive" description={`${data.total} permintaan tersimpan.`} />

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-[11px] uppercase tracking-[0.14em] text-white/40">
              <th className="px-4 py-4">Nama</th>
              <th className="px-4 py-4">WhatsApp</th>
              <th className="px-4 py-4">Model</th>
              <th className="px-4 py-4">Jadwal</th>
              <th className="px-4 py-4">Lokasi</th>
              <th className="px-4 py-4">Masuk</th>
              <th className="px-4 py-4">Status</th>
              <th className="px-4 py-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <EmptyRow colSpan={8} message="Memuat data…" />
            ) : data.items.length === 0 ? (
              <EmptyRow colSpan={8} testId="testdrives-empty"
                        message="Belum ada permintaan test drive. Permintaan akan muncul otomatis dari formulir publik." />
            ) : (
              data.items.map((td) => (
                <tr key={td.id} className="border-b border-white/5 hover:bg-white/[0.03]"
                    data-testid={`testdrive-row-${td.id}`}>
                  <td className="px-4 py-4 text-white">{td.full_name}</td>
                  <td className="px-4 py-4 text-white/70">{td.whatsapp}</td>
                  <td className="px-4 py-4 text-white/70">{td.vehicle_name}</td>
                  <td className="px-4 py-4 text-white/70">{td.preferred_date} {td.preferred_time}</td>
                  <td className="px-4 py-4 text-white/70">{td.location || "—"}</td>
                  <td className="px-4 py-4 text-white/50">{formatDateTime(td.created_at)}</td>
                  <td className="px-4 py-4"><StatusBadge status={td.status} /></td>
                  <td className="px-4 py-4 text-right">
                    <AdminButton variant="ghost" onClick={() => openModal(td)}
                                 data-testid={`testdrive-open-${td.id}`}>Kelola</AdminButton>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>

      {active && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-5"
             data-testid="testdrive-modal">
          <Card className="w-full max-w-lg p-7">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/40">Kelola Test Drive</p>
                <p className="mt-2 font-display text-2xl font-bold text-white">{active.full_name}</p>
                <p className="mt-1 text-sm text-white/50">{active.vehicle_name}</p>
              </div>
              <button onClick={() => setActive(null)} data-testid="testdrive-modal-close"
                      className="text-white/50 hover:text-white">Tutup</button>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/40">Tanggal</p>
                <input type="date" className={`${inputClass} mt-2`} value={form.preferred_date}
                       data-testid="testdrive-date"
                       onChange={(e) => setForm((f) => ({ ...f, preferred_date: e.target.value }))} />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/40">Waktu</p>
                <input className={`${inputClass} mt-2`} value={form.preferred_time}
                       data-testid="testdrive-time"
                       onChange={(e) => setForm((f) => ({ ...f, preferred_time: e.target.value }))} />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/40">Catatan Admin</p>
              <textarea rows={3} className={`${inputClass} mt-2`} value={form.note}
                        data-testid="testdrive-note"
                        onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} />
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {STATUSES.map((s) => (
                <button key={s} onClick={() => setStatus(s)} data-testid={`testdrive-status-${s}`}
                        className={`border px-3 py-2 text-xs transition-colors duration-200 ${
                          active.status === s
                            ? "border-[#d92d20] text-white"
                            : "border-white/15 text-white/60 hover:text-white"
                        }`}>
                  {s}
                </button>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
