import { useState } from "react";
import { toast } from "sonner";
import { Eye, Upload } from "lucide-react";
import { api, apiError } from "@/lib/api";
import { AdminButton, Card, PageHeader, StatusBadge, inputClass } from "./ui";
import { formatIDR } from "@/lib/format";

const TEMPLATE = `slug,harga,baterai,jarak,kursi,motor,tenaga,torsi,pengisian,garansi
byd-m6,0,0,0,7,,,,,
byd-seal,0,0,0,5,,,,,`;

export default function QuickImportPage() {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const run = async (dryRun) => {
    if (!text.trim()) {
      toast.error("Tempel data terlebih dahulu");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/admin/quick-import/vehicles", { text, dry_run: dryRun });
      setResult(data);
      if (dryRun) toast.success(`${data.rows.length} baris dibaca — periksa pratinjau di bawah`);
      else toast.success(`${data.applied} model diperbarui`);
    } catch (e) {
      toast.error(apiError(e));
    } finally {
      setLoading(false);
    }
  };

  const notFound = result?.rows.filter((r) => r.match === "not_found").length || 0;

  return (
    <div data-testid="admin-quick-import-page">
      <PageHeader
        title="Import Cepat Harga & Spesifikasi"
        description="Tempel tabel dari Excel/Google Sheets (atau CSV). Sistem mencocokkan baris ke model lewat kolom slug atau nama, lalu memperbarui hanya kolom yang Anda isi."
        actions={
          <>
            <AdminButton variant="ghost" onClick={() => setText(TEMPLATE)} data-testid="quick-import-template">
              Isi Contoh Template
            </AdminButton>
            <AdminButton variant="ghost" disabled={loading} onClick={() => run(true)}
                         data-testid="quick-import-preview">
              <Eye className="h-3.5 w-3.5" /> Pratinjau
            </AdminButton>
            <AdminButton disabled={loading || !result} onClick={() => run(false)}
                         data-testid="quick-import-apply">
              <Upload className="h-3.5 w-3.5" /> Terapkan ke Katalog
            </AdminButton>
          </>
        }
      />

      <Card className="mb-6 p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#d92d20]">
          Data Tempel
        </p>
        <p className="mt-3 text-xs leading-relaxed text-white/45">
          Kolom yang dikenali: <code>slug</code>, <code>nama</code>, <code>harga</code>,{" "}
          <code>harga_promo</code>, <code>baterai</code>, <code>jarak</code>, <code>kursi</code>,{" "}
          <code>motor</code>, <code>tenaga</code>, <code>torsi</code>, <code>pengisian</code>,{" "}
          <code>akselerasi</code>, <code>garansi</code>. Pemisah otomatis: tab, koma, atau titik koma.
          Kolom yang dibiarkan kosong tidak akan menimpa data yang sudah ada.
        </p>
        <textarea rows={10} value={text} onChange={(e) => setText(e.target.value)}
                  data-testid="quick-import-textarea" placeholder={TEMPLATE}
                  className={`${inputClass} mt-4 font-mono`} />
      </Card>

      {result && (
        <Card className="p-6" data-testid="quick-import-result">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
              Pratinjau ({result.rows.length} baris) — {result.dry_run ? "belum diterapkan" : `${result.applied} diterapkan`}
            </p>
            {notFound > 0 && (
              <p className="text-xs text-amber-300" data-testid="quick-import-warning">
                {notFound} baris tidak menemukan model yang cocok dan akan dilewati.
              </p>
            )}
          </div>

          {result.errors?.length > 0 && (
            <ul className="mt-4 space-y-1 border border-amber-500/30 bg-amber-500/5 p-4 text-xs text-amber-200">
              {result.errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          )}

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-[11px] uppercase tracking-[0.14em] text-white/40">
                  <th className="px-4 py-3">Model</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Perubahan</th>
                </tr>
              </thead>
              <tbody>
                {result.rows.map((row, i) => (
                  <tr key={i} className="border-b border-white/5" data-testid={`quick-import-row-${i}`}>
                    <td className="px-4 py-3 text-white">{row.target}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={row.match === "update" ? "published" : "archived"} />
                    </td>
                    <td className="px-4 py-3 text-white/70">
                      {Object.entries(row.changes || {}).length === 0 ? (
                        <span className="text-white/35">Tidak ada perubahan</span>
                      ) : (
                        Object.entries(row.changes).map(([k, v]) => (
                          <span key={k} className="mr-3 inline-block">
                            {k}:{" "}
                            <strong className="text-white">
                              {k.includes("price") ? formatIDR(v, "-") : String(v)}
                            </strong>
                          </span>
                        ))
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
