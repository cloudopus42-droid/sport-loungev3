import { useState, useEffect, useCallback, useRef } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Crown, LogOut, CalendarCheck, Sparkles
} from 'lucide-react';
import { HomeIcon, MenuIcon, UserIcon, CloseIcon } from '@/components/icons';
import clsx from 'clsx';
import { useSocket } from '@/hooks/useSocket';
import { SEO } from '@/components/SEO';
import { useAuth } from '@/hooks/useAuth';
import { InvitationBanner } from '@/components/InvitationBanner';
import type { Invitation } from '@/types';
import { ConciergeChat } from '@/components/ui/ConciergeChat';
import { NotificationCardStack } from '@/components/ui/NotificationCardStack';
import { CookieBanner } from '@/components/ui/CookieBanner';
import { SparkleParticles } from '@/components/ui/SparkleParticles';
import { VersionBadge } from '@/components/VersionBadge';
import { resolveImageUrl } from '@/lib/urls';
import { showToast } from '@/components/NotificationToast';
import { staggerContainer } from '@/lib/motion';



interface DesktopNavItem {
  label: string;
  to?: string;
  hash?: string;
}

const desktopNavItems: DesktopNavItem[] = [
  { label: 'Главная', to: '/' },
  { label: 'Заказ', to: '/order' },
];

interface MobileTab {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
}

const mobileTabs: MobileTab[] = [
  { label: 'Главная', to: '/', icon: HomeIcon },
  { label: 'Заказ', to: '/order', icon: CalendarCheck },
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

  const easeOut = [0.23, 1, 0.32, 1];
  const ft = prefersReducedMotion ? { duration: 0.01 } : undefined;
  const smoothFast = prefersReducedMotion
    ? { duration: 0.01 }
    : { duration: 0.35, ease: easeOut };
  const smoothGentle = prefersReducedMotion
    ? { duration: 0.01 }
    : { duration: 0.6, ease: easeOut };

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
            'relative px-3 py-2 font-mono text-[10px] uppercase tracking-[0.15em] transition-all duration-300',
            isActive ? 'text-white' : 'text-white/40 hover:text-white/60'
          )}
        >
          {({ isActive }) => (
            <>
              <span className="relative z-10">{item.label}</span>
              {isActive && (
                <motion.div
                  layoutId="nav-underline"
                  className="absolute bottom-0 left-2 right-2 h-px bg-white/30"
                  transition={smoothFast}
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
        className="relative px-3 py-2 font-mono text-[10px] uppercase tracking-[0.15em] text-white/40 hover:text-white/60 transition-all duration-300 cursor-pointer"
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
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: easeOut } },
        exit: { opacity: 0, y: -12, transition: { duration: 0.2, ease: easeOut } },
      };

  return (
    <div className="min-h-screen pb-20 lg:pb-0 relative bg-[#1a1815] text-white">
      <SEO />
      <SparkleParticles count={8} />

      <ConciergeChat />
      <NotificationCardStack />
      <CookieBanner />
      {invitation && <InvitationBanner invitation={invitation} onClose={() => setInvitation(null)} />}

      {/* Hairline top accent */}
      <div className="fixed top-0 left-0 right-0 z-[60] h-px bg-white/5 pointer-events-none" />

      {/* Desktop & Mobile Header — instrument-panel style */}
      <header className="sticky top-0 z-50">
        <div className="absolute inset-0 bg-[#1a1815]/90 backdrop-blur-xl border-b border-white/5" />
        <div className="relative max-w-6xl mx-auto flex items-center justify-between px-4 lg:px-8 py-3 gap-4">

          {/* Logo — minimal label */}
          <NavLink
            to="/"
            className="flex items-center gap-1.5 flex-shrink-0 select-none group"
            aria-label="На главную"
          >
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/60 group-hover:text-white transition-colors duration-300">SPORT</span>
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-white">LOUNGE</span>
          </NavLink>

          {/* Desktop nav — monospace labels with hairline connector */}
          <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center" aria-label="Основная навигация">
            {desktopNavItems.map(renderDesktopNavLink)}
            {user?.role === 'admin' && (
              <NavLink
                to="/admin"
                className={({ isActive }) => clsx(
                  'relative flex items-center gap-1 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.15em] transition-all duration-300',
                  isActive ? 'text-white' : 'text-white/40 hover:text-white/60'
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
                  className="group hidden sm:flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.15em] text-white/40 hover:text-white transition-all duration-300 px-2 py-1"
                  aria-label="Профиль"
                >
                  {user?.avatar ? (
                    <img
                      src={resolveImageUrl(user.avatar)}
                      alt={user.name}
                      className="w-5 h-5 rounded-full object-cover border border-white/10 group-hover:border-white/30 transition-all"
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-white/60 text-[8px] font-bold">
                      {user?.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <span className="hidden xl:inline">{user?.name || 'Профиль'}</span>
                </NavLink>
                <button
                  onClick={handleLogout}
                  className="p-2 text-white/30 hover:text-white/60 transition-all"
                  title="Выйти"
                  aria-label="Выйти"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <NavLink
                to="/login"
                className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/40 hover:text-white transition-all duration-300 px-3 py-1.5"
              >
                Войти
              </NavLink>
            )}

            <NavLink to="/order" aria-label="Сделать заказ"
              className="btn-primary px-4 py-1.5 text-[10px] font-mono uppercase tracking-wider flex items-center gap-1.5"
            >
              <Sparkles className="w-3 h-3" />
              Заказ
            </NavLink>

            <button
              ref={menuButtonRef}
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 text-white/40 hover:text-white transition-all"
              aria-label="Открыть меню"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
            >
              <MenuIcon className="w-4 h-4" />
            </button>
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
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
              aria-hidden="true"
            />
            <motion.div
              className="absolute right-0 top-0 bottom-0 w-72 max-w-[85vw] bg-[#1a1815]/95 backdrop-blur-xl border-l border-white/5 shadow-2xl flex flex-col"
              id="mobile-menu"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={smoothGentle}
              role="dialog"
              aria-modal="true"
              aria-label="Навигация"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/40">Навигация</span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-3 text-white/40 hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label="Закрыть меню"
                >
                  <CloseIcon className="w-4 h-4" />
                </button>
              </div>

              <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Мобильное меню">
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
                          'flex items-center gap-3 px-4 py-3 font-mono text-[11px] uppercase tracking-wider transition-all',
                          isActive
                            ? 'text-white bg-white/5 border border-white/10'
                            : 'text-white/40 hover:text-white/60 hover:bg-white/3 border border-transparent'
                        )}
                      >
                        {item.label}
                      </NavLink>
                    );
                  }
                  return (
                    <button
                      key={item.label}
                      onClick={() => { handleNavClick(item.hash!); setMobileMenuOpen(false); }}
                      className="flex items-center gap-3 w-full px-4 py-3 font-mono text-[11px] uppercase tracking-wider text-white/40 hover:text-white/60 hover:bg-white/3 transition-all border border-transparent text-left"
                    >
                      {item.label}
                    </button>
                  );
                })}

                {user?.role === 'admin' && (
                  <>
                    <div className="h-px bg-white/5 my-2" />
                    <NavLink
                      to="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) => clsx(
                        'flex items-center gap-3 px-4 py-3 font-mono text-[11px] uppercase tracking-wider transition-all',
                        isActive
                          ? 'text-white bg-white/5 border border-white/10'
                          : 'text-white/40 hover:text-white/60 border border-transparent'
                      )}
                    >
                      <Crown className="w-3.5 h-3.5" />
                      Панель админа
                    </NavLink>
                  </>
                )}
              </nav>

              <div className="px-3 py-4 border-t border-white/5">
                {isAuthenticated ? (
                  <div className="flex items-center gap-3 px-4 py-2">
                    {user?.avatar ? (
                      <img src={resolveImageUrl(user.avatar)} alt="" className="w-7 h-7 rounded-full object-cover border border-white/10" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white/60 text-[9px] font-bold">
                        {user?.name?.[0]?.toUpperCase() || 'U'}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-[11px] text-white/60 truncate">{user?.name}</p>
                      <p className="font-mono text-[10px] text-white/30 truncate">{user?.email}</p>
                    </div>
                    <button onClick={handleLogout} className="p-3 text-white/20 hover:text-red-400 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center" aria-label="Выйти">
                      <LogOut className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <NavLink
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 w-full px-4 py-2.5 border border-white/10 text-white/40 font-mono text-[11px] uppercase tracking-wider hover:text-white hover:border-white/20 transition-all"
                  >
                    <UserIcon className="w-3.5 h-3.5" />
                    Войти
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
            variants={staggerContainer}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile bottom navigation — minimal pill */}
      <nav
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 lg:hidden w-auto"
        style={{ bottom: 'max(1rem, calc(env(safe-area-inset-bottom) + 0.5rem))' }}
        aria-label="Мобильная навигация"
      >
        <motion.div
          className="relative rounded-full bg-[#1a1815]/80 backdrop-blur-[20px] border border-white/5 overflow-hidden"
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={smoothGentle}
        >
          <div className="relative flex items-center justify-around px-2 py-1.5 gap-0.5">
            {mobileTabs.map((tab) => {
              const to = getMobileTabTo(tab);
              const Icon = tab.icon;
              return (
                <NavLink
                  key={tab.label}
                  to={to}
                  end={tab.to === '/'}
                  className="relative flex items-center justify-center"
                  aria-label={tab.label}
                >
                  {({ isActive }) => (
                    <div
                      className={clsx(
                        'flex flex-col items-center justify-center gap-0.5 min-h-[44px] min-w-[52px] rounded-xl transition-colors',
                        isActive ? 'text-white' : 'text-white/30 hover:text-white/50'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      <span className={clsx(
                        'font-mono text-[9px] uppercase tracking-wider',
                        isActive ? 'text-white' : 'text-white/30'
                      )}>
                        {tab.label}
                      </span>
                      {isActive && (
                        <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white/60" />
                      )}
                    </div>
                  )}
                </NavLink>
              );
            })}
          </div>
        </motion.div>
      </nav>

      <VersionBadge />
    </div>
  );
}
