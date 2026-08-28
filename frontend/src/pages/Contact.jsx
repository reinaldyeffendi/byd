import { useEffect, useState } from "react";
import { Instagram, Mail, MapPin, MessageCircle, Phone, Clock } from "lucide-react";
import { api } from "@/lib/api";
import Seo from "@/components/site/Seo";
import LeadForm from "@/components/site/LeadForm";
import SectionHeader from "@/components/site/SectionHeader";
import { useSite } from "@/context/SiteContext";
import { whatsappLink, track } from "@/lib/tracking";

export default function Contact() {
  const { settings } = useSite();
  const [vehicles, setVehicles] = useState([]);

  useEffect(() => {
    api.get("/public/vehicles?limit=60").then((r) => setVehicles(r.data)).catch(() => {});
  }, []);

  return (
    <>
      <Seo title={`Kontak ${settings?.sales_consultant} — ${settings?.dealer_name}`}
           description={`Hubungi ${settings?.sales_consultant}, sales consultant ${settings?.dealer_name} di ${settings?.location_name}.`}
           jsonLd={{
             "@context": "https://schema.org",
             "@type": "LocalBusiness",
             name: settings?.dealer_name,
             address: settings?.address,
             telephone: settings?.phone,
             email: settings?.email,
             openingHours: settings?.operating_hours,
           }} />

      <section className="container-byd pb-10 pt-28">
        <SectionHeader overline="Kontak" title="Bicara langsung dengan sales consultant"
                       subtitle="Konsultasi produk, harga, promo, dan skema pembiayaan tanpa biaya." />
      </section>

      <section className="container-byd grid gap-12 pb-28 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <div className="border border-white/10 bg-[#111111]" data-testid="consultant-card">
            <img src={settings?.consultant_photo} alt={settings?.sales_consultant}
                 className="aspect-[4/3] w-full object-cover" />
            <div className="p-7">
              <p className="overline">{settings?.sales_title}</p>
              <p className="mt-2 text-2xl font-semibold text-white">{settings?.sales_consultant}</p>
              <p className="mt-1 text-sm text-white/50">
                {settings?.dealer_name} — {settings?.location_name}
              </p>
              <div className="mt-7 space-y-4 text-sm text-white/65">
                <a href={`tel:+${settings?.phone}`} data-testid="contact-phone"
                   className="flex items-center gap-3 hover:text-white">
                  <Phone className="h-4 w-4 text-[#d92d20]" /> +{settings?.phone}
                </a>
                <a href={`mailto:${settings?.email}`} data-testid="contact-email"
                   className="flex items-center gap-3 hover:text-white">
                  <Mail className="h-4 w-4 text-[#d92d20]" /> {settings?.email}
                </a>
                <a href={settings?.instagram_url} target="_blank" rel="noreferrer" data-testid="contact-instagram"
                   className="flex items-center gap-3 hover:text-white">
                  <Instagram className="h-4 w-4 text-[#d92d20]" /> {settings?.instagram}
                </a>
                <p className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#d92d20]" /> {settings?.address}
                </p>
                <p className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-[#d92d20]" /> {settings?.operating_hours}
                </p>
              </div>
              <a href={whatsappLink(settings, "general")} target="_blank" rel="noreferrer"
                 onClick={() => track("click_whatsapp", { meta: { placement: "contact" } })}
                 data-testid="contact-whatsapp-cta" className="btn-primary-byd mt-8 w-full">
                <MessageCircle className="h-4 w-4" /> Chat WhatsApp
              </a>
            </div>
          </div>

          <div className="mt-6 border border-white/10 bg-[#111111] p-6">
            <p className="overline">Lokasi</p>
            {settings?.maps_embed_url ? (
              <iframe src={settings.maps_embed_url} title="Lokasi showroom" loading="lazy"
                      className="mt-4 aspect-video w-full border border-white/10" />
            ) : (
              <a href={settings?.maps_url} target="_blank" rel="noreferrer"
                 data-testid="contact-maps-link" className="btn-ghost-byd mt-4 w-full">
                Buka Google Maps
              </a>
            )}
          </div>
        </div>

        <div className="lg:col-span-7">
          <LeadForm vehicles={vehicles} source="contact_page" title="Kirim Pertanyaan"
                    subtitle="Kami biasanya merespons dalam waktu kurang dari 1 jam pada jam kerja."
                    testId="contact-lead-form" />
        </div>
      </section>
    </>
  );
}
