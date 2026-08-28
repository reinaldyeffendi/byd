import { createContext, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";

const SiteContext = createContext({ settings: null, homepage: null, loading: true });

export function SiteProvider({ children }) {
  const [settings, setSettings] = useState(null);
  const [homepage, setHomepage] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const [s, h] = await Promise.all([
        api.get("/public/settings"),
        api.get("/public/homepage").catch(() => ({ data: null })),
      ]);
      setSettings(s.data);
      setHomepage(h.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const t = settings?.tracking;
    if (!t) return;
    if (t.ga4_id && !document.getElementById("ga4-script")) {
      const s = document.createElement("script");
      s.id = "ga4-script";
      s.async = true;
      s.src = `https://www.googletagmanager.com/gtag/js?id=${t.ga4_id}`;
      document.head.appendChild(s);
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag("js", new Date());
      window.gtag("config", t.ga4_id);
    }
    if (t.gtm_id && !document.getElementById("gtm-script")) {
      const s = document.createElement("script");
      s.id = "gtm-script";
      s.async = true;
      s.src = `https://www.googletagmanager.com/gtm.js?id=${t.gtm_id}`;
      document.head.appendChild(s);
    }
  }, [settings]);

  return (
    <SiteContext.Provider value={{ settings, homepage, loading, reload: load }}>
      {children}
    </SiteContext.Provider>
  );
}

export const useSite = () => useContext(SiteContext);
