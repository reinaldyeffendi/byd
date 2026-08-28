import { Link } from "react-router-dom";
import { formatDate } from "@/lib/format";

export const ArticleCard = ({ article }) => (
  <article
    data-testid={`article-card-${article.slug}`}
    className="group flex flex-col border border-white/10 bg-[#111111] transition-colors duration-300 hover:border-white/25"
  >
    <Link to={`/articles/${article.slug}`} className="overflow-hidden">
      {article.featured_image ? (
        <img
          src={article.featured_image}
          alt={article.title}
          loading="lazy"
          className="aspect-[16/10] w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="aspect-[16/10] w-full bg-[#1c1c1c]" />
      )}
    </Link>
    <div className="flex flex-1 flex-col p-6">
      <p className="overline">{article.category}</p>
      <h3 className="mt-2 text-lg font-semibold leading-snug text-white">{article.title}</h3>
      <p className="mt-3 line-clamp-3 text-sm text-white/55">{article.excerpt}</p>
      <div className="mt-auto flex items-center justify-between pt-6 text-xs text-white/40">
        <span>{formatDate(article.published_at || article.created_at)}</span>
        <Link
          to={`/articles/${article.slug}`}
          data-testid={`article-read-${article.slug}`}
          className="font-semibold uppercase tracking-[0.16em] text-[#d92d20]"
        >
          Baca
        </Link>
      </div>
    </div>
  </article>
);

export default ArticleCard;
