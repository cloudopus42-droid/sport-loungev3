import { useState, useEffect, useCallback } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Crown } from 'lucide-react';
import { PremiumIcon } from '@/components/ui/PremiumIcon';
import clsx from 'clsx';
import { useAuth } from '@/hooks/useAuth';
import { useSocket } from '@/hooks/useSocket';
import { showToast } from '@/components/NotificationToast';
import { VersionBadge } from '@/components/VersionBadge';

interface SidebarItem {
  path: string;
  icon: string;
  label: string;
  end: boolean;
}

const sidebarItems: SidebarItem[] = [
  { path: '/admin', icon: 'homeNav', label: 'Дашборд', end: true },
  { path: '/admin/bookings', icon: 'orderNav', label: 'Заказы', end: false },
  { path: '/admin/orders', icon: 'orderNav', label: 'Очередь', end: false },
  { path: '/admin/users', icon: 'user', label: 'Клиенты', end: false },
  { path: '/admin/showcases', icon: 'sparkle', label: 'Витрина', end: false },
  { path: '/admin/posts', icon: 'sparkle', label: 'Посты', end: false },
  { path: '/admin/mixes', icon: 'sparkle', label: 'Миксы', end: false },
  { path: '/admin/promos', icon: 'sparkle', label: 'Акции', end: false },
  { path: '/admin/invitations', icon: 'chat', label: 'Приглаш.', end: false },
  { path: '/admin/tobacco', icon: 'profileNav', label: 'Табак', end: false },
  { path: '/admin/smart-features', icon: 'crown', label: 'Smart', end: false },
  { path: '/admin/logs', icon: 'homeNav', label: 'Логи', end: false },
];

const mobileTabItems: SidebarItem[] = [
  { path: '/admin', icon: 'homeNav', label: 'Дашборд', end: true },
  { path: '/admin/bookings', icon: 'orderNav', label: 'Заказы', end: false },
  { path: '/admin/orders', icon: 'orderNav', label: 'Очередь', end: false },
  { path: '/admin/users', icon: 'user', label: 'Клиенты', end: false },
  { path: '/admin/tobacco', icon: 'profileNav', label: 'Табак', end: false },
];

export function AdminLayout() {
  const { user, isAdmin, loading, logout } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const prefersReducedMotion = useReducedMotion();

  const [hasNewOrders, setHasNewOrders] = useState(false);

  const transitionFast = prefersReducedMotion
    ? { duration: 0.01 }
    : { duration: 0.3, ease: [0.23, 1, 0.32, 1] as const };

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (!socket || !isAdmin) return;
    const handleNewBooking = (bookingData: any) => {
      showToast(`Новый заказ кальяна! ${bookingData?.seatLabel ? `Стол: ${bookingData.seatLabel}` : 'Новый заказ'}`, 'success');
      setHasNewOrders(true);
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification('Новый заказ SPORT LOUNGE', {
            body: `Стол: ${bookingData?.seatLabel || 'Микс-билет'} • Смесь: ${bookingData?.hookahMix || 'Смотрите детали'}`,
            icon: '/icon-192.png',
          });
        } catch (err) {
          console.warn('Notification trigger fail:', err);
        }
      }
    };
    socket.on('booking:created', handleNewBooking);
    return () => { socket.off('booking:created', handleNewBooking); };
  }, [socket, isAdmin]);

  useEffect(() => {
    if (socket && isAdmin && user) {
      socket.emit('user:active', { id: user.id, name: user.name, role: user.role, isAdmin: true });
    }
  }, [socket, isAdmin, user]);

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate('/login', { replace: true });
    }
  }, [loading, isAdmin, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-bg">
        <div className="w-8 h-8 border-2 border-accent-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) return null;

  const handleLogout = useCallback(() => {
    logout();
    navigate('/login', { replace: true });
  }, [logout, navigate]);

  const clearNewOrders = () => setHasNewOrders(false);

  return (
    <div className="min-h-screen flex flex-col bg-dark-bg">
      {/* Top header with horizontal oval nav bar */}
      <header className="sticky top-0 z-50 bg-[#1a1815]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-full mx-auto flex items-center gap-3 px-3 lg:px-6 py-2.5">

          {/* Logo */}
          <NavLink
            to="/"
            className="flex items-center gap-2 flex-shrink-0 select-none group"
            aria-label="На сайт"
          >
            <motion.div
              className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FFBF00] to-[#FFD54F] flex items-center justify-center shadow-[0_0_16px_rgba(255,191,0,0.3)] flex-shrink-0"
              whileHover={{ scale: 1.08 }}
              transition={transitionFast}
            >
              <Crown className="w-4 h-4 text-[#0b0807]" />
            </motion.div>
            <span className="hidden sm:block font-mono text-[10px] uppercase tracking-[0.2em] text-white/50 group-hover:text-white transition-colors">SPORT</span>
          </NavLink>

          {/* Back to site */}
          <NavLink
            to="/"
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full liquid-glass font-mono text-[10px] uppercase tracking-[0.12em] text-white/40 hover:text-white/70 transition-all flex-shrink-0"
          >
            <PremiumIcon name="homeNav" size={12} />
            <span>Сайт</span>
          </NavLink>

          {/* Separator */}
          <div className="w-px h-5 bg-white/10 flex-shrink-0 hidden sm:block" />

          {/* Main oval nav bar — scrollable */}
          <div className="flex-1 overflow-x-auto scrollbar-hide">
            <nav className="inline-flex items-center gap-1.5 py-0.5" aria-label="Админ навигация">
              {sidebarItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.end}
                  onClick={() => { if (item.path === '/admin/orders' || item.path === '/admin/bookings') clearNewOrders(); }}
                  className={({ isActive }) => clsx(
                    'relative flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono text-[10px] uppercase tracking-[0.1em] whitespace-nowrap transition-all duration-200 flex-shrink-0',
                    isActive
                      ? 'bg-gradient-to-r from-[#FFBF00] to-[#FFD54F] text-[#0b0807] font-bold shadow-[0_0_14px_rgba(255,191,0,0.2)]'
                      : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                  )}
                >
                  <PremiumIcon name={item.icon} size={12} />
                  <span>{item.label}</span>
                  {(item.path === '/admin/orders' || item.path === '/admin/bookings') && hasNewOrders && (
                    <motion.span
                      className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0"
                      animate={{ scale: [1, 1.4, 1] }}
                      transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                    />
                  )}
                </NavLink>
              ))}
            </nav>
          </div>

          {/* User + logout */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full liquid-glass">
              <div className="w-6 h-6 rounded-full bg-accent-gold flex items-center justify-center text-[10px] font-bold text-[#0b0807] flex-shrink-0">
                {user?.name?.[0]?.toUpperCase() || 'A'}
              </div>
              <span className="text-[10px] font-mono text-white/50 truncate max-w-[80px]">{user?.name || 'Админ'}</span>
            </div>
            <button
              className="p-2 rounded-full liquid-glass text-white/30 hover:text-red-400 transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer"
              onClick={handleLogout}
              title="Выйти"
              aria-label="Выйти"
            >
              <PremiumIcon name="logOut" size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0, transition: prefersReducedMotion ? { duration: 0.01 } : { duration: 0.5, ease: [0.23, 1, 0.32, 1] as const } }}
            exit={{ opacity: 0, y: -8, transition: { duration: prefersReducedMotion ? 0.01 : 0.2, ease: [0.23, 1, 0.32, 1] } }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile bottom tab bar — oval pill style */}
      <nav
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 lg:hidden w-auto"
        style={{ bottom: 'max(1rem, calc(env(safe-area-inset-bottom) + 0.5rem))' }}
        aria-label="Быстрая навигация"
      >
        <motion.div
          className="relative rounded-full bg-[#1a1815]/80 backdrop-blur-[20px] border border-white/5 overflow-hidden"
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={prefersReducedMotion ? { duration: 0.01 } : { duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
        >
          <div className="relative flex items-center justify-around px-2 py-1.5 gap-0.5">
            {mobileTabItems.map((tab) => (
              <NavLink
                key={tab.path}
                to={tab.path}
                end={tab.end}
                onClick={() => { if (tab.path === '/admin/orders' || tab.path === '/admin/bookings') clearNewOrders(); }}
                className="relative flex items-center justify-center"
                aria-label={tab.label}
              >
                {({ isActive }) => (
                  <div
                    className={clsx(
                      'flex flex-col items-center justify-center gap-0.5 min-h-[44px] min-w-[52px] rounded-xl transition-colors',
                      isActive ? 'text-accent-gold' : 'text-white/30 hover:text-white/50'
                    )}
                  >
                    <PremiumIcon name={tab.icon} size={16} />
                    <span className={clsx(
                      'font-mono text-[9px] uppercase tracking-wider',
                      isActive ? 'text-accent-gold' : 'text-white/30'
                    )}>
                      {tab.label}
                    </span>
                    {isActive && (
                      <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent-gold" />
                    )}
                  </div>
                )}
              </NavLink>
            ))}
          </div>
        </motion.div>
      </nav>

      <VersionBadge />
    </div>
  );
}
