import { MessageCircle } from "lucide-react";
import { useSite } from "@/context/SiteContext";
import { whatsappLink, track } from "@/lib/tracking";

export const WhatsAppFloat = () => {
  const { settings } = useSite();
  if (!settings?.whatsapp_number) return null;

  return (
    <a
      href={whatsappLink(settings, "general")}
      target="_blank"
      rel="noreferrer"
      data-testid="floating-whatsapp-button"
      onClick={() => track("click_whatsapp", { meta: { placement: "floating" } })}
      className="fixed bottom-5 right-5 z-40 flex items-center gap-3 bg-[#d92d20] px-5 py-4 text-sm font-semibold uppercase tracking-[0.14em] text-white shadow-[0_10px_40px_rgba(217,45,32,0.35)] transition-transform duration-300 hover:-translate-y-1"
    >
      <MessageCircle className="h-5 w-5" />
      <span className="hidden sm:inline">Chat Sales</span>
    </a>
  );
};

export default WhatsAppFloat;
