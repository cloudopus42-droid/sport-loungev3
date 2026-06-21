import { useState, useEffect, useCallback, Suspense, lazy, useRef } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Crown, LogOut, CalendarCheck, FlaskConical,
  BookOpen, Sparkles
} from 'lucide-react';
import { HomeIcon, MenuIcon, UserIcon, CloseIcon, ChevronRightIcon } from '@/components/icons';
import clsx from 'clsx';
import { useSocket } from '@/hooks/useSocket';
import { SEO } from '@/components/SEO';
import { useAuth } from '@/hooks/useAuth';
import { InvitationBanner } from '@/components/InvitationBanner';
import type { Invitation } from '@/types';
import { ConciergeChat } from '@/components/ui/ConciergeChat';
import { resolveImageUrl } from '@/lib/urls';
import { showToast } from '@/components/NotificationToast';

const ThreeSmoke = lazy(() => import('@/components/ThreeSmoke').then(m => ({ default: m.ThreeSmoke })));

interface DesktopNavItem {
  label: string;
  to?: string;
  hash?: string;
}

const desktopNavItems: DesktopNavItem[] = [
  { label: 'Главная', to: '/' },
  { label: 'Меню', hash: '#menu' },
  { label: 'Заказ', to: '/booking' },
  { label: 'ИИ-Миксолог', to: '/booking' },
  { label: 'Зоны', hash: '#zones' },
  { label: 'Контакты', hash: '#contacts' },
];

interface MobileTab {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
}

const mobileTabs: MobileTab[] = [
  { label: 'Главная', to: '/', icon: HomeIcon },
  { label: 'Заказ', to: '/booking', icon: CalendarCheck },
  { label: 'Миксолог', to: '/booking', icon: FlaskConical },
  { label: 'База', to: '/knowledge', icon: BookOpen },
  { label: 'Профиль', to: '/profile', icon: UserIcon },
];

export function MainLayout() {
  const { socket } = useSocket();
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const prefersReducedMotion = useReducedMotion();

  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const ft = prefersReducedMotion ? { duration: 0.01 } : undefined;
  const springFast = prefersReducedMotion
    ? { duration: 0.01 }
    : { type: 'spring' as const, stiffness: 380, damping: 30 };
  const springGentle = prefersReducedMotion
    ? { duration: 0.01 }
    : { type: 'spring' as const, stiffness: 300, damping: 25 };

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (!socket || !user) return;
    const handleHookahReady = (data: any) => {
      if (data.userId === user.id && data.hookahStatus === 'ready') {
        try {
          const saved = localStorage.getItem('notified_bookings');
          const notifiedList: string[] = saved ? JSON.parse(saved) : [];
          if (notifiedList.includes(data.id)) return;
          notifiedList.push(data.id);
          localStorage.setItem('notified_bookings', JSON.stringify(notifiedList));
        } catch {}
        showToast('Ваш кальян готов! Приятного покура! 💨', 'success');
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          new Notification('SPORT LOUNGE', { body: 'Ваш кальян готов! Приятного покура! 💨', icon: '/icon-192.png' });
        }
      }
    };
    socket.on('booking:updated', handleHookahReady);
    return () => { socket.off('booking:updated', handleHookahReady); };
  }, [socket, user]);

  const handleNavClick = useCallback((anchor: string) => {
    const base = import.meta.env.BASE_URL.replace(/\/$/, '');
    const currentPath = window.location.pathname;
    const isHomePage = currentPath === base || currentPath === base + '/' || currentPath === '/';
    if (!isHomePage) {
      navigate('/' + anchor);
    } else {
      const el = document.querySelector(anchor);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  }, [navigate]);

  const handleNewInvitation = useCallback((data: Invitation) => { setInvitation(data); }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on('invitation:published', handleNewInvitation);
    return () => { socket.off('invitation:published', handleNewInvitation); };
  }, [socket, handleNewInvitation]);

  useEffect(() => {
    if (socket && isAuthenticated && user) {
      socket.emit('user:active', { id: user.id, name: user.name, role: user.role });
    }
  }, [socket, isAuthenticated, user]);

  useEffect(() => {
    try {
      const b = localStorage.getItem('glass_blur') || '40';
      const o = localStorage.getItem('glass_opacity') || '0.72';
      document.documentElement.style.setProperty('--glass-blur', `${b}px`);
      document.documentElement.style.setProperty('--glass-opacity', o);
    } catch {}
  }, []);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  const handleLogout = useCallback(() => { logout(); navigate('/'); }, [logout, navigate]);

  const renderDesktopNavLink = (item: DesktopNavItem) => {
    if (item.to) {
      return (
        <NavLink
          key={item.label}
          to={item.to}
          end={item.to === '/'}
          className={({ isActive }) => clsx(
            'relative px-3 py-2 text-xs font-medium tracking-wide transition-all duration-300',
            isActive ? 'text-accent-gold' : 'text-white/60 hover:text-accent-gold hover:scale-[1.02]'
          )}
        >
          {({ isActive }) => (
            <>
              <span className="relative z-10">{item.label}</span>
              {isActive && (
                <motion.div
                  layoutId="nav-underline"
                  className="absolute bottom-0 left-2 right-2 h-[2px] bg-accent-gold rounded-full"
                  transition={springFast}
                />
              )}
            </>
          )}
        </NavLink>
      );
    }
    return (
      <button
        key={item.label}
        onClick={(e) => { e.preventDefault(); handleNavClick(item.hash!); }}
        className="relative px-3 py-2 text-xs font-medium tracking-wide text-white/60 hover:text-accent-gold hover:scale-[1.02] transition-all duration-300 cursor-pointer"
      >
        {item.label}
      </button>
    );
  };

  const getMobileTabTo = (tab: MobileTab) => {
    if (tab.to === '/profile' && !isAuthenticated) return '/login';
    return tab.to;
  };

  const pageTransition = prefersReducedMotion
    ? { initial: {}, animate: {}, exit: {}, transition: { duration: 0.01 } }
    : {
        initial: { opacity: 0, y: 12 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -12 },
        transition: { duration: 0.35, ease: 'easeOut' },
      };

  return (
    <div className="min-h-screen pb-16 lg:pb-0 relative bg-dark-bg text-[#F5F0E8]">
      <SEO />

      <div className="float-orb-1" />
      <div className="float-orb-2" />
      <div className="float-orb-3" />

      <Suspense fallback={null}>
        <ThreeSmoke />
      </Suspense>

      <ConciergeChat />
      {invitation && <InvitationBanner invitation={invitation} onClose={() => setInvitation(null)} />}

      {/* Desktop & Mobile Header */}
      <header className="sticky top-0 z-50">
        <div className="absolute inset-0 bg-dark-bg/70 backdrop-blur-xl border-b border-glass-border" />
        <div className="relative max-w-6xl mx-auto flex items-center justify-between px-4 lg:px-8 py-3 gap-4">

          {/* Logo with pulse */}
          <NavLink
            to="/"
            className="flex items-center gap-1.5 flex-shrink-0 select-none group"
            aria-label="На главную"
          >
            <span className="text-sm font-heading font-extrabold tracking-[0.2em] text-white group-hover:text-accent-gold transition-colors duration-300">SPORT</span>
            <motion.span
              className="text-sm font-heading font-extrabold tracking-[0.2em] text-accent-gold"
              whileHover={{ scale: [1, 1.04, 1] }}
              transition={{ duration: 0.6, ease: 'easeInOut' }}
            >
              LOUNGE
            </motion.span>
          </NavLink>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center" aria-label="Основная навигация">
            {desktopNavItems.map(renderDesktopNavLink)}
            {user?.role === 'admin' && (
              <NavLink
                to="/admin"
                className={({ isActive }) => clsx(
                  'relative flex items-center gap-1 px-3 py-2 text-xs font-bold tracking-wide transition-all duration-300',
                  isActive ? 'text-accent-gold' : 'text-accent-gold/80 hover:text-accent-gold hover:scale-[1.02]'
                )}
              >
                <Crown className="w-3 h-3" />
                <span>Админ</span>
              </NavLink>
            )}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {isAuthenticated ? (
              <>
                <NavLink
                  to="/profile"
                  className="group hidden sm:flex items-center gap-2 text-xs font-semibold text-white/60 hover:text-accent-gold transition-all duration-300 focus-visible:ring-2 focus-visible:ring-accent-gold/50 focus-visible:outline-none rounded-lg px-2 py-1"
                  aria-label="Профиль"
                >
                  {user?.avatar ? (
                    <img
                      src={resolveImageUrl(user.avatar)}
                      alt={user.name}
                      className="w-6 h-6 rounded-full object-cover ring-1 ring-accent-gold/30 group-hover:ring-accent-gold/60 transition-all"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-accent-gold/20 flex items-center justify-center text-accent-gold text-[10px] font-bold">
                      {user?.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <span className="hidden xl:inline">{user?.name || 'Профиль'}</span>
                </NavLink>
                <motion.button
                  onClick={handleLogout}
                  className="p-2 rounded-full hover:bg-accent-burgundy/20 text-white/40 hover:text-accent-gold transition-all focus-visible:ring-2 focus-visible:ring-accent-gold/50 focus-visible:outline-none"
                  title="Выйти"
                  aria-label="Выйти"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={springFast}
                >
                  <LogOut className="w-4 h-4" />
                </motion.button>
              </>
            ) : (
              <NavLink
                to="/login"
                className="text-xs font-semibold text-white/60 hover:text-accent-gold transition-all duration-300 px-3 py-1.5 focus-visible:ring-2 focus-visible:ring-accent-gold/50 focus-visible:outline-none rounded-lg"
              >
                Sign In
              </NavLink>
            )}

            <NavLink to="/booking" aria-label="Сделать заказ">
              <motion.button
                className="accent-btn px-5 py-2 text-xs font-heading font-bold rounded-xl flex items-center gap-1.5"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                transition={springFast}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Заказ
              </motion.button>
            </NavLink>

            <motion.button
              ref={menuButtonRef}
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 text-white/60 hover:text-accent-gold transition-all focus-visible:ring-2 focus-visible:ring-accent-gold/50 focus-visible:outline-none rounded-lg"
              aria-label="Открыть меню"
              aria-expanded={mobileMenuOpen}
              whileTap={{ scale: 0.9 }}
            >
              <MenuIcon className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </header>

      {/* Mobile slide-in overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="fixed inset-0 z-[60] lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={ft || { duration: 0.2 }}
          >
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
              aria-hidden="true"
            />
            <motion.div
              className="absolute right-0 top-0 bottom-0 w-72 max-w-[85vw] bg-dark-surface/95 backdrop-blur-xl border-l border-glass-border shadow-2xl flex flex-col"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={springGentle}
              role="dialog"
              aria-modal="true"
              aria-label="Навигация"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-glass-border">
                <span className="text-sm font-heading font-bold tracking-wider text-accent-gold">Навигация</span>
                <motion.button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 text-white/60 hover:text-accent-gold transition-colors focus-visible:ring-2 focus-visible:ring-accent-gold/50 focus-visible:outline-none rounded-lg"
                  aria-label="Закрыть меню"
                  whileTap={{ scale: 0.9 }}
                >
                  <CloseIcon className="w-5 h-5" />
                </motion.button>
              </div>

              <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                {desktopNavItems.map((item) => {
                  if (item.to) {
                    const to = item.to === '/profile' && !isAuthenticated ? '/login' : item.to;
                    return (
                      <NavLink
                        key={item.label}
                        to={to}
                        end={item.to === '/'}
                        onClick={() => setMobileMenuOpen(false)}
                        className={({ isActive }) => clsx(
                          'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all',
                          isActive
                            ? 'text-accent-gold bg-accent-gold/10 border border-accent-gold/20'
                            : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
                        )}
                      >
                        <ChevronRightIcon className={clsx('w-3.5 h-3.5 transition-all', 'opacity-0 -ml-1')} />
                        {item.label}
                      </NavLink>
                    );
                  }
                  return (
                    <button
                      key={item.label}
                      onClick={() => { handleNavClick(item.hash!); setMobileMenuOpen(false); }}
                      className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm text-white/60 hover:text-white hover:bg-white/5 transition-all border border-transparent text-left"
                    >
                      <ChevronRightIcon className="w-3.5 h-3.5 opacity-0 -ml-1" />
                      {item.label}
                    </button>
                  );
                })}

                {user?.role === 'admin' && (
                  <>
                    <div className="h-px bg-gradient-to-r from-transparent via-accent-gold/20 to-transparent my-2" />
                    <NavLink
                      to="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) => clsx(
                        'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all',
                        isActive
                          ? 'text-accent-gold bg-accent-gold/10 border border-accent-gold/20'
                          : 'text-accent-gold/80 hover:text-accent-gold hover:bg-accent-gold/5 border border-transparent'
                      )}
                    >
                      <Crown className="w-4 h-4" />
                      Панель админа
                    </NavLink>
                  </>
                )}
              </nav>

              <div className="px-3 py-4 border-t border-glass-border">
                {isAuthenticated ? (
                  <div className="flex items-center gap-3 px-4 py-2">
                    {user?.avatar ? (
                      <img src={resolveImageUrl(user.avatar)} alt="" className="w-8 h-8 rounded-full object-cover ring-1 ring-accent-gold/30" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-accent-gold/20 flex items-center justify-center text-accent-gold text-xs font-bold">
                        {user?.name?.[0]?.toUpperCase() || 'U'}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                      <p className="text-[10px] text-white/40 truncate">{user?.email}</p>
                    </div>
                    <button onClick={handleLogout} className="p-1.5 text-white/30 hover:text-red-400 transition-colors" aria-label="Выйти">
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <NavLink
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-accent-gold/10 border border-accent-gold/25 text-accent-gold text-sm font-semibold hover:bg-accent-gold/20 transition-all"
                  >
                    <UserIcon className="w-4 h-4" />
                    Sign In
                  </NavLink>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content with page transitions */}
      <main className="max-w-6xl mx-auto px-4 lg:px-8 py-6 relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            {...pageTransition}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile bottom navigation */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 lg:hidden"
        aria-label="Мобильная навигация"
      >
        <motion.div
          className="bg-dark-surface/90 backdrop-blur-xl border-t border-glass-border"
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={springGentle}
        >
          <div className="max-w-lg mx-auto flex items-center justify-around px-1 py-1">
            {mobileTabs.map((tab) => {
              const to = getMobileTabTo(tab);
              const Icon = tab.icon;
              return (
                <NavLink
                  key={tab.label}
                  to={to}
                  end={tab.to === '/'}
                  className="relative flex-1 flex items-center justify-center"
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
                        <Icon className={clsx('w-5 h-5', isActive && 'drop-shadow-[0_0_6px_rgba(212,175,55,0.5)]')} />
                      </div>
                      <span className={clsx(
                        'text-[9px] font-heading font-semibold tracking-tight',
                        isActive ? 'text-accent-gold' : 'text-white/40'
                      )}>
                        {tab.label}
                      </span>
                      {isActive && (
                        <motion.div
                          className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent-gold shadow-[0_0_4px_rgba(212,175,55,0.6)]"
                          layoutId="mobileNavDot"
                          transition={springFast}
                        />
                      )}
                    </motion.div>
                  )}
                </NavLink>
              );
            })}
          </div>
        </motion.div>
      </nav>
    </div>
  );
}
