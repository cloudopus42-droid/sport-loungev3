import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/contexts/AuthContext';
import { SocketProvider } from '@/contexts/SocketContext';
import { MainLayout } from '@/layouts/MainLayout';
import { AdminLayout } from '@/layouts/AdminLayout';
import { HomePage } from '@/pages/HomePage';
import { BookingPage } from '@/pages/BookingPage';
import { MixologistPage } from '@/pages/MixologistPage';
import { FeedPage } from '@/pages/FeedPage';
import { InvitationsPage } from '@/pages/InvitationsPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { LoginCallbackPage } from '@/pages/LoginCallbackPage';
import { NotFound } from '@/pages/NotFound';
import { Dashboard } from '@/pages/admin/Dashboard';
import { PostsPage } from '@/pages/admin/PostsPage';
import { MixesPage } from '@/pages/admin/MixesPage';
import { PromosPage } from '@/pages/admin/PromosPage';
import { AdminInvitationsPage } from '@/pages/admin/InvitationsPage';
import { AdminBookingsPage } from '@/pages/admin/BookingsPage';
import { AdminShowcasePage } from '@/pages/admin/ShowcasePage';
import { AnalyticsPage } from '@/pages/admin/AnalyticsPage';
import { OrdersAdmin } from '@/pages/admin/OrdersAdmin';

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
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

        <Toaster position="top-right" toastOptions={{ duration: 4000, style: {
          background: '#12121A', color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '12px', backdropFilter: 'blur(20px)',
        }}} />
      </SocketProvider>
    </AuthProvider>
  );
}
