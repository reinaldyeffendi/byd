import { Link } from "react-router-dom";
import { ArrowUpRight, GitCompareArrows, Zap } from "lucide-react";
import { formatIDR, formatNumber, NA } from "@/lib/format";
import { toggleCompare, getCompare, track } from "@/lib/tracking";

export const VehicleCard = ({ vehicle, index = 0 }) => {
  const inCompare = getCompare().includes(vehicle.slug);

  return (
    <article
      data-testid={`vehicle-card-${vehicle.slug}`}
      className="group relative flex flex-col border border-white/10 bg-[#111111] transition-colors duration-300 hover:border-white/25"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <Link to={`/models/${vehicle.slug}`} className="relative block overflow-hidden bg-[#161616]">
        <div className="absolute left-4 top-4 z-10 flex flex-col gap-2">
          {vehicle.featured && (
            <span className="bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-black">
              Unggulan
            </span>
          )}
          {vehicle.has_promotion && (
            <span className="bg-[#d92d20] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white">
              Promo
            </span>
          )}
          {vehicle.is_example_data && (
            <span data-testid={`vehicle-example-badge-${vehicle.slug}`}
                  className="border border-amber-400/60 bg-amber-400/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-amber-200">
              Contoh
            </span>
          )}
        </div>
        <img
          src={vehicle.hero_image || vehicle.images?.[0]?.url}
          alt={vehicle.name}
          loading={index < 3 ? "eager" : "lazy"}
          className="aspect-[16/10] w-full object-contain p-6 transition-transform duration-500 ease-out group-hover:scale-105"
        />
      </Link>

      <div className="flex flex-1 flex-col p-6">
        <p className="overline">{vehicle.category}</p>
        <h3 className="mt-2 text-xl font-semibold text-white">{vehicle.name}</h3>
        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-white/55">
          {vehicle.short_description || NA}
        </p>

        <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-white/10 pt-5 text-xs">
          <div>
            <dt className="text-white/40">Powertrain</dt>
            <dd className="mt-1 flex items-center gap-1.5 text-white/80">
              <Zap className="h-3 w-3 text-[#d92d20]" />
              {vehicle.powertrain || NA}
            </dd>
          </div>
          <div>
            <dt className="text-white/40">Baterai</dt>
            <dd className="mt-1 text-white/80">
              {vehicle.battery_kwh ? `${vehicle.battery_kwh} kWh` : NA}
            </dd>
          </div>
          <div>
            <dt className="text-white/40">Jarak Tempuh</dt>
            <dd className="mt-1 text-white/80">
              {vehicle.range_km ? `${formatNumber(vehicle.range_km)} km` : NA}
            </dd>
          </div>
          <div>
            <dt className="text-white/40">Kapasitas</dt>
            <dd className="mt-1 text-white/80">
              {vehicle.seating ? `${vehicle.seating} kursi` : NA}
            </dd>
          </div>
        </dl>

        <div className="mt-6 flex items-end justify-between gap-3 border-t border-white/10 pt-5">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-white/40">Mulai dari</p>
            <p className="mt-1 text-base font-semibold text-white">
              {formatIDR(vehicle.starting_price)}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                toggleCompare(vehicle.slug);
                track("compare_vehicle", { vehicle_slug: vehicle.slug });
              }}
              aria-label="Bandingkan model"
              data-testid={`vehicle-compare-${vehicle.slug}`}
              className={`flex h-11 w-11 items-center justify-center border transition-colors duration-300 ${
                inCompare ? "border-[#d92d20] text-[#d92d20]" : "border-white/20 text-white/60 hover:text-white"
              }`}
            >
              <GitCompareArrows className="h-4 w-4" />
            </button>
            <Link
              to={`/models/${vehicle.slug}`}
              data-testid={`vehicle-detail-${vehicle.slug}`}
              className="flex h-11 items-center gap-2 bg-white px-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-black transition-transform duration-300 hover:-translate-y-0.5"
            >
              Detail <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
};

export default VehicleCard;
