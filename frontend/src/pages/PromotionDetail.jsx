import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { api } from "@/lib/api";
import Seo from "@/components/site/Seo";
import LeadForm from "@/components/site/LeadForm";
import VehicleCard from "@/components/site/VehicleCard";
import SectionHeader, { EmptyState } from "@/components/site/SectionHeader";
import { useSite } from "@/context/SiteContext";
import { formatDate, formatIDR } from "@/lib/format";
import { whatsappLink, track } from "@/lib/tracking";

export default function PromotionDetail() {
  const { slug } = useParams();
  const { settings } = useSite();
  const [promo, setPromo] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    api
      .get(`/public/promotions/${slug}`)
      .then((r) => {
        setPromo(r.data);
        track("promotion_view", { promotion_slug: slug });
      })
      .catch(() => setError(true));
  }, [slug]);

  if (error)
    return (
      <div className="container-byd py-40">
        <EmptyState title="Promo tidak ditemukan"
                    action={<Link to="/promotions" className="btn-primary-byd mt-4">Lihat Semua Promo</Link>} />
      </div>
    );
  if (!promo) return <div className="container-byd py-40 text-white/40">Memuat…</div>;

  return (
    <>
      <Seo title={promo.seo?.title || `${promo.title} — ${settings?.dealer_name}`}
           description={promo.seo?.description || promo.short_description}
           image={promo.hero_image} />

      <section className="container-byd pt-28">
        <p className="overline">Promo · {promo.state === "active" ? "Sedang Berjalan" : promo.state}</p>
        <h1 className="mt-4 max-w-4xl text-4xl font-extrabold tracking-tighter text-white sm:text-5xl"
            data-testid="promotion-title">
          {promo.title}
        </h1>
        <p className="mt-5 max-w-2xl text-base text-white/60">{promo.short_description}</p>
        <div className="mt-8 flex flex-wrap gap-x-10 gap-y-4 border-y border-white/10 py-6 text-sm">
          <div>
            <p className="overline">Periode</p>
            <p className="mt-2 text-white">
              {formatDate(promo.start_date)} — {formatDate(promo.end_date)}
            </p>
          </div>
          {promo.promo_price && (
            <div>
              <p className="overline">Harga Promo</p>
              <p className="mt-2 text-white">{formatIDR(promo.promo_price)}</p>
            </div>
          )}
          {promo.dp && (
            <div>
              <p className="overline">DP Mulai</p>
              <p className="mt-2 text-white">{formatIDR(promo.dp)}</p>
            </div>
          )}
          {promo.installment && (
            <div>
              <p className="overline">Cicilan Mulai</p>
              <p className="mt-2 text-white">{formatIDR(promo.installment)}</p>
            </div>
          )}
        </div>
      </section>

      {promo.hero_image && (
        <section className="container-byd pt-12">
          <img src={promo.hero_image} alt={promo.title} className="aspect-[16/7] w-full object-cover" />
        </section>
      )}

      <section className="container-byd grid gap-12 py-16 lg:grid-cols-12">
        <div className="lg:col-span-7">
          {promo.description ? (
            <div className="prose-byd" dangerouslySetInnerHTML={{ __html: promo.description }} />
          ) : (
            <p className="text-white/50">Detail lengkap promo tersedia melalui sales consultant kami.</p>
          )}
          {promo.bonus && (
            <div className="mt-10 border border-white/10 bg-[#111111] p-6">
              <p className="overline">Bonus</p>
              <p className="mt-3 text-sm text-white/70">{promo.bonus}</p>
            </div>
          )}
          {promo.terms && (
            <div className="mt-6 border border-white/10 bg-[#111111] p-6">
              <p className="overline">Syarat & Ketentuan</p>
              <p className="mt-3 whitespace-pre-line text-sm text-white/60">{promo.terms}</p>
            </div>
          )}
          <a href={whatsappLink(settings, "promotion", { promotion: promo.title })} target="_blank" rel="noreferrer"
             onClick={() => track("promotion_cta", { promotion_slug: promo.slug })}
             data-testid="promotion-whatsapp-cta" className="btn-primary-byd mt-10">
            <MessageCircle className="h-4 w-4" /> {promo.cta_label || "Tanya Promo Ini"}
          </a>
        </div>
        <div className="lg:col-span-5">
          <LeadForm promotionSlug={promo.slug} source={`promotion:${promo.slug}`}
                    vehicles={promo.vehicles} title="Ambil Promo Ini" testId="promotion-lead-form" />
        </div>
      </section>

      {promo.vehicles?.length > 0 && (
        <section className="container-byd pb-28">
          <SectionHeader overline="Model Terkait" title="Berlaku untuk model ini" />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {promo.vehicles.map((v, i) => (
              <VehicleCard key={v.id} vehicle={v} index={i} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
