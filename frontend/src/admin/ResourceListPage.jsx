import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Plus, Search, Trash2, Pencil, Download } from "lucide-react";
import { api, apiError, API } from "@/lib/api";
import { SCHEMAS } from "./schemas";
import { AdminButton, Card, EmptyRow, PageHeader, StatusBadge, inputClass } from "./ui";
import { formatDate, formatIDR } from "@/lib/format";

const renderCell = (col, item) => {
  const value = item[col.key];
  if (col.type === "status") return <StatusBadge status={value} />;
  if (col.type === "currency") return formatIDR(value, "—");
  if (col.type === "date") return value ? formatDate(value) : "—";
  if (col.type === "bool") return value ? "Ya" : "—";
  return value === null || value === undefined || value === "" ? "—" : String(value);
};

export default function ResourceListPage({ resource }) {
  const schema = SCHEMAS[resource];
  const navigate = useNavigate();
  const [data, setData] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState([]);
  const limit = 20;

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (q) params.set("q", q);
      if (status) params.set("status", status);
      const { data: res } = await api.get(`/admin/resources/${resource}?${params}`);
      setData(res);
    } catch (e) {
      toast.error(apiError(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    setSelected([]);
  }, [resource, page, status]);

  const remove = async (id) => {
    if (!window.confirm("Yakin ingin menghapus/mengarsipkan data ini?")) return;
    try {
      const { data: res } = await api.delete(`/admin/resources/${resource}/${id}`);
      toast.success(res.action === "archive" ? "Data diarsipkan" : "Data dihapus");
      load();
    } catch (e) {
      toast.error(apiError(e));
    }
  };

  const bulk = async (action, value) => {
    if (!selected.length) return;
    if (action === "delete" && !window.confirm(`Hapus ${selected.length} data terpilih?`)) return;
    try {
      const { data: res } = await api.post(`/admin/resources/${resource}/bulk`, { ids: selected, action, value });
      toast.success(`${res.affected} data diperbarui`);
      setSelected([]);
      load();
    } catch (e) {
      toast.error(apiError(e));
    }
  };

  const totalPages = Math.max(1, Math.ceil(data.total / limit));

  return (
    <div data-testid={`admin-${resource}-page`}>
      <PageHeader
        title={schema.label}
        description={`${data.total} data tersimpan di database.`}
        actions={
          <>
            <a href={`${API}/admin/export/${resource}?format=csv`} target="_blank" rel="noreferrer"
               data-testid={`admin-${resource}-export`}>
              <AdminButton variant="ghost" as="span">
                <Download className="h-3.5 w-3.5" /> Export CSV
              </AdminButton>
            </a>
            <AdminButton onClick={() => navigate(`/admin/${resource}/new`)}
                         data-testid={`admin-${resource}-create`}>
              <Plus className="h-3.5 w-3.5" /> Tambah {schema.singular}
            </AdminButton>
          </>
        }
      />

      <Card className="mb-6 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <form onSubmit={(e) => { e.preventDefault(); setPage(1); load(); }} className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari..."
                   data-testid={`admin-${resource}-search`} className={`${inputClass} pl-10`} />
          </form>
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                  data-testid={`admin-${resource}-status-filter`} className={`${inputClass} sm:w-52`}>
            <option value="">Semua status</option>
            {["draft", "scheduled", "published", "archived"].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        {selected.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-white/10 pt-4"
               data-testid="admin-bulk-actions">
            <span className="text-xs text-white/50">{selected.length} dipilih</span>
            <AdminButton variant="ghost" onClick={() => bulk("status", "published")}
                         data-testid="admin-bulk-publish">Publish</AdminButton>
            <AdminButton variant="ghost" onClick={() => bulk("status", "draft")}
                         data-testid="admin-bulk-draft">Jadikan Draft</AdminButton>
            <AdminButton variant="danger" onClick={() => bulk("delete")}
                         data-testid="admin-bulk-delete">Hapus</AdminButton>
          </div>
        )}
      </Card>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-[11px] uppercase tracking-[0.14em] text-white/40">
              <th className="w-10 px-4 py-4">
                <input type="checkbox" data-testid="admin-select-all"
                       checked={selected.length > 0 && selected.length === data.items.length}
                       onChange={(e) => setSelected(e.target.checked ? data.items.map((i) => i.id) : [])}
                       className="h-4 w-4 accent-[#d92d20]" />
              </th>
              {schema.listColumns.map((c) => (
                <th key={c.key} className="px-4 py-4">{c.label}</th>
              ))}
              <th className="px-4 py-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <EmptyRow colSpan={schema.listColumns.length + 2} message="Memuat data…" testId="admin-loading-row" />
            ) : data.items.length === 0 ? (
              <EmptyRow colSpan={schema.listColumns.length + 2}
                        message={`Belum ada data ${schema.label.toLowerCase()}. Klik "Tambah ${schema.singular}" untuk membuat yang pertama.`} />
            ) : (
              data.items.map((item) => (
                <tr key={item.id} className="border-b border-white/5 hover:bg-white/[0.03]"
                    data-testid={`admin-${resource}-row-${item.id}`}>
                  <td className="px-4 py-4">
                    <input type="checkbox" checked={selected.includes(item.id)}
                           data-testid={`admin-select-${item.id}`}
                           onChange={(e) =>
                             setSelected((prev) =>
                               e.target.checked ? [...prev, item.id] : prev.filter((i) => i !== item.id)
                             )
                           }
                           className="h-4 w-4 accent-[#d92d20]" />
                  </td>
                  {schema.listColumns.map((c) => (
                    <td key={c.key} className="px-4 py-4 text-white/80">{renderCell(c, item)}</td>
                  ))}
                  <td className="px-4 py-4">
                    <div className="flex justify-end gap-2">
                      <Link to={`/admin/${resource}/${item.id}`} data-testid={`admin-edit-${item.id}`}
                            className="border border-white/15 p-2 text-white/60 hover:text-white">
                        <Pencil className="h-3.5 w-3.5" />
                      </Link>
                      <button onClick={() => remove(item.id)} data-testid={`admin-delete-${item.id}`}
                              className="border border-red-500/30 p-2 text-red-300 hover:bg-red-500/10">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between" data-testid="admin-pagination">
          <AdminButton variant="ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Sebelumnya
          </AdminButton>
          <span className="text-xs text-white/45">Halaman {page} dari {totalPages}</span>
          <AdminButton variant="ghost" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Berikutnya
          </AdminButton>
        </div>
      )}
    </div>
  );
}
