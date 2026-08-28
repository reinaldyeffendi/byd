import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "@/lib/api";
import Seo from "@/components/site/Seo";
import ArticleCard from "@/components/site/ArticleCard";
import SectionHeader, { EmptyState } from "@/components/site/SectionHeader";
import { formatDate } from "@/lib/format";
import { track } from "@/lib/tracking";

export default function ArticleDetail() {
  const { slug } = useParams();
  const [article, setArticle] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    api
      .get(`/public/articles/${slug}`)
      .then((r) => {
        setArticle(r.data);
        track("article_view", { article_slug: slug });
      })
      .catch(() => setError(true));
  }, [slug]);

  if (error)
    return (
      <div className="container-byd py-40">
        <EmptyState title="Artikel tidak ditemukan"
                    action={<Link to="/articles" className="btn-primary-byd mt-4">Semua Artikel</Link>} />
      </div>
    );
  if (!article) return <div className="container-byd py-40 text-white/40">Memuat…</div>;

  return (
    <>
      <Seo title={article.seo?.title || article.title}
           description={article.seo?.description || article.excerpt}
           image={article.seo?.og_image || article.featured_image}
           jsonLd={{
             "@context": "https://schema.org",
             "@type": "Article",
             headline: article.title,
             image: article.featured_image,
             datePublished: article.published_at,
             author: { "@type": "Person", name: article.author },
           }} />

      <article className="container-byd pt-28">
        <p className="overline">{article.category}</p>
        <h1 className="mt-4 max-w-4xl text-4xl font-extrabold tracking-tighter text-white sm:text-5xl"
            data-testid="article-title">
          {article.title}
        </h1>
        <p className="mt-5 text-sm text-white/45">
          {article.author} · {formatDate(article.published_at || article.created_at)}
        </p>
        {article.featured_image && (
          <img src={article.featured_image} alt={article.title}
               className="mt-12 aspect-[16/8] w-full object-cover" />
        )}
        <div className="prose-byd mt-14 max-w-3xl" data-testid="article-content"
             dangerouslySetInnerHTML={{ __html: article.content || "" }} />
        {article.tags?.length > 0 && (
          <div className="mt-12 flex flex-wrap gap-2">
            {article.tags.map((t) => (
              <span key={t} className="border border-white/15 px-3 py-1.5 text-xs text-white/55">#{t}</span>
            ))}
          </div>
        )}
      </article>

      {article.related?.length > 0 && (
        <section className="container-byd py-24">
          <SectionHeader overline="Lanjutkan" title="Artikel terkait" />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {article.related.map((a) => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
