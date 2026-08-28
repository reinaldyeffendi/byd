import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Eye, Save, Plus, Trash2 } from "lucide-react";
import { api, apiError } from "@/lib/api";
import { SCHEMAS } from "./schemas";
import { AdminButton, Card, Field, PageHeader, inputClass } from "./ui";

const getPath = (obj, path) =>
  path.split(".").reduce((acc, key) => (acc === undefined || acc === null ? undefined : acc[key]), obj);

const setPath = (obj, path, value) => {
  const keys = path.split(".");
  const next = { ...obj };
  let cursor = next;
  keys.forEach((key, i) => {
    if (i === keys.length - 1) cursor[key] = value;
    else {
      cursor[key] = { ...(cursor[key] || {}) };
      cursor = cursor[key];
    }
  });
  return next;
};

export default function ResourceEditor({ resource }) {
  const schema = SCHEMAS[resource];
  const { id } = useParams();
  const isNew = id === "new";
  const navigate = useNavigate();
  const [form, setForm] = useState({ status: "draft" });
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isNew) return;
    api
      .get(`/admin/resources/${resource}/${id}`)
      .then((r) => setForm(r.data))
      .catch((e) => toast.error(apiError(e)))
      .finally(() => setLoading(false));
  }, [resource, id, isNew]);

  const update = (path, value) => setForm((f) => setPath(f, path, value));

  const validate = () => {
    const err = {};
    schema.groups.forEach((g) =>
      g.fields.forEach((f) => {
        if (f.required && !String(getPath(form, f.key) ?? "").trim()) err[f.key] = "Wajib diisi";
      })
    );
    setErrors(err);
    if (Object.keys(err).length) toast.error("Lengkapi field yang wajib diisi");
    return Object.keys(err).length === 0;
  };

  const save = async (statusOverride) => {
    if (!validate()) return;
    if (statusOverride === "published" && !window.confirm("Publikasikan konten ini ke website publik?"))
      return;
    setSaving(true);
    const payload = statusOverride ? { ...form, status: statusOverride } : form;
    try {
      if (isNew) {
        const { data } = await api.post(`/admin/resources/${resource}`, payload);
        toast.success("Data berhasil dibuat");
        navigate(`/admin/${resource}/${data.id}`, { replace: true });
      } else {
        const { data } = await api.put(`/admin/resources/${resource}/${id}`, payload);
        setForm(data);
        toast.success("Perubahan tersimpan");
      }
    } catch (e) {
      toast.error(apiError(e));
    } finally {
      setSaving(false);
    }
  };

  const previewUrl = () => {
    const map = { vehicles: "models", promotions: "promotions", articles: "articles", events: "events" };
    const seg = map[resource];
    return seg && form.slug ? `/${seg}/${form.slug}` : null;
  };

  if (loading) return <p className="text-white/40" data-testid="editor-loading">Memuat data…</p>;

  const renderField = (f) => {
    const value = getPath(form, f.key);
    const testId = `field-${f.key.replace(/\./g, "-")}`;

    if (f.type === "textarea" || f.type === "richtext")
      return (
        <textarea rows={f.type === "richtext" ? 12 : 3} data-testid={testId}
                  className={`${inputClass} font-mono`} value={value || ""}
                  onChange={(e) => update(f.key, e.target.value)} />
      );

    if (f.type === "select")
      return (
        <select data-testid={testId} className={inputClass} value={value || ""}
                onChange={(e) => update(f.key, e.target.value)}>
          <option value="">Pilih…</option>
          {f.options.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      );

    if (f.type === "checkbox")
      return (
        <label className="flex items-center gap-3 text-sm text-white/70">
          <input type="checkbox" data-testid={testId} checked={Boolean(value)}
                 onChange={(e) => update(f.key, e.target.checked)}
                 className="h-4 w-4 accent-[#d92d20]" />
          Aktif
        </label>
      );

    if (f.type === "number")
      return (
        <input type="number" data-testid={testId} className={inputClass}
               value={value ?? ""}
               onChange={(e) => update(f.key, e.target.value === "" ? null : Number(e.target.value))} />
      );

    if (f.type === "date")
      return (
        <input type="date" data-testid={testId} className={inputClass}
               value={(value || "").slice(0, 10)}
               onChange={(e) => update(f.key, e.target.value)} />
      );

    if (f.type === "list") {
      const list = Array.isArray(value) ? value : [];
      return (
        <div data-testid={testId} className="space-y-2">
          {list.map((item, i) => (
            <div key={i} className="flex gap-2">
              <input className={inputClass} value={item}
                     data-testid={`${testId}-item-${i}`}
                     onChange={(e) => {
                       const next = [...list];
                       next[i] = e.target.value;
                       update(f.key, next);
                     }} />
              <button type="button" onClick={() => update(f.key, list.filter((_, x) => x !== i))}
                      data-testid={`${testId}-remove-${i}`}
                      className="border border-red-500/30 px-3 text-red-300">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          <AdminButton type="button" variant="ghost" data-testid={`${testId}-add`}
                       onClick={() => update(f.key, [...list, ""])}>
            <Plus className="h-3 w-3" /> Tambah item
          </AdminButton>
        </div>
      );
    }

    if (f.type === "objectlist") {
      const list = Array.isArray(value) ? value : [];
      return (
        <div data-testid={testId} className="space-y-4">
          {list.map((item, i) => (
            <div key={i} className="border border-white/10 p-4">
              <div className="grid gap-3 sm:grid-cols-3">
                {f.itemFields.map((sub) => (
                  <div key={sub.key}>
                    <p className="mb-1 text-[10px] uppercase tracking-[0.14em] text-white/40">{sub.label}</p>
                    <input className={inputClass} data-testid={`${testId}-${i}-${sub.key}`}
                           type={sub.type === "number" ? "number" : "text"}
                           value={item?.[sub.key] ?? ""}
                           onChange={(e) => {
                             const next = [...list];
                             next[i] = {
                               ...next[i],
                               [sub.key]: sub.type === "number"
                                 ? (e.target.value === "" ? null : Number(e.target.value))
                                 : e.target.value,
                             };
                             update(f.key, next);
                           }} />
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => update(f.key, list.filter((_, x) => x !== i))}
                      data-testid={`${testId}-remove-${i}`}
                      className="mt-3 text-xs text-red-300 hover:underline">
                Hapus baris
              </button>
            </div>
          ))}
          <AdminButton type="button" variant="ghost" data-testid={`${testId}-add`}
                       onClick={() => update(f.key, [...list, {}])}>
            <Plus className="h-3 w-3" /> Tambah baris
          </AdminButton>
        </div>
      );
    }

    return (
      <>
        <input data-testid={testId} className={inputClass} value={value ?? ""}
               onChange={(e) => update(f.key, e.target.value)} />
        {f.type === "image" && value && (
          <img src={value} alt="" className="mt-3 h-24 w-40 border border-white/10 object-contain" />
        )}
      </>
    );
  };

  return (
    <div data-testid={`admin-${resource}-editor`}>
      <PageHeader
        title={isNew ? `Tambah ${schema.singular}` : `Edit ${schema.singular}`}
        description={form.name || form.title || ""}
        actions={
          <>
            <Link to={`/admin/${resource}`}>
              <AdminButton variant="ghost" as="span">
                <ArrowLeft className="h-3.5 w-3.5" /> Kembali
              </AdminButton>
            </Link>
            {previewUrl() && (
              <a href={previewUrl()} target="_blank" rel="noreferrer" data-testid="editor-preview">
                <AdminButton variant="ghost" as="span">
                  <Eye className="h-3.5 w-3.5" /> Preview
                </AdminButton>
              </a>
            )}
            <AdminButton variant="ghost" disabled={saving} onClick={() => save("draft")}
                         data-testid="editor-save-draft">
              Simpan Draft
            </AdminButton>
            <AdminButton disabled={saving} onClick={() => save()} data-testid="editor-save">
              <Save className="h-3.5 w-3.5" /> {saving ? "Menyimpan…" : "Simpan"}
            </AdminButton>
            <AdminButton disabled={saving} onClick={() => save("published")} data-testid="editor-publish">
              Publish
            </AdminButton>
          </>
        }
      />

      <div className="space-y-6">
        {schema.groups.map((group) => (
          <Card key={group.title} className="p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#d92d20]">
              {group.title}
            </p>
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              {group.fields.map((f) => (
                <div key={f.key}
                     className={["textarea", "richtext", "list", "objectlist"].includes(f.type) ? "lg:col-span-2" : ""}>
                  <Field label={f.label} hint={f.hint} required={f.required}>
                    {renderField(f)}
                  </Field>
                  {errors[f.key] && <p className="mt-2 text-xs text-red-300">{errors[f.key]}</p>}
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
