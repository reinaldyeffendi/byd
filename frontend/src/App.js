import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { SiteProvider } from "@/context/SiteContext";
import { AuthProvider } from "@/context/AuthContext";
import PublicLayout from "@/components/site/PublicLayout";
import Home from "@/pages/Home";
import Models from "@/pages/Models";
import VehicleDetail from "@/pages/VehicleDetail";
import Compare from "@/pages/Compare";
import Promotions from "@/pages/Promotions";
import PromotionDetail from "@/pages/PromotionDetail";
import Articles from "@/pages/Articles";
import ArticleDetail from "@/pages/ArticleDetail";
import Events from "@/pages/Events";
import EventDetail from "@/pages/EventDetail";
import Contact from "@/pages/Contact";
import TestDrivePage from "@/pages/TestDrivePage";
import LegalPage from "@/pages/LegalPage";
import NotFound from "@/pages/NotFound";
import AdminLogin from "@/admin/AdminLogin";
import AdminLayout from "@/admin/AdminLayout";
import Dashboard from "@/admin/Dashboard";
import ResourceListPage from "@/admin/ResourceListPage";
import ResourceEditor from "@/admin/ResourceEditor";
import LeadsPage from "@/admin/LeadsPage";
import TestDrivesPage from "@/admin/TestDrivesPage";
import MediaLibrary from "@/admin/MediaLibrary";
import HomepageEditor from "@/admin/HomepageEditor";
import SettingsPage from "@/admin/SettingsPage";
import ImportPage from "@/admin/ImportPage";
import QuickImportPage from "@/admin/QuickImportPage";
import ActivityLogsPage from "@/admin/ActivityLogsPage";
import UsersPage from "@/admin/UsersPage";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SiteProvider>
          <Routes>
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/models" element={<Models />} />
              <Route path="/models/:slug" element={<VehicleDetail />} />
              <Route path="/compare" element={<Compare />} />
              <Route path="/promotions" element={<Promotions />} />
              <Route path="/promotions/:slug" element={<PromotionDetail />} />
              <Route path="/articles" element={<Articles />} />
              <Route path="/articles/:slug" element={<ArticleDetail />} />
              <Route path="/events" element={<Events />} />
              <Route path="/events/:slug" element={<EventDetail />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/test-drive" element={<TestDrivePage />} />
              <Route path="/privacy-policy" element={<LegalPage slug="privacy-policy" />} />
              <Route path="/terms" element={<LegalPage slug="terms" />} />
              <Route path="/cookie-policy" element={<LegalPage slug="cookie-policy" />} />
              <Route path="*" element={<NotFound />} />
            </Route>

            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="vehicles" element={<ResourceListPage resource="vehicles" />} />
              <Route path="vehicles/:id" element={<ResourceEditor resource="vehicles" />} />
              <Route path="promotions" element={<ResourceListPage resource="promotions" />} />
              <Route path="promotions/:id" element={<ResourceEditor resource="promotions" />} />
              <Route path="articles" element={<ResourceListPage resource="articles" />} />
              <Route path="articles/:id" element={<ResourceEditor resource="articles" />} />
              <Route path="events" element={<ResourceListPage resource="events" />} />
              <Route path="events/:id" element={<ResourceEditor resource="events" />} />
              <Route path="testimonials" element={<ResourceListPage resource="testimonials" />} />
              <Route path="testimonials/:id" element={<ResourceEditor resource="testimonials" />} />
              <Route path="leads" element={<LeadsPage />} />
              <Route path="test-drives" element={<TestDrivesPage />} />
              <Route path="media" element={<MediaLibrary />} />
              <Route path="homepage" element={<HomepageEditor />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="import" element={<ImportPage />} />
              <Route path="quick-import" element={<QuickImportPage />} />
              <Route path="logs" element={<ActivityLogsPage />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Route>
          </Routes>
          <Toaster position="top-right" />
        </SiteProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
