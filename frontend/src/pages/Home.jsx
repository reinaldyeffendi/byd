import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Instagram, MapPin, Quote, ShieldCheck, Zap, BatteryCharging, Cpu } from "lucide-react";
import { useSite } from "@/context/SiteContext";
import { api } from "@/lib/api";
import Seo from "@/components/site/Seo";
import VehicleCard from "@/components/site/VehicleCard";
import PromotionCard from "@/components/site/PromotionCard";
import ArticleCard from "@/components/site/ArticleCard";
import LeadForm from "@/components/site/LeadForm";
import TestDriveForm from "@/components/site/TestDriveForm";
import FinancingCalculator from "@/components/site/FinancingCalculator";
import SectionHeader, { EmptyState, SkeletonGrid } from "@/components/site/SectionHeader";
import { getViewedVehicles, whatsappLink, track } from "@/lib/tracking";
import { formatIDR } from "@/lib/format";

const ICONS = [ShieldCheck, BatteryCharging, Cpu, Zap];

export default function Home() {
  const { settings, homepage } = useSite();
  const sections = homepage?.sections || {};
  const [data, setData] = useState({ vehicles: [], promotions: [], articles: [], testimonials: [], recommended: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const viewed = getViewedVehicles().map((v) => v.slug).join(",");
    Promise.all([
      api.get("/public/vehicles?limit=8"),
      api.get("/public/promotions?limit=3"),
      api.get("/public/articles?limit=3"),
      api.get("/public/testimonials?limit=6"),
      api.get(`/public/recommendations?viewed=${viewed}&limit=3`),
    ])
      .then(([v, p, a, t, r]) =>
        setData({
          vehicles: v.data,
          promotions: p.data,
          articles: a.data,
          testimonials: t.data,
          recommended: r.data,
        })
      )
      .finally(() => setLoading(false));
  }, []);

  const hero = sections.hero || {};
  const featured = data.vehicles.find((v) => v.slug === hero.featured_vehicle_slug) || data.vehicles[0];
  const viewedSlugs = getViewedVehicles().map((v) => v.slug);
  const revisit = data.vehicles.find((v) => viewedSlugs.includes(v.slug));

  return (
    <>
      <Seo
        title={settings?.seo?.site_title}
        description={settings?.seo?.site_description}
        image={hero.background_image}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "AutoDealer",
          name: settings?.dealer_name,
          address: settings?.address,
          telephone: settings?.phone,
          areaServed: settings?.country,
          employee: { "@type": "Person", name: settings?.sales_consultant },
        }}
      />

      {/* HERO */}
      <section className="grain relative isolate overflow-hidden" data-testid="hero-section">
        <div className="absolute inset-0 -z-10">
          {hero.background_video ? (
            <video src={hero.background_video} autoPlay muted loop playsInline
                   className="h-full w-full object-cover" />
          ) : (
            <img src={hero.background_image} alt="" className="h-full w-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/70 to-[#050505]/40" />
        </div>

        <div className="container-byd flex min-h-[86vh] flex-col justify-end pb-16 pt-28">
          <div className="reveal-up max-w-4xl">
            {hero.promo_badge && (
              <span className="mb-6 inline-block bg-[#d92d20] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-white">
                {hero.promo_badge}
              </span>
            )}
            <p className="overline">{hero.overline}</p>
            <h1 className="mt-5 text-5xl font-extrabold leading-[0.95] tracking-tighter text-white sm:text-6xl lg:text-7xl"
                data-testid="hero-headline">
              {hero.headline}
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-white/65 md:text-lg">
              {hero.subheadline}
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link to={hero.primary_cta?.url || "/models"} className="btn-primary-byd" data-testid="hero-primary-cta">
                {hero.primary_cta?.label || "Jelajahi Model"} <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to={hero.secondary_cta?.url || "/test-drive"} className="btn-ghost-byd" data-testid="hero-secondary-cta">
                {hero.secondary_cta?.label || "Test Drive"}
              </Link>
            </div>
          </div>

          {featured && (
            <div className="mt-16 flex flex-wrap items-center gap-x-14 gap-y-6 border-t border-white/10 pt-8">
              <div>
                <p className="overline">Model Sorotan</p>
                <Link to={`/models/${featured.slug}`} data-testid="hero-featured-vehicle"
                      className="mt-2 flex items-center gap-2 text-xl font-semibold text-white hover:text-[#d92d20]">
                  {featured.name} <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
              <div>
                <p className="overline">Mulai dari</p>
                <p className="mt-2 text-xl font-semibold text-white">{formatIDR(featured.starting_price)}</p>
              </div>
              <div>
                <p className="overline">Sales Consultant</p>
                <p className="mt-2 text-xl font-semibold text-white">{settings?.sales_consultant}</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* PERSONALIZED */}
      {revisit && (
        <section className="container-byd pt-20" data-testid="personalization-section">
          <div className="flex flex-col items-start justify-between gap-6 border border-[#d92d20]/30 bg-[#d92d20]/[0.07] p-8 sm:flex-row sm:items-center">
            <div>
              <p className="overline">Untuk Anda</p>
              <p className="mt-2 text-xl font-semibold text-white">
                Masih mempertimbangkan {revisit.name}?
              </p>
            </div>
            <Link to={`/models/${revisit.slug}`} className="btn-primary-byd" data-testid="personalization-cta">
              Lihat Detail {revisit.name}
            </Link>
          </div>
        </section>
      )}

      {/* FEATURED VEHICLES */}
      {sections.featured_vehicles?.enabled !== false && (
        <section className="container-byd py-24" data-testid="featured-vehicles-section">
          <SectionHeader
            overline="Katalog"
            title={sections.featured_vehicles?.title || "Model Unggulan"}
            subtitle={sections.featured_vehicles?.subtitle}
            action={
              <Link to="/models" className="btn-ghost-byd" data-testid="all-models-cta">
                Semua Model <ArrowRight className="h-4 w-4" />
              </Link>
            }
          />
          <div className="mt-14">
            {loading ? (
              <SkeletonGrid count={3} />
            ) : data.vehicles.length === 0 ? (
              <EmptyState title="Belum ada model dipublikasikan"
                          description="Tambahkan kendaraan melalui dashboard admin." />
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {data.vehicles.slice(0, 6).map((v, i) => (
                  <VehicleCard key={v.id} vehicle={v} index={i} />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* PROMOTIONS */}
      {sections.promotions?.enabled !== false && (
        <section className="container-byd py-24" data-testid="promotions-section">
          <SectionHeader overline="Penawaran" title={sections.promotions?.title || "Promo Terbaru"}
                         subtitle={sections.promotions?.subtitle}
                         action={<Link to="/promotions" className="btn-ghost-byd">Semua Promo</Link>} />
          <div className="mt-14">
            {loading ? (
              <SkeletonGrid count={3} />
            ) : data.promotions.length === 0 ? (
              <EmptyState testId="promotions-empty" title="Belum ada promo aktif"
                          description="Hubungi sales consultant untuk penawaran terbaru yang sedang berjalan."
                          action={
                            <a href={whatsappLink(settings, "general")} target="_blank" rel="noreferrer"
                               className="btn-primary-byd mt-4" data-testid="promotions-empty-cta">
                              Tanya Promo via WhatsApp
                            </a>
                          } />
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {data.promotions.map((p) => (
                  <PromotionCard key={p.id} promotion={p} />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* WHY BYD */}
      {sections.why_byd?.enabled !== false && (
        <section className="border-y border-white/10 bg-[#0a0a0a] py-24" data-testid="why-byd-section">
          <div className="container-byd">
            <SectionHeader overline="Keunggulan" title={sections.why_byd?.title || "Mengapa BYD"} />
            <div className="mt-14 grid gap-px border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
              {(sections.why_byd?.items || []).map((item, i) => {
                const Icon = ICONS[i % ICONS.length];
                return (
                  <div key={item.title} className="bg-[#0a0a0a] p-8 transition-colors duration-300 hover:bg-[#111111]">
                    <Icon className="h-6 w-6 text-[#d92d20]" />
                    <p className="mt-6 text-lg font-semibold text-white">{item.title}</p>
                    <p className="mt-3 text-sm leading-relaxed text-white/55">{item.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* EV TECH */}
      {sections.ev_tech?.enabled !== false && (
        <section className="container-byd py-24" data-testid="ev-tech-section">
          <div className="grid items-center gap-12 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <img src={sections.ev_tech?.image} alt="Teknologi EV BYD" loading="lazy"
                   className="aspect-[16/10] w-full object-cover" />
            </div>
            <div className="lg:col-span-5">
              <p className="overline">Teknologi</p>
              <h2 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
                {sections.ev_tech?.title}
              </h2>
              <p className="mt-5 text-base leading-relaxed text-white/60">{sections.ev_tech?.subtitle}</p>
              <Link to="/articles" className="btn-ghost-byd mt-8" data-testid="ev-tech-cta">
                Pelajari Lebih Lanjut
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* COMPARISON TEASER */}
      {sections.comparison?.enabled !== false && data.vehicles.length > 1 && (
        <section className="container-byd py-24" data-testid="comparison-section">
          <SectionHeader overline="Alat Bantu" title={sections.comparison?.title || "Bandingkan Model"}
                         subtitle={sections.comparison?.subtitle} />
          <div className="mt-12 flex flex-wrap gap-4">
            {data.vehicles.slice(0, 5).map((v) => (
              <Link key={v.id} to={`/compare?models=${v.slug}`}
                    data-testid={`comparison-chip-${v.slug}`}
                    className="border border-white/15 px-5 py-3 text-sm text-white/70 transition-colors duration-300 hover:border-[#d92d20] hover:text-white">
                {v.name}
              </Link>
            ))}
            <Link to="/compare" className="btn-primary-byd" data-testid="comparison-cta">
              Buka Alat Perbandingan
            </Link>
          </div>
        </section>
      )}

      {/* FINANCING */}
      {sections.financing?.enabled !== false && (
        <section className="container-byd py-24" data-testid="financing-section">
          <SectionHeader overline="Pembiayaan" title={sections.financing?.title || "Simulasi Kredit"}
                         subtitle={sections.financing?.subtitle} />
          <div className="mt-12">
            <FinancingCalculator vehicles={data.vehicles} />
          </div>
        </section>
      )}

      {/* TEST DRIVE */}
      {sections.test_drive?.enabled !== false && (
        <section className="border-y border-white/10 bg-[#0a0a0a] py-24" data-testid="test-drive-section">
          <div className="container-byd grid items-center gap-12 lg:grid-cols-2">
            <div>
              <p className="overline">Pengalaman</p>
              <h2 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
                {sections.test_drive?.title}
              </h2>
              <p className="mt-5 max-w-lg text-base leading-relaxed text-white/60">
                {sections.test_drive?.subtitle}
              </p>
              <img src={sections.test_drive?.image} alt="Showroom" loading="lazy"
                   className="mt-10 aspect-[16/10] w-full object-cover" />
            </div>
            <TestDriveForm vehicles={data.vehicles} testId="home-test-drive-form" />
          </div>
        </section>
      )}

      {/* ARTICLES */}
      {sections.articles?.enabled !== false && (
        <section className="container-byd py-24" data-testid="articles-section">
          <SectionHeader overline="Insight" title={sections.articles?.title || "Wawasan & Artikel"}
                         subtitle={sections.articles?.subtitle}
                         action={<Link to="/articles" className="btn-ghost-byd">Semua Artikel</Link>} />
          <div className="mt-14">
            {loading ? (
              <SkeletonGrid count={3} />
            ) : data.articles.length === 0 ? (
              <EmptyState testId="articles-empty" title="Belum ada artikel" />
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {data.articles.map((a) => (
                  <ArticleCard key={a.id} article={a} />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* TESTIMONIALS */}
      {sections.testimonials?.enabled !== false && (
        <section className="container-byd py-24" data-testid="testimonials-section">
          <SectionHeader overline="Testimoni" title={sections.testimonials?.title || "Kata Pelanggan"} />
          <div className="mt-14">
            {data.testimonials.length === 0 ? (
              <EmptyState testId="testimonials-empty" title="Belum ada testimoni dipublikasikan"
                          description="Testimoni akan tampil di sini setelah admin menambahkannya melalui dashboard." />
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {data.testimonials.map((t) => (
                  <figure key={t.id} className="border border-white/10 bg-[#111111] p-8"
                          data-testid={`testimonial-${t.id}`}>
                    <Quote className="h-6 w-6 text-[#d92d20]" />
                    <blockquote className="mt-5 text-sm leading-relaxed text-white/70">{t.content}</blockquote>
                    <figcaption className="mt-6 border-t border-white/10 pt-5 text-sm text-white">
                      {t.name}
                      {t.vehicle_name && <span className="block text-xs text-white/45">{t.vehicle_name}</span>}
                    </figcaption>
                  </figure>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* DEALER + LEAD */}
      <section className="container-byd py-24" data-testid="dealer-section">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <p className="overline">Showroom</p>
            <h2 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
              {sections.dealer?.title || "Kunjungi Showroom"}
            </h2>
            <div className="mt-8 space-y-4 text-sm text-white/60">
              <p className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 text-[#d92d20]" /> {settings?.address}
              </p>
              <p>{settings?.operating_hours}</p>
              <a href={settings?.maps_url} target="_blank" rel="noreferrer"
                 data-testid="dealer-maps-link"
                 className="inline-flex items-center gap-2 text-white hover:text-[#d92d20]">
                Buka di Google Maps <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>
            <img src={sections.dealer?.image} alt="Showroom BYD BIPO" loading="lazy"
                 className="mt-10 aspect-[16/10] w-full object-cover" />
          </div>
          <LeadForm vehicles={data.vehicles} source="homepage" testId="home-lead-form" />
        </div>
      </section>

      {/* INSTAGRAM */}
      {sections.instagram?.enabled !== false && (
        <section className="container-byd pb-24" data-testid="instagram-section">
          <div className="flex flex-col items-start justify-between gap-6 border border-white/10 bg-[#111111] p-10 sm:flex-row sm:items-center">
            <div>
              <p className="overline">Sosial Media</p>
              <p className="mt-2 text-2xl font-semibold text-white">
                {sections.instagram?.title || "Ikuti Perjalanan Kami"}
              </p>
              <p className="mt-2 text-sm text-white/55">{settings?.instagram}</p>
            </div>
            <a href={settings?.instagram_url} target="_blank" rel="noreferrer"
               onClick={() => track("promotion_cta", { meta: { placement: "instagram" } })}
               data-testid="instagram-cta" className="btn-primary-byd">
              <Instagram className="h-4 w-4" /> Follow Instagram
            </a>
          </div>
        </section>
      )}
    </>
  );
}
