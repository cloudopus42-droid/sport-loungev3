import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/contexts/AuthContext';
import { SocketProvider } from '@/contexts/SocketContext';
import { MainLayout } from '@/layouts/MainLayout';
import { AdminLayout } from '@/layouts/AdminLayout';

// Lazily load route components
const HomePage = lazy(() => import('@/pages/HomePage').then(m => ({ default: m.HomePage })));
const BookingPage = lazy(() => import('@/pages/BookingPage').then(m => ({ default: m.BookingPage })));
const MixologistPage = lazy(() => import('@/pages/MixologistPage').then(m => ({ default: m.MixologistPage })));
const FeedPage = lazy(() => import('@/pages/FeedPage').then(m => ({ default: m.FeedPage })));
const InvitationsPage = lazy(() => import('@/pages/InvitationsPage').then(m => ({ default: m.InvitationsPage })));
const ProfilePage = lazy(() => import('@/pages/ProfilePage').then(m => ({ default: m.ProfilePage })));
const LoginPage = lazy(() => import('@/pages/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('@/pages/RegisterPage').then(m => ({ default: m.RegisterPage })));
const LoginCallbackPage = lazy(() => import('@/pages/LoginCallbackPage').then(m => ({ default: m.LoginCallbackPage })));
const NotFound = lazy(() => import('@/pages/NotFound').then(m => ({ default: m.NotFound })));

const Dashboard = lazy(() => import('@/pages/admin/Dashboard').then(m => ({ default: m.Dashboard })));
const PostsPage = lazy(() => import('@/pages/admin/PostsPage').then(m => ({ default: m.PostsPage })));
const MixesPage = lazy(() => import('@/pages/admin/MixesPage').then(m => ({ default: m.MixesPage })));
const PromosPage = lazy(() => import('@/pages/admin/PromosPage').then(m => ({ default: m.PromosPage })));
const AdminInvitationsPage = lazy(() => import('@/pages/admin/InvitationsPage').then(m => ({ default: m.AdminInvitationsPage })));
const AdminBookingsPage = lazy(() => import('@/pages/admin/BookingsPage').then(m => ({ default: m.AdminBookingsPage })));
const AdminShowcasePage = lazy(() => import('@/pages/admin/ShowcasePage').then(m => ({ default: m.AdminShowcasePage })));
const AnalyticsPage = lazy(() => import('@/pages/admin/AnalyticsPage').then(m => ({ default: m.AnalyticsPage })));
const OrdersAdmin = lazy(() => import('@/pages/admin/OrdersAdmin').then(m => ({ default: m.OrdersAdmin })));

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Suspense fallback={
          <div className="min-h-screen bg-[#080605] flex flex-col items-center justify-center text-white font-sans">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#a855f7] to-[#4c1d95] flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.5)] animate-spin mb-4" />
            <span className="text-xs uppercase tracking-[0.25em] text-white/50 animate-pulse">Initializing System...</span>
          </div>
        }>
          <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<HomePage />} />
              <Route path="booking" element={<BookingPage />} />
              <Route path="mixologist" element={<MixologistPage />} />
              <Route path="feed" element={<FeedPage />} />
              <Route path="invitations" element={<InvitationsPage />} />
              <Route path="profile" element={<ProfilePage />} />
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
            </Route>

            <Route path="/404" element={<NotFound />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </Suspense>

        <Toaster position="top-right" toastOptions={{ duration: 4000, style: {
          background: '#12121A', color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '12px', backdropFilter: 'blur(20px)',
        }}} />
      </SocketProvider>
    </AuthProvider>
  );
}
