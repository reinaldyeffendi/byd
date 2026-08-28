import { useState } from "react";
import { NavLink, Outlet, Navigate, Link, useLocation } from "react-router-dom";
import {
  BarChart3, Car, Tag, Newspaper, CalendarDays, Quote, Users, CalendarCheck,
  Image, LayoutDashboard, Settings, DownloadCloud, ScrollText, UserCog, LogOut, Menu, X, ExternalLink,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const NAV = [
  { to: "/admin", label: "Dashboard", icon: BarChart3, perm: "analytics", end: true },
  { to: "/admin/vehicles", label: "Kendaraan", icon: Car, perm: "vehicles" },
  { to: "/admin/promotions", label: "Promo", icon: Tag, perm: "promotions" },
  { to: "/admin/articles", label: "Artikel", icon: Newspaper, perm: "articles" },
  { to: "/admin/events", label: "Event", icon: CalendarDays, perm: "events" },
  { to: "/admin/testimonials", label: "Testimoni", icon: Quote, perm: "testimonials" },
  { to: "/admin/leads", label: "Leads", icon: Users, perm: "leads" },
  { to: "/admin/test-drives", label: "Test Drive", icon: CalendarCheck, perm: "test_drives" },
  { to: "/admin/media", label: "Media", icon: Image, perm: "media" },
  { to: "/admin/homepage", label: "Homepage", icon: LayoutDashboard, perm: "homepage" },
  { to: "/admin/settings", label: "Site Settings", icon: Settings, perm: "settings" },
  { to: "/admin/import", label: "Import / Sync", icon: DownloadCloud, perm: "import" },
  { to: "/admin/logs", label: "Activity Log", icon: ScrollText, perm: "logs" },
  { to: "/admin/users", label: "Users & Roles", icon: UserCog, perm: "users" },
];

export default function AdminLayout() {
  const { user, logout, can } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  if (user === null)
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505] text-white/50"
           data-testid="admin-loading">
        Memeriksa sesi…
      </div>
    );
  if (user === false) return <Navigate to="/admin/login" replace state={{ from: location }} />;

  const items = NAV.filter((n) => can(n.perm));

  return (
    <div className="flex min-h-screen bg-[#0b0b0b] text-white" data-testid="admin-shell">
      <aside className={`fixed inset-y-0 left-0 z-40 w-[264px] border-r border-white/10 bg-[#0f0f0f] transition-transform duration-300 lg:translate-x-0 ${
        open ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="flex h-[70px] items-center justify-between border-b border-white/10 px-6">
          <Link to="/admin" className="font-display text-lg font-bold">BYD BIPO CMS</Link>
          <button onClick={() => setOpen(false)} className="lg:hidden" aria-label="Tutup menu">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex max-h-[calc(100vh-70px)] flex-col gap-1 overflow-y-auto p-4">
          {items.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} onClick={() => setOpen(false)}
                     data-testid={`admin-nav-${n.label.toLowerCase().replace(/[^a-z]+/g, "-")}`}
                     className={({ isActive }) =>
                       `flex items-center gap-3 px-4 py-3 text-sm transition-colors duration-200 ${
                         isActive ? "bg-[#d92d20]/15 text-white" : "text-white/55 hover:bg-white/5 hover:text-white"
                       }`
                     }>
              <n.icon className="h-4 w-4" />
              {n.label}
            </NavLink>
          ))}
          <div className="mt-6 border-t border-white/10 pt-4">
            <a href="/" target="_blank" rel="noreferrer"
               className="flex items-center gap-3 px-4 py-3 text-sm text-white/55 hover:text-white"
               data-testid="admin-view-site">
              <ExternalLink className="h-4 w-4" /> Lihat Website
            </a>
            <button onClick={logout} data-testid="admin-logout"
                    className="flex w-full items-center gap-3 px-4 py-3 text-sm text-white/55 hover:text-white">
              <LogOut className="h-4 w-4" /> Keluar
            </button>
          </div>
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col lg:ml-[264px]">
        <header className="sticky top-0 z-30 flex h-[70px] items-center justify-between border-b border-white/10 bg-[#0b0b0b]/95 px-5 backdrop-blur lg:px-8">
          <button onClick={() => setOpen(true)} className="lg:hidden" aria-label="Buka menu"
                  data-testid="admin-menu-toggle">
            <Menu className="h-5 w-5" />
          </button>
          <div className="ml-auto flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium" data-testid="admin-user-name">{user.name}</p>
              <p className="text-xs uppercase tracking-[0.14em] text-white/40" data-testid="admin-user-role">
                {user.role?.replace("_", " ")}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center bg-[#d92d20] text-sm font-bold">
              {user.name?.[0]?.toUpperCase()}
            </div>
          </div>
        </header>
        <main className="min-w-0 flex-1 p-5 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
