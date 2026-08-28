import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import WhatsAppFloat from "./WhatsAppFloat";
import CompareBar from "./CompareBar";
import CookieConsent from "./CookieConsent";
import { captureUtm, track } from "@/lib/tracking";

export default function PublicLayout() {
  const location = useLocation();

  useEffect(() => {
    captureUtm();
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    track("page_view");
  }, [location.pathname]);

  return (
    <div className="byd-shell min-h-screen overflow-x-hidden" data-testid="public-layout">
      <Navbar />
      <main id="main">
        <Outlet />
      </main>
      <Footer />
      <CompareBar />
      <WhatsAppFloat />
      <CookieConsent />
    </div>
  );
}
