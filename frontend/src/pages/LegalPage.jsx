import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Seo from "@/components/site/Seo";
import { EmptyState } from "@/components/site/SectionHeader";
import { formatDate } from "@/lib/format";

export default function LegalPage({ slug }) {
  const [page, setPage] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    setPage(null);
    setError(false);
    api.get(`/public/pages/${slug}`).then((r) => setPage(r.data)).catch(() => setError(true));
  }, [slug]);

  if (error)
    return (
      <div className="container-byd py-40">
        <EmptyState title="Halaman belum tersedia"
                    description="Konten halaman ini dapat diisi melalui dashboard admin." />
      </div>
    );
  if (!page) return <div className="container-byd py-40 text-white/40">Memuat…</div>;

  return (
    <>
      <Seo title={page.title} description={`${page.title} — informasi legal.`} />
      <article className="container-byd max-w-3xl pb-28 pt-28">
        <h1 className="text-4xl font-extrabold tracking-tighter text-white sm:text-5xl" data-testid="legal-title">
          {page.title}
        </h1>
        <p className="mt-4 text-xs text-white/40">
          Terakhir diperbarui: {formatDate(page.updated_at)}
        </p>
        <div className="prose-byd mt-12" data-testid="legal-content"
             dangerouslySetInnerHTML={{ __html: page.content || "" }} />
      </article>
    </>
  );
}
