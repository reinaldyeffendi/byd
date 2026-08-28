import { useEffect, useState } from "react";
import { toast } from "sonner";
import { RefreshCw, Check, X } from "lucide-react";
import { api, apiError } from "@/lib/api";
import { AdminButton, Card, PageHeader, StatusBadge, inputClass } from "./ui";
import { formatDateTime } from "@/lib/format";

export default function ImportPage() {
  const [history, setHistory] = useState([]);
  const [records, setRecords] = useState([]);
  const [activeImport, setActiveImport] = useState(null);
  const [selected, setSelected] = useState([]);
  const [url, setUrl] = useState("https://byd.bipoauto.com/");
  const [running, setRunning] = useState(false);

  const loadHistory = async () => {
    try {
      const { data } = await api.get("/admin/import/history");
      setHistory(data);
    } catch (e) {
      toast.error(apiError(e));
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const run = async () => {
    setRunning(true);
    try {
      const { data } = await api.post("/admin/import/run", { url });
      toast.success(`${data.records_found} record ditemukan, siap direview`);
      await loadHistory();
      openRecords(data.import_id);
    } catch (e) {
      toast.error(apiError(e));
    } finally {
      setRunning(false);
    }
  };

  const openRecords = async (importId) => {
    setActiveImport(importId);
    setSelected([]);
    try {
      const { data } = await api.get(`/admin/import/${importId}/records`);
      setRecords(data);
    } catch (e) {
      toast.error(apiError(e));
    }
  };

  const apply = async (action) => {
    if (!selected.length) {
      toast.error("Pilih minimal satu record");
      return;
    }
    try {
      const { data } = await api.post("/admin/import/apply", {
        import_id: activeImport,
        record_ids: selected,
        action,
      });
      toast.success(action === "approve" ? `${data.applied} record diterapkan` : `${data.rejected} record ditolak`);
      openRecords(activeImport);
      loadHistory();
    } catch (e) {
      toast.error(apiError(e));
    }
  };

  return (
    <div data-testid="admin-import-page">
      <PageHeader title="Content Import / Sync"
                  description="Impor data publik dari situs sumber, review, lalu setujui sebelum masuk ke katalog. Field yang sudah diedit manual tidak akan ditimpa." />

      <Card className="mb-6 p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#d92d20]">Jalankan Import</p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <input value={url} onChange={(e) => setUrl(e.target.value)} data-testid="import-url-input"
                 className={`${inputClass} flex-1`} />
          <AdminButton onClick={run} disabled={running} data-testid="import-run-button">
            <RefreshCw className={`h-3.5 w-3.5 ${running ? "animate-spin" : ""}`} />
            {running ? "Mengimpor…" : "Import Sekarang"}
          </AdminButton>
        </div>
        <p className="mt-4 text-xs text-white/40">
          Sinkronisasi terjadwal tidak aktif secara default. Import hanya berjalan ketika Anda menekan tombol di atas.
        </p>
      </Card>

      <Card className="mb-6 overflow-x-auto">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-[11px] uppercase tracking-[0.14em] text-white/40">
              <th className="px-4 py-4">Sumber</th>
              <th className="px-4 py-4">Waktu</th>
              <th className="px-4 py-4">Record</th>
              <th className="px-4 py-4">Status</th>
              <th className="px-4 py-4">Oleh</th>
              <th className="px-4 py-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {history.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-14 text-center text-sm text-white/40" data-testid="import-empty">
                  Belum ada riwayat import.
                </td>
              </tr>
            ) : (
              history.map((h) => (
                <tr key={h.id} className="border-b border-white/5" data-testid={`import-row-${h.id}`}>
                  <td className="max-w-[240px] truncate px-4 py-4 text-white/70">{h.source_url}</td>
                  <td className="px-4 py-4 text-white/50">{formatDateTime(h.started_at)}</td>
                  <td className="px-4 py-4 text-white/70">{h.records_found ?? 0}</td>
                  <td className="px-4 py-4"><StatusBadge status={h.status} /></td>
                  <td className="px-4 py-4 text-white/50">{h.created_by}</td>
                  <td className="px-4 py-4 text-right">
                    <AdminButton variant="ghost" onClick={() => openRecords(h.id)}
                                 data-testid={`import-review-${h.id}`}>Review</AdminButton>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>

      {activeImport && (
        <Card className="p-6" data-testid="import-records-panel">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
              Preview Record ({records.length})
            </p>
            <div className="flex gap-2">
              <AdminButton variant="ghost" onClick={() => apply("reject")} data-testid="import-reject">
                <X className="h-3 w-3" /> Tolak Terpilih
              </AdminButton>
              <AdminButton onClick={() => apply("approve")} data-testid="import-approve">
                <Check className="h-3 w-3" /> Setujui Terpilih
              </AdminButton>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-[11px] uppercase tracking-[0.14em] text-white/40">
                  <th className="w-10 px-4 py-3">
                    <input type="checkbox" data-testid="import-select-all"
                           onChange={(e) =>
                             setSelected(e.target.checked
                               ? records.filter((r) => r.state === "pending").map((r) => r.id)
                               : [])
                           }
                           className="h-4 w-4 accent-[#d92d20]" />
                  </th>
                  <th className="px-4 py-3">Model</th>
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3">Aksi Data</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Gambar</th>
                </tr>
              </thead>
              <tbody>
                {records.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-sm text-white/40">
                      Tidak ada record pada import ini.
                    </td>
                  </tr>
                ) : (
                  records.map((r) => (
                    <tr key={r.id} className="border-b border-white/5" data-testid={`import-record-${r.id}`}>
                      <td className="px-4 py-3">
                        <input type="checkbox" checked={selected.includes(r.id)}
                               disabled={r.state !== "pending"}
                               data-testid={`import-record-select-${r.id}`}
                               onChange={(e) =>
                                 setSelected((prev) =>
                                   e.target.checked ? [...prev, r.id] : prev.filter((i) => i !== r.id)
                                 )
                               }
                               className="h-4 w-4 accent-[#d92d20]" />
                      </td>
                      <td className="px-4 py-3 text-white">{r.data?.name}</td>
                      <td className="px-4 py-3 text-white/60">{r.data?.category}</td>
                      <td className="px-4 py-3 text-white/60">{r.match_type}</td>
                      <td className="px-4 py-3"><StatusBadge status={r.state} /></td>
                      <td className="px-4 py-3">
                        {r.data?.hero_image && (
                          <img src={r.data.hero_image} alt="" className="h-12 w-20 object-contain" />
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
