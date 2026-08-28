import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CalendarDays, Clock, MapPin, MessageCircle } from "lucide-react";
import { api } from "@/lib/api";
import Seo from "@/components/site/Seo";
import LeadForm from "@/components/site/LeadForm";
import { EmptyState } from "@/components/site/SectionHeader";
import { useSite } from "@/context/SiteContext";
import { formatDate } from "@/lib/format";
import { whatsappLink } from "@/lib/tracking";

export default function EventDetail() {
  const { slug } = useParams();
  const { settings } = useSite();
  const [event, setEvent] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    api.get(`/public/events/${slug}`).then((r) => setEvent(r.data)).catch(() => setError(true));
  }, [slug]);

  if (error)
    return (
      <div className="container-byd py-40">
        <EmptyState title="Event tidak ditemukan"
                    action={<Link to="/events" className="btn-primary-byd mt-4">Semua Event</Link>} />
      </div>
    );
  if (!event) return <div className="container-byd py-40 text-white/40">Memuat…</div>;

  return (
    <>
      <Seo title={`${event.title} — ${settings?.dealer_name}`} description={event.description?.slice(0, 160)}
           image={event.banner} />
      <section className="container-byd pt-28">
        <p className="overline">{event.event_status || event.status}</p>
        <h1 className="mt-4 max-w-4xl text-4xl font-extrabold tracking-tighter text-white sm:text-5xl"
            data-testid="event-title">
          {event.title}
        </h1>
        <div className="mt-8 flex flex-wrap gap-x-10 gap-y-4 border-y border-white/10 py-6 text-sm text-white/70">
          <p className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-[#d92d20]" /> {formatDate(event.event_date)}</p>
          {event.event_time && <p className="flex items-center gap-2"><Clock className="h-4 w-4 text-[#d92d20]" /> {event.event_time}</p>}
          {event.location && <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-[#d92d20]" /> {event.location}</p>}
        </div>
      </section>

      {event.banner && (
        <section className="container-byd pt-12">
          <img src={event.banner} alt={event.title} className="aspect-[16/7] w-full object-cover" />
        </section>
      )}

      <section className="container-byd grid gap-12 py-16 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <div className="prose-byd" dangerouslySetInnerHTML={{ __html: event.description || "" }} />
          {event.gallery?.length > 0 && (
            <div className="mt-12 grid gap-4 sm:grid-cols-3">
              {event.gallery.map((g, i) => (
                <img key={i} src={g.url || g} alt="" loading="lazy" className="aspect-square w-full object-cover" />
              ))}
            </div>
          )}
          {event.map_url && (
            <a href={event.map_url} target="_blank" rel="noreferrer" className="btn-ghost-byd mt-10"
               data-testid="event-map-link">
              Lihat Lokasi di Peta
            </a>
          )}
          <a href={whatsappLink(settings, "general", {}, `Saya ingin bertanya tentang event: ${event.title}`)}
             target="_blank" rel="noreferrer" data-testid="event-whatsapp-cta" className="btn-primary-byd mt-4 ml-0 sm:ml-4">
            <MessageCircle className="h-4 w-4" /> Tanya Event Ini
          </a>
        </div>
        <div className="lg:col-span-5">
          <LeadForm source={`event:${event.slug}`} title="Daftar Event" compact
                    subtitle="Tinggalkan kontak Anda, kami akan mengirimkan detail pendaftaran."
                    testId="event-lead-form" />
        </div>
      </section>
    </>
  );
}
