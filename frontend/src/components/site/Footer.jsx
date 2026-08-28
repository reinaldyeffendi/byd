import { Link } from "react-router-dom";
import { Instagram, MapPin, Phone, Mail, Clock } from "lucide-react";
import { useSite } from "@/context/SiteContext";

export const Footer = () => {
  const { settings } = useSite();
  const footer = settings?.footer || {};

  return (
    <footer className="hairline mt-24 bg-[#0a0a0a]" data-testid="site-footer">
      <div className="container-byd grid gap-14 py-16 lg:grid-cols-[1.3fr_2fr]">
        <div>
          <p className="font-display text-2xl font-extrabold text-white">
            {settings?.dealer_name || "BYD BIPO"}
          </p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/55">
            {footer.tagline || "Menuju mobilitas listrik yang lebih cerdas."}
          </p>
          <div className="mt-7 space-y-3 text-sm text-white/60">
            <p className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#d92d20]" />
              {settings?.address}
            </p>
            <p className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-[#d92d20]" />
              +{settings?.phone}
            </p>
            <p className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-[#d92d20]" />
              {settings?.email}
            </p>
            <p className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-[#d92d20]" />
              {settings?.operating_hours}
            </p>
            <a
              href={settings?.instagram_url}
              target="_blank"
              rel="noreferrer"
              data-testid="footer-instagram"
              className="flex items-center gap-3 text-white/70 transition-colors duration-300 hover:text-white"
            >
              <Instagram className="h-4 w-4 text-[#d92d20]" />
              {settings?.instagram}
            </a>
          </div>
        </div>

        <div className="grid gap-10 sm:grid-cols-3">
          {(footer.columns || []).map((col) => (
            <div key={col.title}>
              <p className="overline">{col.title}</p>
              <ul className="mt-5 space-y-3">
                {(col.links || []).map((link) => (
                  <li key={link.url + link.label}>
                    <Link
                      to={link.url}
                      className="text-sm text-white/60 transition-colors duration-300 hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="hairline">
        <div className="container-byd flex flex-col gap-3 py-6 text-xs text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {footer.copyright}
          </p>
          <div className="flex gap-5">
            <Link to="/privacy-policy" className="hover:text-white/70">Privasi</Link>
            <Link to="/terms" className="hover:text-white/70">Syarat</Link>
            <Link to="/cookie-policy" className="hover:text-white/70">Cookie</Link>
            <Link to="/admin/login" className="hover:text-white/70" data-testid="footer-admin-link">Admin</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
