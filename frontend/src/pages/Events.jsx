import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, MapPin } from "lucide-react";
import { api } from "@/lib/api";
import Seo from "@/components/site/Seo";
import SectionHeader, { EmptyState, SkeletonGrid } from "@/components/site/SectionHeader";
import { formatDate } from "@/lib/format";

export default function Events() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/public/events").then((r) => setItems(r.data)).finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Seo title="Event & Pameran BYD" description="Jadwal pameran, test drive event, dan kegiatan BYD BIPO." />
      <section className="container-byd pb-10 pt-28">
        <SectionHeader overline="Agenda" title="Event & Pameran"
                       subtitle="Ikuti kegiatan showroom, pameran, dan program test drive kami." />
      </section>
      <section className="container-byd pb-28">
        {loading ? (
          <SkeletonGrid count={3} />
        ) : items.length === 0 ? (
          <EmptyState testId="events-empty" title="Belum ada event terjadwal"
                      description="Agenda event akan muncul di sini setelah dipublikasikan melalui dashboard admin." />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((e) => (
              <article key={e.id} data-testid={`event-card-${e.slug}`}
                       className="group flex flex-col border border-white/10 bg-[#111111]">
                <Link to={`/events/${e.slug}`} className="overflow-hidden">
                  {e.banner ? (
                    <img src={e.banner} alt={e.title} loading="lazy"
                         className="aspect-[16/9] w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="aspect-[16/9] w-full bg-[#1c1c1c]" />
                  )}
                </Link>
                <div className="flex flex-1 flex-col p-6">
                  <span className="w-fit border border-white/15 px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-white/60">
                    {e.event_status || e.status}
                  </span>
                  <h3 className="mt-4 text-lg font-semibold text-white">{e.title}</h3>
                  <p className="mt-3 flex items-center gap-2 text-sm text-white/55">
                    <CalendarDays className="h-4 w-4 text-[#d92d20]" /> {formatDate(e.event_date)}
                  </p>
                  {e.location && (
                    <p className="mt-2 flex items-center gap-2 text-sm text-white/55">
                      <MapPin className="h-4 w-4 text-[#d92d20]" /> {e.location}
                    </p>
                  )}
                  <Link to={`/events/${e.slug}`} data-testid={`event-detail-${e.slug}`}
                        className="mt-6 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#d92d20]">
                    Lihat Detail
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
