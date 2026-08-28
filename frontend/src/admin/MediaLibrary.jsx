import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Upload, Copy, Trash2 } from "lucide-react";
import { api, apiError, API } from "@/lib/api";
import { AdminButton, Card, PageHeader, inputClass } from "./ui";

export default function MediaLibrary() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [q, setQ] = useState("");
  const fileRef = useRef();

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/admin/resources/media?limit=100${q ? `&q=${encodeURIComponent(q)}` : ""}`);
      setItems(data.items.filter((m) => !m.is_deleted));
    } catch (e) {
      toast.error(apiError(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const upload = async (files) => {
    if (!files?.length) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      const body = new FormData();
      body.append("file", file);
      try {
        await api.post("/admin/media/upload", body, { headers: { "Content-Type": "multipart/form-data" } });
        toast.success(`${file.name} berhasil diunggah`);
      } catch (e) {
        toast.error(`${file.name}: ${apiError(e)}`);
      }
    }
    setUploading(false);
    load();
  };

  const fileUrl = (m) => `${API}/files/${m.storage_path}`;

  const copyUrl = async (m) => {
    await navigator.clipboard.writeText(fileUrl(m));
    toast.success("URL disalin ke clipboard");
  };

  const saveMeta = async (m, patch) => {
    try {
      await api.put(`/admin/resources/media/${m.id}`, patch);
      toast.success("Metadata tersimpan");
      load();
    } catch (e) {
      toast.error(apiError(e));
    }
  };

  const remove = async (m) => {
    if (!window.confirm("Hapus file ini dari media library?")) return;
    try {
      await api.delete(`/admin/resources/media/${m.id}`);
      toast.success("File dihapus");
      load();
    } catch (e) {
      toast.error(apiError(e));
    }
  };

  return (
    <div data-testid="admin-media-page">
      <PageHeader title="Media Library" description="Unggah gambar, brosur PDF, dan video pendek."
                  actions={
                    <>
                      <input ref={fileRef} type="file" multiple hidden data-testid="media-file-input"
                             accept=".jpg,.jpeg,.png,.webp,.avif,.gif,.pdf,.mp4"
                             onChange={(e) => upload(e.target.files)} />
                      <AdminButton disabled={uploading} onClick={() => fileRef.current?.click()}
                                   data-testid="media-upload-button">
                        <Upload className="h-3.5 w-3.5" /> {uploading ? "Mengunggah…" : "Unggah File"}
                      </AdminButton>
                    </>
                  } />

      <Card className="mb-6 p-4">
        <form onSubmit={(e) => { e.preventDefault(); load(); }}>
          <input value={q} onChange={(e) => setQ(e.target.value)} data-testid="media-search"
                 placeholder="Cari nama file / alt text" className={inputClass} />
        </form>
      </Card>

      {loading ? (
        <p className="text-white/40">Memuat media…</p>
      ) : items.length === 0 ? (
        <Card className="p-12 text-center text-sm text-white/40" data-testid="media-empty">
          Belum ada file. Unggah gambar atau brosur untuk mulai membangun katalog Anda.
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((m) => (
            <Card key={m.id} className="overflow-hidden" data-testid={`media-item-${m.id}`}>
              <div className="flex h-40 items-center justify-center bg-[#0d0d0d]">
                {m.kind === "image" ? (
                  <img src={fileUrl(m)} alt={m.alt_text || m.original_filename} loading="lazy"
                       className="h-full w-full object-contain p-2" />
                ) : (
                  <span className="text-xs uppercase tracking-[0.16em] text-white/40">{m.kind}</span>
                )}
              </div>
              <div className="space-y-3 p-4">
                <p className="truncate text-sm text-white" title={m.original_filename}>
                  {m.original_filename}
                </p>
                <p className="text-xs text-white/35">{Math.round((m.size || 0) / 1024)} KB</p>
                <input defaultValue={m.alt_text} placeholder="Alt text"
                       data-testid={`media-alt-${m.id}`}
                       onBlur={(e) => e.target.value !== m.alt_text && saveMeta(m, { alt_text: e.target.value })}
                       className={inputClass} />
                <input defaultValue={m.caption} placeholder="Caption"
                       data-testid={`media-caption-${m.id}`}
                       onBlur={(e) => e.target.value !== m.caption && saveMeta(m, { caption: e.target.value })}
                       className={inputClass} />
                <div className="flex gap-2">
                  <AdminButton variant="ghost" className="flex-1" onClick={() => copyUrl(m)}
                               data-testid={`media-copy-${m.id}`}>
                    <Copy className="h-3 w-3" /> URL
                  </AdminButton>
                  <AdminButton variant="danger" onClick={() => remove(m)}
                               data-testid={`media-delete-${m.id}`}>
                    <Trash2 className="h-3 w-3" />
                  </AdminButton>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
