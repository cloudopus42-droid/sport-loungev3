import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/contexts/AuthContext';
import { SocketProvider } from '@/contexts/SocketContext';
import { FeatureProvider } from '@/contexts/FeatureContext';
import { MainLayout } from '@/layouts/MainLayout';
import { AdminLayout } from '@/layouts/AdminLayout';

// Lazily load route components
const HomePage = lazy(() => import('@/pages/HomePage').then(m => ({ default: m.HomePage })));
const BookingPage = lazy(() => import('@/pages/BookingPage').then(m => ({ default: m.BookingPage })));
const TobaccoPage = lazy(() => import('@/pages/TobaccoPage').then(m => ({ default: m.TobaccoPage })));
const KnowledgeGraphPage = lazy(() => import('@/pages/KnowledgeGraphPage').then(m => ({ default: m.KnowledgeGraphPage })));
const FeedPage = lazy(() => import('@/pages/FeedPage').then(m => ({ default: m.FeedPage })));
const InvitationsPage = lazy(() => import('@/pages/InvitationsPage').then(m => ({ default: m.InvitationsPage })));
const ProfilePage = lazy(() => import('@/pages/ProfilePage').then(m => ({ default: m.ProfilePage })));
const LoginPage = lazy(() => import('@/pages/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('@/pages/RegisterPage').then(m => ({ default: m.RegisterPage })));
const LoginCallbackPage = lazy(() => import('@/pages/LoginCallbackPage').then(m => ({ default: m.LoginCallbackPage })));
const OrderTrackerPage = lazy(() => import('@/pages/OrderTrackerPage').then(m => ({ default: m.OrderTrackerPage })));
const LoyaltyPage = lazy(() => import('@/pages/LoyaltyPage').then(m => ({ default: m.LoyaltyPage })));
const GalleryPage = lazy(() => import('@/pages/GalleryPage').then(m => ({ default: m.GalleryPage })));
const NotFound = lazy(() => import('@/pages/NotFound').then(m => ({ default: m.NotFound })));
const CookiePolicyPage = lazy(() => import('@/pages/CookiePolicyPage').then(m => ({ default: m.CookiePolicyPage })));

const Dashboard = lazy(() => import('@/pages/admin/Dashboard').then(m => ({ default: m.Dashboard })));
const PostsPage = lazy(() => import('@/pages/admin/PostsPage').then(m => ({ default: m.PostsPage })));
const MixesPage = lazy(() => import('@/pages/admin/MixesPage').then(m => ({ default: m.MixesPage })));
const PromosPage = lazy(() => import('@/pages/admin/PromosPage').then(m => ({ default: m.PromosPage })));
const AdminInvitationsPage = lazy(() => import('@/pages/admin/InvitationsPage').then(m => ({ default: m.AdminInvitationsPage })));
const AdminBookingsPage = lazy(() => import('@/pages/admin/BookingsPage').then(m => ({ default: m.AdminBookingsPage })));
const AdminShowcasePage = lazy(() => import('@/pages/admin/ShowcasePage').then(m => ({ default: m.AdminShowcasePage })));
const AnalyticsPage = lazy(() => import('@/pages/admin/AnalyticsPage').then(m => ({ default: m.AnalyticsPage })));
const OrdersAdmin = lazy(() => import('@/pages/admin/OrdersAdmin').then(m => ({ default: m.OrdersAdmin })));
const TobaccoAdmin = lazy(() => import('@/pages/admin/TobaccoAdmin').then(m => ({ default: m.TobaccoAdmin })));
const SmartFeaturesPage = lazy(() => import('@/pages/admin/SmartFeaturesPage').then(m => ({ default: m.SmartFeaturesPage })));
const AdminLogsPage = lazy(() => import('@/pages/admin/AdminLogsPage').then(m => ({ default: m.AdminLogsPage })));
const BugHunterPage = lazy(() => import('@/pages/admin/BugHunterPage').then(m => ({ default: m.BugHunterPage })));
const WebScoutPage = lazy(() => import('@/pages/admin/WebScoutPage').then(m => ({ default: m.WebScoutPage })));
const AgentHealthPage = lazy(() => import('@/pages/admin/AgentHealthPage').then(m => ({ default: m.AgentHealthPage })));

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <FeatureProvider>
          <Suspense fallback={
            <div className="min-h-screen bg-dark-bg flex flex-col items-center justify-center text-white font-sans">
              <div className="w-10 h-10 rounded-xl bg-accent-gold flex items-center justify-center mb-4">
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
              </div>
              <span className="text-xs uppercase tracking-[0.25em] text-white/50">Загрузка...</span>
            </div>
          }>
            <Routes>
              <Route path="/" element={<MainLayout />}>
                <Route index element={<HomePage />} />
                <Route path="booking" element={<BookingPage />} />
                <Route path="mixologist" element={<Navigate to="/booking" replace />} />
                <Route path="order" element={<OrderTrackerPage />} />
                <Route path="order-tracker" element={<OrderTrackerPage />} />
                <Route path="loyalty" element={<LoyaltyPage />} />
                <Route path="gallery" element={<GalleryPage />} />
                <Route path="tobacco" element={<TobaccoPage />} />
                <Route path="knowledge" element={<KnowledgeGraphPage />} />
                <Route path="feed" element={<FeedPage />} />
                <Route path="invitations" element={<InvitationsPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="cookie-policy" element={<CookiePolicyPage />} />
              </Route>

              <Route path="/login" element={<LoginPage />} />
              <Route path="/login/callback" element={<LoginCallbackPage />} />
              <Route path="/register" element={<RegisterPage />} />

              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="bookings" element={<AdminBookingsPage />} />
                <Route path="analytics" element={<AnalyticsPage />} />
                <Route path="showcases" element={<AdminShowcasePage />} />
                <Route path="posts" element={<PostsPage />} />
                <Route path="mixes" element={<MixesPage />} />
                <Route path="promos" element={<PromosPage />} />
                <Route path="invitations" element={<AdminInvitationsPage />} />
                <Route path="orders" element={<OrdersAdmin />} />
                <Route path="tobacco" element={<TobaccoAdmin />} />
                <Route path="smart-features" element={<SmartFeaturesPage />} />
          <Route path="logs" element={<AdminLogsPage />} />
          <Route path="bughunter" element={<BugHunterPage />} />
          <Route path="webscout" element={<WebScoutPage />} />
          <Route path="agent-health" element={<AgentHealthPage />} />
        </Route>

              <Route path="/404" element={<NotFound />} />
              <Route path="*" element={<Navigate to="/404" replace />} />
            </Routes>
          </Suspense>

          <Toaster position="top-right" toastOptions={{ duration: 4000, style: {
            background: '#12121A', color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '12px', backdropFilter: 'blur(20px)',
          }}} />
        </FeatureProvider>
      </SocketProvider>
    </AuthProvider>
  );
}

