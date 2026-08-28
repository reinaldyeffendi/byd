import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Seo from "@/components/site/Seo";
import PromotionCard from "@/components/site/PromotionCard";
import SectionHeader, { EmptyState, SkeletonGrid } from "@/components/site/SectionHeader";
import { useSite } from "@/context/SiteContext";
import { whatsappLink } from "@/lib/tracking";

export default function Promotions() {
  const { settings } = useSite();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showExpired, setShowExpired] = useState(false);

  useEffect(() => {
    setLoading(true);
    api
      .get(`/public/promotions?include_expired=${showExpired}`)
      .then((r) => setItems(r.data))
      .finally(() => setLoading(false));
  }, [showExpired]);

  return (
    <>
      <Seo title={`Promo BYD — ${settings?.dealer_name || "BYD BIPO"}`}
           description="Program promo, diskon, DP ringan, dan bonus pembelian mobil listrik BYD yang sedang berjalan." />
      <section className="container-byd pb-10 pt-28">
        <SectionHeader overline="Penawaran" title="Promo & Program Penjualan"
                       subtitle="Semua penawaran di bawah dikelola langsung oleh sales consultant kami dan diperbarui secara berkala."
                       action={
                         <button onClick={() => setShowExpired((v) => !v)} data-testid="promotions-toggle-expired"
                                 className="btn-ghost-byd">
                           {showExpired ? "Sembunyikan Kedaluwarsa" : "Tampilkan Kedaluwarsa"}
                         </button>
                       } />
      </section>
      <section className="container-byd pb-28">
        {loading ? (
          <SkeletonGrid count={3} />
        ) : items.length === 0 ? (
          <EmptyState testId="promotions-page-empty" title="Belum ada promo aktif"
                      description="Program penawaran belum dipublikasikan. Hubungi sales consultant untuk informasi terbaru."
                      action={
                        <a href={whatsappLink(settings, "general")} target="_blank" rel="noreferrer"
                           className="btn-primary-byd mt-4" data-testid="promotions-page-empty-cta">
                          Tanya via WhatsApp
                        </a>
                      } />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((p) => (
              <PromotionCard key={p.id} promotion={p} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
