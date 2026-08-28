import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "@/lib/api";
import Seo from "@/components/site/Seo";
import TestDriveForm from "@/components/site/TestDriveForm";
import SectionHeader from "@/components/site/SectionHeader";
import { useSite } from "@/context/SiteContext";

export default function TestDrivePage() {
  const { settings } = useSite();
  const [params] = useSearchParams();
  const [vehicles, setVehicles] = useState([]);

  useEffect(() => {
    api.get("/public/vehicles?limit=60").then((r) => setVehicles(r.data)).catch(() => {});
  }, []);

  return (
    <>
      <Seo title={`Booking Test Drive BYD — ${settings?.dealer_name}`}
           description="Ajukan jadwal test drive mobil listrik BYD di BYD BIPO Serpong." />
      <section className="container-byd pb-10 pt-28">
        <SectionHeader overline="Pengalaman" title="Booking Test Drive"
                       subtitle="Pilih model, tanggal, dan waktu. Kami akan mengonfirmasi ketersediaan unit melalui WhatsApp." />
      </section>
      <section className="container-byd grid gap-12 pb-28 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <TestDriveForm vehicles={vehicles} defaultVehicle={params.get("model") || ""}
                         testId="page-test-drive-form" />
        </div>
        <aside className="lg:col-span-5">
          <div className="border border-white/10 bg-[#111111] p-7">
            <p className="overline">Yang perlu dibawa</p>
            <ul className="mt-5 space-y-3 text-sm text-white/65">
              <li className="border-b border-white/10 pb-3">SIM A yang masih berlaku</li>
              <li className="border-b border-white/10 pb-3">Konfirmasi jadwal dari sales consultant</li>
              <li className="border-b border-white/10 pb-3">Waktu sekitar 30–45 menit</li>
            </ul>
            <p className="mt-7 text-xs leading-relaxed text-white/40">
              Ketersediaan unit test drive dapat berubah. Jadwal final akan dikonfirmasi oleh
              {" "}{settings?.sales_consultant}.
            </p>
          </div>
        </aside>
      </section>
    </>
  );
}
