import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Seo from "@/components/site/Seo";
import ArticleCard from "@/components/site/ArticleCard";
import SectionHeader, { EmptyState, SkeletonGrid } from "@/components/site/SectionHeader";

const CATEGORIES = ["BYD News", "EV Education", "Car Tips", "Technology", "Lifestyle", "Promotions", "Events"];

export default function Articles() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("");

  useEffect(() => {
    setLoading(true);
    api
      .get(`/public/articles${category ? `?category=${encodeURIComponent(category)}` : ""}`)
      .then((r) => setItems(r.data))
      .finally(() => setLoading(false));
  }, [category]);

  return (
    <>
      <Seo title="Artikel & Wawasan Mobil Listrik BYD"
           description="Edukasi mobil listrik, tips perawatan, teknologi BYD, dan berita terbaru." />
      <section className="container-byd pb-10 pt-28">
        <SectionHeader overline="Insight" title="Artikel & Wawasan"
                       subtitle="Panduan praktis seputar kendaraan listrik dan kepemilikan BYD." />
        <div className="mt-10 flex flex-wrap gap-2">
          <button onClick={() => setCategory("")} data-testid="article-filter-all"
                  className={`border px-4 py-2.5 text-xs transition-colors duration-300 ${
                    !category ? "border-[#d92d20] text-white" : "border-white/20 text-white/60 hover:text-white"
                  }`}>
            Semua
          </button>
          {CATEGORIES.map((c) => (
            <button key={c} onClick={() => setCategory(c)} data-testid={`article-filter-${c.replace(/\s/g, "-").toLowerCase()}`}
                    className={`border px-4 py-2.5 text-xs transition-colors duration-300 ${
                      category === c ? "border-[#d92d20] text-white" : "border-white/20 text-white/60 hover:text-white"
                    }`}>
              {c}
            </button>
          ))}
        </div>
      </section>
      <section className="container-byd pb-28">
        {loading ? (
          <SkeletonGrid count={3} />
        ) : items.length === 0 ? (
          <EmptyState testId="articles-page-empty" title="Belum ada artikel pada kategori ini" />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((a) => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
