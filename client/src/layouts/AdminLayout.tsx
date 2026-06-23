import { useState, useEffect, useCallback } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Image, Blend, Mail, Armchair, LogOut, Crown, Flame
} from 'lucide-react';
import { DashboardIcon, ShowcaseIcon, PromoIcon, AnalyticsIcon, SettingsIcon, MenuIcon, CloseIcon, ChevronLeftIcon } from '@/components/icons';
import clsx from 'clsx';
import { useAuth } from '@/hooks/useAuth';
import { useSocket } from '@/hooks/useSocket';
import { showToast } from '@/components/NotificationToast';
import { VersionBadge } from '@/components/VersionBadge';
import Tooltip from '@/components/ui/Tooltip';

interface SidebarItem {
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  end: boolean;
}

const sidebarItems: SidebarItem[] = [
  { path: '/admin', icon: DashboardIcon, label: 'Дашборд', end: true },
  { path: '/admin/bookings', icon: Armchair, label: 'Заказы', end: false },
  { path: '/admin/analytics', icon: AnalyticsIcon, label: 'Аналитика', end: false },
  { path: '/admin/showcases', icon: ShowcaseIcon, label: 'Витрина', end: false },
  { path: '/admin/posts', icon: Image, label: 'Посты', end: false },
  { path: '/admin/mixes', icon: Blend, label: 'Миксы', end: false },
  { path: '/admin/promos', icon: PromoIcon, label: 'Акции', end: false },
  { path: '/admin/invitations', icon: Mail, label: 'Приглашения', end: false },
  { path: '/admin/orders', icon: Flame, label: 'Очередь', end: false },
  { path: '/admin/smart-features', icon: SettingsIcon, label: 'Smart Features', end: false },
];

const mobileTabItems: SidebarItem[] = [
  { path: '/admin', icon: DashboardIcon, label: 'Дашборд', end: true },
  { path: '/admin/bookings', icon: Armchair, label: 'Заказы', end: false },
  { path: '/admin/orders', icon: Flame, label: 'Очередь', end: false },
  { path: '/admin/analytics', icon: AnalyticsIcon, label: 'Аналитика', end: false },
  { path: '/admin/smart-features', icon: SettingsIcon, label: 'Smart', end: false },
];

export function AdminLayout() {
  const { user, isAdmin, loading, logout } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const prefersReducedMotion = useReducedMotion();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [hasNewOrders, setHasNewOrders] = useState(false);

  const ft = prefersReducedMotion ? { duration: 0.01 } : undefined;
  const springFast = prefersReducedMotion
    ? { duration: 0.01 }
    : { type: 'spring' as const, stiffness: 380, damping: 30 };

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (!socket || !isAdmin) return;
    const handleNewBooking = (bookingData: any) => {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-600.wav');
      audio.volume = 0.5;
      audio.play().catch((e) => console.log('Chime failed to play:', e.message));
      showToast(`Новый заказ кальяна! Стол: ${bookingData?.seatLabel || 'Микс-билет'}`, 'success');
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

  // Join admin room via Socket.IO so admin receives staff-targeted events
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

  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

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
    <div className="min-h-screen flex bg-dark-bg">
      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={ft || { duration: 0.2 }}
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <motion.aside
        className="fixed lg:static inset-y-0 left-0 z-50 bg-dark-surface/95 backdrop-blur-glass border-r border-glass-border flex flex-col overflow-hidden will-change-transform"
        animate={{
          width: collapsed ? 64 : 280,
          x: sidebarOpen ? 0 : -280,
        }}
        transition={{ duration: prefersReducedMotion ? 0.01 : 0.3, ease: 'easeInOut' }}
        aria-label="Админ панель"
      >
        {/* Logo + collapse toggle */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-glass-border min-h-[68px] flex-shrink-0">
          <motion.div
            className="w-9 h-9 rounded-xl bg-[#0D0F13] flex items-center justify-center shadow-elevated border border-glass-border flex-shrink-0"
            whileHover={{ scale: 1.05 }}
            transition={springFast}
          >
            <Crown className="w-5 h-5 text-black" />
          </motion.div>
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.div
                className="flex-1 min-w-0 overflow-hidden"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: prefersReducedMotion ? 0.01 : 0.15 }}
              >
                <h1 className="text-base font-display font-bold text-white tracking-wide truncate">SPORT LOUNGE</h1>
                <p className="text-[10px] text-white/30 uppercase tracking-wider truncate">Админ панель</p>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="flex items-center gap-1 ml-auto">
            <motion.button
              onClick={() => { setCollapsed(!collapsed); if (!collapsed && sidebarOpen) setSidebarOpen(false); }}
              className="hidden lg:flex p-1.5 rounded-lg text-white/40 hover:text-accent-gold hover:bg-accent-gold/10 transition-colors flex-shrink-0 focus-visible:ring-2 focus-visible:ring-accent-gold/50 focus-visible:outline-none"
              aria-label={collapsed ? 'Развернуть боковую панель' : 'Свернуть боковую панель'}
              aria-expanded={!collapsed}
              whileTap={{ scale: 0.9 }}
            >
              <ChevronLeftIcon className={clsx('w-4 h-4 transition-transform duration-300', collapsed && 'rotate-180')} />
            </motion.button>
            <button
              className="lg:hidden p-1 text-white/40 hover:text-white focus-visible:ring-2 focus-visible:ring-accent-gold/50 focus-visible:outline-none rounded-lg"
              onClick={() => setSidebarOpen(false)}
              aria-label="Закрыть панель"
            >
              <CloseIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto overflow-x-hidden" aria-label="Admin navigation">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                onClick={() => { setSidebarOpen(false); if (item.path === '/admin/orders' || item.path === '/admin/bookings') clearNewOrders(); }}
                className="block relative"
                onKeyDown={(e: React.KeyboardEvent<HTMLAnchorElement>) => {
                  if (e.key === ' ') {
                    e.preventDefault();
                    navigate(item.path);
                  }
                }}
              >
                {({ isActive }) => {
                  const linkContent = (
                    <div className={clsx(
                      'relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 overflow-hidden',
                      isActive
                        ? 'text-accent-gold bg-accent-gold/10'
                        : 'text-white/50 hover:text-white/80 hover:bg-glass-bg'
                    )}
                      style={{ willChange: 'transform' }}
                    >
                      <div className="relative flex items-center gap-3 min-w-0 w-full">
                        <div className="relative flex-shrink-0">
                          <Icon className="w-[18px] h-[18px]" />
                          {(item.path === '/admin/orders' || item.path === '/admin/bookings') && hasNewOrders && (
                            <motion.span
                              className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-dark-surface"
                              animate={{ scale: [1, 1.3, 1] }}
                              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                            />
                          )}
                        </div>
                        <AnimatePresence mode="wait">
                          {!collapsed && (
                            <motion.span
                              className="truncate"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: prefersReducedMotion ? 0.01 : 0.15 }}
                            >
                              {item.label}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Active indicator: gold left border */}
                      <AnimatePresence>
                        {isActive && (
                          <motion.div
                            className="absolute left-0 top-2 bottom-2 w-[2px] bg-accent-gold rounded-r-full"
                            initial={{ scaleY: 0, opacity: 0 }}
                            animate={{ scaleY: 1, opacity: 1 }}
                            exit={{ scaleY: 0, opacity: 0 }}
                            transition={{ duration: prefersReducedMotion ? 0.01 : 0.2, ease: 'easeOut' }}
                            style={{ originY: 0.5 }}
                          />
                        )}
                      </AnimatePresence>
                    </div>
                  );
                  return collapsed ? (
                    <Tooltip content={item.label}>{linkContent}</Tooltip>
                  ) : linkContent;
                }}
              </NavLink>
            );
          })}

          {/* New: Smart Features is already in sidebarItems above */}
        </nav>

        {/* User section */}
        <div className="px-2 py-4 border-t border-glass-border flex-shrink-0">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-accent-gold flex items-center justify-center text-xs font-bold text-black flex-shrink-0">
              {user?.name?.[0]?.toUpperCase() || 'A'}
            </div>
            <AnimatePresence mode="wait">
              {!collapsed && (
                <motion.div
                  className="flex-1 min-w-0 overflow-hidden"
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: prefersReducedMotion ? 0.01 : 0.15 }}
                >
                  <p className="text-sm font-medium text-white truncate">{user?.name || 'Админ'}</p>
                  <p className="text-[10px] text-white/30 truncate">{user?.email}</p>
                </motion.div>
              )}
            </AnimatePresence>
            <motion.button
              className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors flex-shrink-0 focus-visible:ring-2 focus-visible:ring-red-400/50 focus-visible:outline-none"
              onClick={handleLogout}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              transition={springFast}
              title="Выйти"
              aria-label="Выйти"
            >
              <LogOut className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </motion.aside>

      {/* Main content area */}
      <div
        className="flex-1 flex flex-col min-h-screen"
        style={{ paddingLeft: 0 }}
      >
        {/* Top header (mobile) */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-glass-border bg-dark-surface/80 backdrop-blur-glass sticky top-0 z-30">
          <motion.button
            className="p-2 rounded-xl bg-glass-bg border border-glass-border text-white/60 hover:text-white focus-visible:ring-2 focus-visible:ring-accent-gold/50 focus-visible:outline-none"
            onClick={() => setSidebarOpen(true)}
            whileTap={{ scale: 0.9 }}
            aria-label="Открыть меню"
          >
            <MenuIcon className="w-5 h-5" />
          </motion.button>
          <h1 className="text-sm font-display font-semibold text-white tracking-wide">SPORT LOUNGE</h1>
          <div className="w-9" />
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0, transition: prefersReducedMotion ? { duration: 0.01 } : { type: 'spring' as const, stiffness: 120, damping: 24, mass: 1 } }}
              exit={{ opacity: 0, y: -8, transition: { duration: prefersReducedMotion ? 0.01 : 0.2, ease: [0.23, 1, 0.32, 1] } }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile bottom tab bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-dark-surface/90 backdrop-blur-xl border-t border-glass-border"
        aria-label="Быстрая навигация"
      >
        <div className="max-w-lg mx-auto flex items-center justify-around px-1 py-1">
          {mobileTabItems.map((tab) => {
            const Icon = tab.icon;
            return (
              <NavLink
                key={tab.path}
                to={tab.path}
                end={tab.end}
                onClick={() => { if (tab.path === '/admin/orders' || tab.path === '/admin/bookings') clearNewOrders(); }}
                className="relative flex-1 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold/50 rounded-lg"
                aria-label={tab.label}
              >
                {({ isActive }) => (
                  <motion.div
                    className={clsx(
                      'flex flex-col items-center justify-center gap-0.5 min-h-[48px] min-w-[48px] rounded-xl transition-colors',
                      isActive ? 'text-accent-gold' : 'text-white/40 hover:text-white/60'
                    )}
                    whileTap={{ scale: 0.88 }}
                    transition={springFast}
                  >
                    <div className="relative">
                      <Icon className="w-5 h-5" />
                      {(tab.path === '/admin/orders' || tab.path === '/admin/bookings') && hasNewOrders && (
                        <motion.span
                          className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full border border-dark-surface"
                          animate={{ scale: [1, 1.3, 1] }}
                          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                        />
                      )}
                    </div>
                    <span className={clsx(
                      'text-[9px] font-heading font-semibold tracking-tight',
                      isActive ? 'text-accent-gold' : 'text-white/40'
                    )}>
                      {tab.label}
                    </span>
                    {isActive && (
                      <motion.div
                        className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent-gold"
                        layoutId="adminMobileNavDot"
                        transition={springFast}
                      />
                    )}
                  </motion.div>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>

      <VersionBadge />
    </div>
  );
}
