import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Clock } from "lucide-react";
import { countdown, formatDate } from "@/lib/format";

const Countdown = ({ endDate }) => {
  const [left, setLeft] = useState(countdown(endDate));
  useEffect(() => {
    const t = setInterval(() => setLeft(countdown(endDate)), 1000);
    return () => clearInterval(t);
  }, [endDate]);
  if (!left) return null;
  return (
    <div className="flex items-center gap-2 text-xs text-white/70" data-testid="promo-countdown">
      <Clock className="h-3.5 w-3.5 text-[#d92d20]" />
      <span className="tabular-nums">
        {left.days}h {String(left.hours).padStart(2, "0")}j{" "}
        {String(left.minutes).padStart(2, "0")}m {String(left.seconds).padStart(2, "0")}s
      </span>
    </div>
  );
};

export const PromotionCard = ({ promotion }) => (
  <article
    data-testid={`promotion-card-${promotion.slug}`}
    className="group flex flex-col border border-white/10 bg-[#111111] transition-colors duration-300 hover:border-white/25"
  >
    <Link to={`/promotions/${promotion.slug}`} className="relative block overflow-hidden">
      {promotion.thumbnail || promotion.hero_image ? (
        <img
          src={promotion.thumbnail || promotion.hero_image}
          alt={promotion.title}
          loading="lazy"
          className="aspect-[16/9] w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="flex aspect-[16/9] w-full items-center justify-center bg-[#1c1c1c] text-white/30">
          Tanpa gambar
        </div>
      )}
      {promotion.state === "active" && (
        <span className="absolute left-4 top-4 bg-[#d92d20] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white">
          Aktif
        </span>
      )}
    </Link>
    <div className="flex flex-1 flex-col p-6">
      <p className="overline">{formatDate(promotion.start_date)}</p>
      <h3 className="mt-2 text-lg font-semibold text-white">{promotion.title}</h3>
      <p className="mt-3 line-clamp-2 text-sm text-white/55">{promotion.short_description}</p>
      <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-5">
        <Countdown endDate={promotion.end_date} />
        <Link
          to={`/promotions/${promotion.slug}`}
          data-testid={`promotion-detail-${promotion.slug}`}
          className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#d92d20]"
        >
          Lihat Promo
        </Link>
      </div>
    </div>
  </article>
);

export default PromotionCard;
