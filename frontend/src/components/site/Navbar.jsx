import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Menu, X, Search } from "lucide-react";
import { useSite } from "@/context/SiteContext";
import { whatsappLink, track } from "@/lib/tracking";

const LINKS = [
  { to: "/models", label: "Model" },
  { to: "/promotions", label: "Promo" },
  { to: "/compare", label: "Bandingkan" },
  { to: "/articles", label: "Artikel" },
  { to: "/events", label: "Event" },
  { to: "/contact", label: "Kontak" },
];

export const Navbar = () => {
  const { settings } = useSite();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [q, setQ] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const submitSearch = (e) => {
    e.preventDefault();
    navigate(`/models?q=${encodeURIComponent(q)}`);
    setSearchOpen(false);
    setOpen(false);
  };

  return (
    <header
      data-testid="site-navbar"
      className={`sticky top-0 z-50 border-b transition-colors duration-300 ${
        scrolled ? "border-white/10 bg-black/85 backdrop-blur-xl" : "border-transparent bg-black/40 backdrop-blur-md"
      }`}
    >
      <div className="container-byd flex h-[74px] items-center justify-between gap-6">
        <Link to="/" data-testid="nav-logo" className="group flex flex-col leading-none">
          <span className="font-display text-xl font-extrabold tracking-tight text-white">
            {settings?.dealer_name || "BYD BIPO"}
          </span>
          <span className="mt-0.5 text-[10px] uppercase tracking-[0.28em] text-white/45">
            {settings?.location_name || "Serpong"}
          </span>
        </Link>

        <nav className="hidden items-center gap-9 lg:flex">
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              data-testid={`nav-link-${l.label.toLowerCase()}`}
              className={({ isActive }) =>
                `relative text-[13px] font-medium uppercase tracking-[0.14em] transition-colors duration-300 ${
                  isActive ? "text-white" : "text-white/55 hover:text-white"
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <button
            aria-label="Cari model"
            data-testid="nav-search-toggle"
            onClick={() => setSearchOpen((v) => !v)}
            className="hidden h-10 w-10 items-center justify-center border border-white/15 text-white/70 transition-colors duration-300 hover:text-white sm:flex"
          >
            <Search className="h-4 w-4" />
          </button>
          <a
            href={whatsappLink(settings, "general")}
            target="_blank"
            rel="noreferrer"
            data-testid="nav-whatsapp-cta"
            onClick={() => track("click_whatsapp", { meta: { placement: "navbar" } })}
            className="hidden bg-[#d92d20] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-white transition-transform duration-300 hover:-translate-y-0.5 sm:block"
          >
            {settings?.cta_labels?.whatsapp || "Chat WhatsApp"}
          </a>
          <button
            aria-label="Menu"
            data-testid="nav-mobile-toggle"
            onClick={() => setOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center border border-white/15 text-white lg:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {searchOpen && (
        <form onSubmit={submitSearch} className="container-byd hidden pb-5 sm:block">
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            data-testid="nav-search-input"
            placeholder="Search BYD model..."
            className="field-byd"
          />
        </form>
      )}

      {open && (
        <div className="border-t border-white/10 bg-black/95 lg:hidden" data-testid="nav-mobile-menu">
          <div className="container-byd flex flex-col py-4">
            {LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                data-testid={`nav-mobile-${l.label.toLowerCase()}`}
                className="border-b border-white/5 py-4 text-sm uppercase tracking-[0.16em] text-white/75"
              >
                {l.label}
              </NavLink>
            ))}
            <form onSubmit={submitSearch} className="pt-5">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                data-testid="nav-mobile-search"
                placeholder="Search BYD model..."
                className="field-byd"
              />
            </form>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
