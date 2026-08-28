import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Download, Search } from "lucide-react";
import { api, apiError, API } from "@/lib/api";
import { AdminButton, Card, EmptyRow, PageHeader, StatusBadge, inputClass } from "./ui";
import { formatDateTime } from "@/lib/format";

const STATUSES = ["new", "contacted", "qualified", "test_drive_scheduled", "negotiation",
  "booking", "won", "lost", "follow_up"];

export default function LeadsPage() {
  const [data, setData] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [active, setActive] = useState(null);
  const [note, setNote] = useState("");
  const limit = 20;

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (q) params.set("q", q);
      if (status) params.set("status", status);
      const { data: res } = await api.get(`/admin/resources/leads?${params}`);
      setData(res);
    } catch (e) {
      toast.error(apiError(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [page, status]);

  const changeStatus = async (lead, newStatus, noteText) => {
    try {
      const { data: updated } = await api.post(`/admin/leads/${lead.id}/status`, {
        status: newStatus,
        note: noteText || null,
      });
      toast.success("Status lead diperbarui");
      setActive(updated);
      setNote("");
      load();
    } catch (e) {
      toast.error(apiError(e));
    }
  };

  const totalPages = Math.max(1, Math.ceil(data.total / limit));

  return (
    <div data-testid="admin-leads-page">
      <PageHeader title="Leads" description={`${data.total} prospek tersimpan.`}
                  actions={
                    <a href={`${API}/admin/export/leads?format=csv`} target="_blank" rel="noreferrer"
                       data-testid="leads-export">
                      <AdminButton variant="ghost" as="span">
                        <Download className="h-3.5 w-3.5" /> Export CSV
                      </AdminButton>
                    </a>
                  } />

      <Card className="mb-6 p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <form onSubmit={(e) => { e.preventDefault(); setPage(1); load(); }} className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
            <input value={q} onChange={(e) => setQ(e.target.value)} data-testid="leads-search"
                   placeholder="Cari nama / WhatsApp / kota" className={`${inputClass} pl-10`} />
          </form>
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                  data-testid="leads-status-filter" className={`${inputClass} sm:w-60`}>
            <option value="">Semua status</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
            ))}
          </select>
        </div>
      </Card>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[840px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-[11px] uppercase tracking-[0.14em] text-white/40">
              <th className="px-4 py-4">Nama</th>
              <th className="px-4 py-4">WhatsApp</th>
              <th className="px-4 py-4">Model</th>
              <th className="px-4 py-4">Sumber</th>
              <th className="px-4 py-4">Kampanye</th>
              <th className="px-4 py-4">Masuk</th>
              <th className="px-4 py-4">Status</th>
              <th className="px-4 py-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <EmptyRow colSpan={8} message="Memuat data…" />
            ) : data.items.length === 0 ? (
              <EmptyRow colSpan={8}
                        message="Belum ada lead masuk. Lead akan muncul otomatis ketika pengunjung mengirim formulir."
                        testId="leads-empty" />
            ) : (
              data.items.map((lead) => (
                <tr key={lead.id} className="border-b border-white/5 hover:bg-white/[0.03]"
                    data-testid={`lead-row-${lead.id}`}>
                  <td className="px-4 py-4 text-white">{lead.full_name}</td>
                  <td className="px-4 py-4 text-white/70">
                    <a href={`https://wa.me/${lead.whatsapp}`} target="_blank" rel="noreferrer"
                       className="hover:text-[#d92d20]">{lead.whatsapp}</a>
                  </td>
                  <td className="px-4 py-4 text-white/70">{lead.vehicle_name || "—"}</td>
                  <td className="px-4 py-4 text-white/70">{lead.lead_source || "—"}</td>
                  <td className="px-4 py-4 text-white/70">{lead.utm_campaign || "—"}</td>
                  <td className="px-4 py-4 text-white/50">{formatDateTime(lead.created_at)}</td>
                  <td className="px-4 py-4"><StatusBadge status={lead.status} /></td>
                  <td className="px-4 py-4 text-right">
                    <AdminButton variant="ghost" onClick={() => setActive(lead)}
                                 data-testid={`lead-open-${lead.id}`}>
                      Kelola
                    </AdminButton>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <AdminButton variant="ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Sebelumnya
          </AdminButton>
          <span className="text-xs text-white/45">Halaman {page} dari {totalPages}</span>
          <AdminButton variant="ghost" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Berikutnya
          </AdminButton>
        </div>
      )}

      {active && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-5"
             data-testid="lead-detail-modal">
          <Card className="max-h-[85vh] w-full max-w-2xl overflow-y-auto p-7">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/40">Detail Lead</p>
                <p className="mt-2 font-display text-2xl font-bold text-white">{active.full_name}</p>
              </div>
              <button onClick={() => setActive(null)} data-testid="lead-modal-close"
                      className="text-white/50 hover:text-white">Tutup</button>
            </div>

            <dl className="mt-7 grid gap-4 sm:grid-cols-2 text-sm">
              {[
                ["WhatsApp", active.whatsapp],
                ["Email", active.email],
                ["Kota", active.city],
                ["Model", active.vehicle_name],
                ["Budget", active.budget],
                ["Timeline", active.timeline],
                ["Pembayaran", active.financing],
                ["Trade-in", active.trade_in ? "Ya" : "Tidak"],
                ["Sumber", active.lead_source],
                ["UTM Source", active.utm_source],
                ["UTM Medium", active.utm_medium],
                ["UTM Campaign", active.utm_campaign],
                ["Landing page", active.landing_page],
                ["Device", active.device],
              ].map(([label, value]) => (
                <div key={label} className="border-b border-white/10 pb-3">
                  <dt className="text-xs text-white/40">{label}</dt>
                  <dd className="mt-1 text-white/85">{value || "—"}</dd>
                </div>
              ))}
            </dl>

            {active.message && (
              <div className="mt-6 border border-white/10 p-4 text-sm text-white/70">{active.message}</div>
            )}

            <div className="mt-7">
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/40">Catatan Sales</p>
              <div className="mt-3 space-y-2">
                {(active.notes || []).map((n, i) => (
                  <div key={i} className="border border-white/10 p-3 text-sm text-white/70">
                    {n.text}
                    <span className="mt-1 block text-xs text-white/35">
                      {n.author} · {formatDateTime(n.created_at)}
                    </span>
                  </div>
                ))}
                {!(active.notes || []).length && <p className="text-sm text-white/35">Belum ada catatan.</p>}
              </div>
              <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)}
                        data-testid="lead-note-input" placeholder="Tambahkan catatan…"
                        className={`${inputClass} mt-3`} />
            </div>

            <div className="mt-6">
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/40">Ubah Status</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {STATUSES.map((s) => (
                  <button key={s} onClick={() => changeStatus(active, s, note)}
                          data-testid={`lead-status-${s}`}
                          className={`border px-3 py-2 text-xs transition-colors duration-200 ${
                            active.status === s
                              ? "border-[#d92d20] text-white"
                              : "border-white/15 text-white/60 hover:text-white"
                          }`}>
                    {s.replace(/_/g, " ")}
                  </button>
                ))}
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
