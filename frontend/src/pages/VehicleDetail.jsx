import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Download, GitCompareArrows, MessageCircle, CalendarClock } from "lucide-react";
import { api } from "@/lib/api";
import { useSite } from "@/context/SiteContext";
import Seo from "@/components/site/Seo";
import LeadForm from "@/components/site/LeadForm";
import PromotionCard from "@/components/site/PromotionCard";
import ArticleCard from "@/components/site/ArticleCard";
import VehicleCard from "@/components/site/VehicleCard";
import FinancingCalculator from "@/components/site/FinancingCalculator";
import SectionHeader, { EmptyState } from "@/components/site/SectionHeader";
import { formatIDR, formatNumber, NA, orNA } from "@/lib/format";
import { whatsappLink, track, recordViewedVehicle, toggleCompare } from "@/lib/tracking";

const SpecRow = ({ label, value }) => (
  <div className="flex items-start justify-between gap-6 border-b border-white/10 py-4">
    <dt className="text-sm text-white/45">{label}</dt>
    <dd className="text-right text-sm font-medium text-white">{orNA(value)}</dd>
  </div>
);

export default function VehicleDetail() {
  const { slug } = useParams();
  const { settings } = useSite();
  const [vehicle, setVehicle] = useState(null);
  const [error, setError] = useState(null);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    setVehicle(null);
    setError(null);
    api
      .get(`/public/vehicles/${slug}`)
      .then((r) => {
        setVehicle(r.data);
        setActiveImage(0);
        recordViewedVehicle(slug);
        track("vehicle_view", { vehicle_slug: slug });
      })
      .catch(() => setError("Model tidak ditemukan"));
  }, [slug]);

  if (error)
    return (
      <div className="container-byd py-40" data-testid="vehicle-not-found">
        <EmptyState title="Model tidak ditemukan"
                    description="Model yang Anda cari mungkin sudah tidak tersedia."
                    action={<Link to="/models" className="btn-primary-byd mt-4">Lihat Semua Model</Link>} />
      </div>
    );

  if (!vehicle)
    return (
      <div className="container-byd animate-pulse py-40" data-testid="vehicle-loading">
        <div className="h-8 w-48 bg-white/10" />
        <div className="mt-6 aspect-[16/9] w-full bg-white/5" />
      </div>
    );

  const images = vehicle.images?.length ? vehicle.images : [{ url: vehicle.hero_image, alt: vehicle.name }];
  const waModel = { model: vehicle.name };

  return (
    <>
      <Seo title={vehicle.seo?.title || `${vehicle.name} — ${settings?.dealer_name}`}
           description={vehicle.seo?.description || vehicle.short_description}
           image={vehicle.seo?.og_image || vehicle.hero_image}
           jsonLd={{
             "@context": "https://schema.org",
             "@type": "Product",
             name: vehicle.name,
             image: vehicle.hero_image,
             description: vehicle.short_description,
             brand: { "@type": "Brand", name: settings?.brand || "BYD" },
             ...(vehicle.starting_price
               ? { offers: { "@type": "Offer", price: vehicle.starting_price, priceCurrency: "IDR",
                             availability: "https://schema.org/InStock" } }
               : {}),
           }} />

      <nav className="container-byd pt-24 text-xs text-white/40" aria-label="Breadcrumb" data-testid="breadcrumb">
        <ol className="flex flex-wrap items-center gap-2">
          <li><Link to="/" className="hover:text-white">Home</Link></li>
          <li>/</li>
          <li><Link to="/models" className="hover:text-white">Model</Link></li>
          <li>/</li>
          <li className="text-white/70">{vehicle.name}</li>
        </ol>
      </nav>

      <section className="container-byd grid gap-12 pb-16 pt-8 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <div className="relative border border-white/10 bg-[#111111]">
            <img src={images[activeImage]?.url} alt={images[activeImage]?.alt || vehicle.name}
                 data-testid="vehicle-hero-image"
                 className="aspect-[16/10] w-full object-contain p-8" />
          </div>
          {images.length > 1 && (
            <div className="mt-4 flex gap-3 overflow-x-auto pb-2" data-testid="vehicle-gallery">
              {images.map((img, i) => (
                <button key={i} onClick={() => setActiveImage(i)}
                        data-testid={`vehicle-thumb-${i}`}
                        className={`h-20 w-28 shrink-0 border bg-[#161616] p-1 transition-colors duration-300 ${
                          i === activeImage ? "border-[#d92d20]" : "border-white/10 hover:border-white/30"
                        }`}>
                  <img src={img.url} alt="" className="h-full w-full object-contain" />
                </button>
              ))}
            </div>
          )}
          {vehicle.video_url && (
            <div className="mt-6 aspect-video w-full">
              <iframe src={vehicle.video_url} title={`Video ${vehicle.name}`} allowFullScreen
                      className="h-full w-full border border-white/10" />
            </div>
          )}
        </div>

        <div className="lg:col-span-5">
          <p className="overline">{vehicle.category} · {vehicle.powertrain}</p>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tighter text-white sm:text-5xl"
              data-testid="vehicle-name">
            {vehicle.name}
          </h1>
          {vehicle.tagline && <p className="mt-3 text-lg text-white/60">{vehicle.tagline}</p>}
          <p className="mt-6 text-sm leading-relaxed text-white/60">{vehicle.short_description}</p>

          <div className="mt-8 border border-white/10 bg-[#111111] p-6">
            <p className="overline">Harga Mulai</p>
            <p className="mt-2 text-3xl font-bold text-white" data-testid="vehicle-price">
              {formatIDR(vehicle.starting_price)}
            </p>
            {vehicle.promo_price && (
              <p className="mt-2 text-sm text-[#d92d20]">
                Harga promo: {formatIDR(vehicle.promo_price)}
              </p>
            )}
            <p className="mt-3 text-xs text-white/35">
              Terakhir diperbarui: {new Date(vehicle.updated_at).toLocaleDateString("id-ID")}
            </p>
            {vehicle.is_example_data && (
              <p data-testid="vehicle-example-note"
                 className="mt-4 border border-amber-400/40 bg-amber-400/10 p-3 text-xs leading-relaxed text-amber-200">
                {vehicle.example_note || "CONTOH — harap diganti dengan data resmi."}
              </p>
            )}
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <a href={whatsappLink(settings, "vehicle", waModel)} target="_blank" rel="noreferrer"
               onClick={() => track("click_whatsapp", { vehicle_slug: vehicle.slug })}
               data-testid="vehicle-whatsapp-cta" className="btn-primary-byd">
              <MessageCircle className="h-4 w-4" /> {settings?.cta_labels?.whatsapp || "Chat WhatsApp"}
            </a>
            <a href={whatsappLink(settings, "test_drive", waModel)} target="_blank" rel="noreferrer"
               onClick={() => track("click_test_drive", { vehicle_slug: vehicle.slug })}
               data-testid="vehicle-testdrive-cta" className="btn-ghost-byd">
              <CalendarClock className="h-4 w-4" /> Test Drive
            </a>
            <button onClick={() => toggleCompare(vehicle.slug)} data-testid="vehicle-compare-cta"
                    className="btn-ghost-byd">
              <GitCompareArrows className="h-4 w-4" /> Bandingkan
            </button>
            {vehicle.brochure_url ? (
              <a href={vehicle.brochure_url} target="_blank" rel="noreferrer"
                 onClick={() => track("brochure_download", { vehicle_slug: vehicle.slug })}
                 data-testid="vehicle-brochure-cta" className="btn-ghost-byd">
                <Download className="h-4 w-4" /> Unduh Brosur
              </a>
            ) : (
              <a href={whatsappLink(settings, "brochure", waModel)} target="_blank" rel="noreferrer"
                 data-testid="vehicle-brochure-request" className="btn-ghost-byd">
                <Download className="h-4 w-4" /> Minta Brosur
              </a>
            )}
          </div>

          {vehicle.variants?.length > 0 && (
            <div className="mt-8" data-testid="vehicle-variants">
              <p className="overline">Varian</p>
              <div className="mt-4 space-y-3">
                {vehicle.variants.map((v) => (
                  <div key={v.name} className="flex items-center justify-between border border-white/10 p-4">
                    <span className="text-sm text-white">{v.name}</span>
                    <span className="text-sm text-white/60">{formatIDR(v.price)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {vehicle.colors?.length > 0 && (
            <div className="mt-8" data-testid="vehicle-colors">
              <p className="overline">Pilihan Warna</p>
              <div className="mt-4 flex flex-wrap gap-3">
                {vehicle.colors.map((c) => (
                  <div key={c.name} className="flex items-center gap-2 border border-white/10 px-3 py-2">
                    <span className="h-4 w-4 rounded-full border border-white/20"
                          style={{ background: c.hex || "#888" }} />
                    <span className="text-xs text-white/70">{c.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="container-byd py-16" data-testid="vehicle-specs">
        <SectionHeader overline="Spesifikasi" title="Data Teknis"
                       subtitle="Informasi yang belum tersedia ditandai secara eksplisit. Hubungi sales untuk data resmi terbaru." />
        <div className="mt-12 grid gap-x-16 gap-y-0 lg:grid-cols-2">
          <dl>
            <SpecRow label="Powertrain" value={vehicle.powertrain} />
            <SpecRow label="Kapasitas Baterai" value={vehicle.battery_kwh ? `${vehicle.battery_kwh} kWh` : null} />
            <SpecRow label="Jarak Tempuh" value={vehicle.range_km ? `${formatNumber(vehicle.range_km)} km` : null} />
            <SpecRow label="Motor" value={vehicle.motor} />
            <SpecRow label="Tenaga" value={vehicle.power} />
            <SpecRow label="Torsi" value={vehicle.torque} />
            <SpecRow label="Pengisian Daya" value={vehicle.charging} />
            <SpecRow label="Akselerasi" value={vehicle.acceleration} />
          </dl>
          <dl>
            <SpecRow label="Kapasitas Tempat Duduk" value={vehicle.seating ? `${vehicle.seating} kursi` : null} />
            <SpecRow label="Panjang" value={vehicle.dimensions?.length} />
            <SpecRow label="Lebar" value={vehicle.dimensions?.width} />
            <SpecRow label="Tinggi" value={vehicle.dimensions?.height} />
            <SpecRow label="Wheelbase" value={vehicle.dimensions?.wheelbase} />
            <SpecRow label="Ground Clearance" value={vehicle.dimensions?.ground_clearance} />
            <SpecRow label="Kecepatan Maksimal" value={vehicle.top_speed} />
            <SpecRow label="Garansi" value={vehicle.warranty} />
          </dl>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Keselamatan", vehicle.features?.safety],
            ["Teknologi", vehicle.features?.technology],
            ["Interior", vehicle.features?.interior],
            ["Eksterior", vehicle.features?.exterior],
          ].map(([label, items]) => (
            <div key={label} className="border border-white/10 bg-[#111111] p-6">
              <p className="overline">{label}</p>
              {items?.length ? (
                <ul className="mt-4 space-y-2 text-sm text-white/65">
                  {items.map((i) => (
                    <li key={i} className="border-b border-white/5 pb-2">{i}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-white/35">{NA}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      {vehicle.description && (
        <section className="container-byd py-10">
          <div className="prose-byd max-w-3xl" dangerouslySetInnerHTML={{ __html: vehicle.description }} />
        </section>
      )}

      <section className="container-byd py-16">
        <FinancingCalculator defaultPrice={vehicle.starting_price || 500000000} vehicles={[vehicle]} />
      </section>

      {vehicle.promotions?.length > 0 && (
        <section className="container-byd py-16" data-testid="vehicle-promotions">
          <SectionHeader overline="Penawaran" title="Promo untuk model ini" />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {vehicle.promotions.map((p) => (
              <PromotionCard key={p.id} promotion={p} />
            ))}
          </div>
        </section>
      )}

      <section className="container-byd py-16">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <SectionHeader overline="Konsultasi" title={`Tertarik dengan ${vehicle.name}?`}
                           subtitle={`Diskusikan harga, promo, dan skema kredit langsung dengan ${settings?.sales_consultant}.`} />
            <img src={settings?.consultant_photo} alt={settings?.sales_consultant} loading="lazy"
                 className="mt-10 aspect-[4/3] w-full object-cover" />
          </div>
          <LeadForm vehicleSlug={vehicle.slug} source={`vehicle:${vehicle.slug}`}
                    title="Dapatkan Penawaran Khusus" testId="vehicle-lead-form" />
        </div>
      </section>

      {vehicle.related_vehicles?.length > 0 && (
        <section className="container-byd py-16" data-testid="related-vehicles">
          <SectionHeader overline="Rekomendasi" title="Model serupa" />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {vehicle.related_vehicles.map((v, i) => (
              <VehicleCard key={v.id} vehicle={v} index={i} />
            ))}
          </div>
        </section>
      )}

      {vehicle.related_articles?.length > 0 && (
        <section className="container-byd py-16 pb-28" data-testid="related-articles">
          <SectionHeader overline="Insight" title="Artikel terkait" />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {vehicle.related_articles.map((a) => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </div>
        </section>
      )}

      <div className="container-byd pb-24">
        <Link to="/models" className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white"
              data-testid="back-to-models">
          <ArrowLeft className="h-4 w-4" /> Kembali ke semua model
        </Link>
      </div>
    </>
  );
}
