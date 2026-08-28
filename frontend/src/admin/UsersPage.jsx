import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { api, apiError } from "@/lib/api";
import { AdminButton, Card, Field, PageHeader, StatusBadge, inputClass } from "./ui";
import { formatDateTime } from "@/lib/format";

const ROLES = ["super_admin", "content_admin", "sales_admin", "analytics_admin"];

const ROLE_DESCRIPTIONS = {
  super_admin: "Akses penuh ke seluruh modul, termasuk pengaturan dan pengguna.",
  content_admin: "Kendaraan, promo, artikel, event, testimoni, media, homepage, import.",
  sales_admin: "Leads, test drive, catatan pelanggan, dan analitik penjualan.",
  analytics_admin: "Hanya membaca analitik; tidak dapat mengubah konten atau pengaturan.",
};

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "content_admin" });
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/auth/users");
      setUsers(data);
    } catch (e) {
      toast.error(apiError(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const create = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) {
      toast.error("Password minimal 8 karakter");
      return;
    }
    setCreating(true);
    try {
      await api.post("/auth/users", form);
      toast.success("User dibuat");
      setForm({ name: "", email: "", password: "", role: "content_admin" });
      load();
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setCreating(false);
    }
  };

  const changeRole = async (user, role) => {
    try {
      await api.put(`/auth/users/${user.id}`, { role });
      toast.success("Role diperbarui");
      load();
    } catch (e) {
      toast.error(apiError(e));
    }
  };

  const toggleActive = async (user) => {
    try {
      await api.put(`/auth/users/${user.id}`, { is_active: !(user.is_active ?? true) });
      toast.success("Status user diperbarui");
      load();
    } catch (e) {
      toast.error(apiError(e));
    }
  };

  const remove = async (user) => {
    if (!window.confirm(`Hapus user ${user.email}?`)) return;
    try {
      await api.delete(`/auth/users/${user.id}`);
      toast.success("User dihapus");
      load();
    } catch (e) {
      toast.error(apiError(e));
    }
  };

  return (
    <div data-testid="admin-users-page">
      <PageHeader title="Users & Roles" description="Kelola akses tim dengan izin granular per modul." />

      <Card className="mb-6 p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#d92d20]">Tambah User</p>
        <form onSubmit={create} className="mt-6 grid gap-5 lg:grid-cols-4">
          <Field label="Nama" required>
            <input className={inputClass} required value={form.name} data-testid="user-name-input"
                   onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </Field>
          <Field label="Email" required>
            <input type="email" className={inputClass} required value={form.email} data-testid="user-email-input"
                   onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          </Field>
          <Field label="Password" required hint="Minimal 8 karakter">
            <input type="password" className={inputClass} required value={form.password}
                   data-testid="user-password-input"
                   onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
          </Field>
          <Field label="Role">
            <select className={inputClass} value={form.role} data-testid="user-role-select"
                    onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
              {ROLES.map((r) => (
                <option key={r} value={r}>{r.replace(/_/g, " ")}</option>
              ))}
            </select>
          </Field>
          <div className="lg:col-span-4">
            <AdminButton type="submit" disabled={creating} data-testid="user-create-submit">
              <Plus className="h-3.5 w-3.5" /> {creating ? "Membuat…" : "Buat User"}
            </AdminButton>
          </div>
        </form>
      </Card>

      <Card className="mb-6 overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-[11px] uppercase tracking-[0.14em] text-white/40">
              <th className="px-4 py-4">Nama</th>
              <th className="px-4 py-4">Email</th>
              <th className="px-4 py-4">Role</th>
              <th className="px-4 py-4">Status</th>
              <th className="px-4 py-4">Login Terakhir</th>
              <th className="px-4 py-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-5 py-14 text-center text-white/40">Memuat…</td></tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="border-b border-white/5" data-testid={`user-row-${u.id}`}>
                  <td className="px-4 py-4 text-white">{u.name}</td>
                  <td className="px-4 py-4 text-white/70">{u.email}</td>
                  <td className="px-4 py-4">
                    <select value={u.role} onChange={(e) => changeRole(u, e.target.value)}
                            data-testid={`user-role-${u.id}`}
                            className="border border-white/15 bg-[#0d0d0d] px-2 py-1.5 text-xs text-white">
                      {ROLES.map((r) => (
                        <option key={r} value={r}>{r.replace(/_/g, " ")}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-4">
                    <StatusBadge status={(u.is_active ?? true) ? "published" : "archived"} />
                  </td>
                  <td className="px-4 py-4 text-white/50">
                    {u.last_login ? formatDateTime(u.last_login) : "—"}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex justify-end gap-2">
                      <AdminButton variant="ghost" onClick={() => toggleActive(u)}
                                   data-testid={`user-toggle-${u.id}`}>
                        {(u.is_active ?? true) ? "Nonaktifkan" : "Aktifkan"}
                      </AdminButton>
                      <AdminButton variant="danger" onClick={() => remove(u)}
                                   data-testid={`user-delete-${u.id}`}>
                        <Trash2 className="h-3 w-3" />
                      </AdminButton>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>

      <Card className="p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">Matriks Peran</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {ROLES.map((r) => (
            <div key={r} className="border border-white/10 p-4">
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-white">
                {r.replace(/_/g, " ")}
              </p>
              <p className="mt-2 text-sm text-white/55">{ROLE_DESCRIPTIONS[r]}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
