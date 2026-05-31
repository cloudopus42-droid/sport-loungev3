import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Image,
  Blend,
  Tags,
  Mail,
  Armchair,
  LayoutGrid,
  BarChart3,
  LogOut,
  Menu,
  X,
  Crown,
} from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '@/hooks/useAuth';
import { useSocket } from '@/hooks/useSocket';
import { showToast } from '@/components/NotificationToast';

const sidebarItems = [
  { path: '/admin', icon: LayoutDashboard, label: 'Дашборд', end: true },
  { path: '/admin/bookings', icon: Armchair, label: 'Заказы', end: false },
  { path: '/admin/analytics', icon: BarChart3, label: 'Аналитика', end: false },
  { path: '/admin/showcases', icon: LayoutGrid, label: 'Витрина', end: false },
  { path: '/admin/posts', icon: Image, label: 'Посты', end: false },
  { path: '/admin/mixes', icon: Blend, label: 'Миксы', end: false },
  { path: '/admin/promos', icon: Tags, label: 'Акции', end: false },
  { path: '/admin/invitations', icon: Mail, label: 'Приглашения', end: false },
];

export function AdminLayout() {
  const { user, isAdmin, loading, logout } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Request browser desktop notification permissions on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Listen globally to incoming order bookings and alert the admin
  useEffect(() => {
    if (!socket || !isAdmin) return;

    const handleNewBooking = (bookingData: any) => {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-600.wav');
      audio.volume = 0.5;
      audio.play().catch((e) => console.log('Chime failed to play:', e.message));

      showToast(`Новый заказ кальяна! Стол: ${bookingData?.seatLabel || 'Микс-билет'}`, 'success');

      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification('Новый заказ SPORT LOUNGE', {
            body: `Стол: ${bookingData?.seatLabel || 'Микс-билет'} • Смесь: ${bookingData?.hookahMix || 'Смотрите детали'}`,
            icon: '/icon-192.png'
          });
        } catch (err) {
          console.warn('Notification trigger fail:', err);
        }
      }
    };

    socket.on('booking:created', handleNewBooking);
    return () => {
      socket.off('booking:created', handleNewBooking);
    };
  }, [socket, isAdmin]);

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate('/login', { replace: true });
    }
  }, [loading, isAdmin, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent-cyan border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) return null;

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen flex">
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        className={clsx(
          'fixed lg:static inset-y-0 left-0 z-50 w-64 bg-dark-surface/95 backdrop-blur-glass border-r border-glass-border flex flex-col',
          'lg:translate-x-0 transition-transform duration-300',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-glass-border">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-yellow-300 via-accent-gold to-yellow-600 flex items-center justify-center shadow-[0_4px_16px_rgba(212,175,55,0.45)] border border-yellow-200/20">
            <Crown className="w-5 h-5 text-black" />
          </div>
          <div>
            <h1 className="text-base font-display font-semibold text-white tracking-wide">SPORT LOUNGE</h1>
            <p className="text-[10px] text-white/30 uppercase tracking-wider">Админ панель</p>
          </div>
          <button
            className="ml-auto lg:hidden p-1 text-white/40 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {sidebarItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              onClick={() => setSidebarOpen(false)}
            >
              {({ isActive }) => (
                <div
                  className={clsx(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-accent-gold/10 text-accent-gold border border-accent-gold/25 shadow-[0_0_12px_rgba(212,175,55,0.25)]'
                      : 'text-white/50 hover:text-white/80 hover:bg-glass-bg border border-transparent'
                  )}
                >
                  <item.icon className="w-4.5 h-4.5" />
                  {item.label}
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User section */}
        <div className="px-3 py-4 border-t border-glass-border">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-300 via-accent-gold to-yellow-600 flex items-center justify-center text-xs font-bold text-black border border-yellow-200/20">
              {user?.name?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name || 'Админ'}</p>
              <p className="text-[10px] text-white/30">{user?.email}</p>
            </div>
            <motion.button
              className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              onClick={handleLogout}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title="Выйти"
            >
              <LogOut className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </motion.aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen lg:ml-0">
        {/* Top header (mobile) */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-glass-border bg-dark-surface/80 backdrop-blur-glass sticky top-0 z-30">
          <motion.button
            className="p-2 rounded-xl bg-glass-bg border border-glass-border text-white/60 hover:text-white"
            onClick={() => setSidebarOpen(true)}
            whileTap={{ scale: 0.9 }}
          >
            <Menu className="w-5 h-5" />
          </motion.button>
          <h1 className="text-sm font-display font-semibold text-white tracking-wide">SPORT LOUNGE</h1>
          <div className="w-9" /> {/* Spacer */}
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
