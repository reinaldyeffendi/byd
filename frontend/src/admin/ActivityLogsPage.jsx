import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api, apiError } from "@/lib/api";
import { AdminButton, Card, PageHeader } from "./ui";
import { formatDateTime } from "@/lib/format";

export default function ActivityLogsPage() {
  const [data, setData] = useState({ items: [], total: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const limit = 30;

  useEffect(() => {
    setLoading(true);
    api
      .get(`/admin/activity-logs?page=${page}&limit=${limit}`)
      .then((r) => setData(r.data))
      .catch((e) => toast.error(apiError(e)))
      .finally(() => setLoading(false));
  }, [page]);

  const totalPages = Math.max(1, Math.ceil(data.total / limit));

  return (
    <div data-testid="admin-logs-page">
      <PageHeader title="Activity Log" description={`${data.total} aktivitas tercatat.`} />
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[780px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-[11px] uppercase tracking-[0.14em] text-white/40">
              <th className="px-4 py-4">Waktu</th>
              <th className="px-4 py-4">User</th>
              <th className="px-4 py-4">Role</th>
              <th className="px-4 py-4">Aksi</th>
              <th className="px-4 py-4">Entitas</th>
              <th className="px-4 py-4">Entity ID</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-5 py-14 text-center text-white/40">Memuat…</td></tr>
            ) : data.items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-14 text-center text-white/40" data-testid="logs-empty">
                  Belum ada aktivitas tercatat.
                </td>
              </tr>
            ) : (
              data.items.map((log) => (
                <tr key={log.id} className="border-b border-white/5" data-testid={`log-row-${log.id}`}>
                  <td className="px-4 py-4 text-white/50">{formatDateTime(log.created_at)}</td>
                  <td className="px-4 py-4 text-white">{log.user_email}</td>
                  <td className="px-4 py-4 text-white/60">{log.user_role}</td>
                  <td className="px-4 py-4 text-white/80">{log.action}</td>
                  <td className="px-4 py-4 text-white/60">{log.entity}</td>
                  <td className="max-w-[180px] truncate px-4 py-4 text-white/40">{log.entity_id}</td>
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
    </div>
  );
}
