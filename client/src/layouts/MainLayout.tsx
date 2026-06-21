import { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut, Crown, Menu, X } from 'lucide-react';
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

const navItems = [
  { path: '/', label: 'Главная' },
  { path: '/booking', label: 'Заказ' },
  { path: '/profile', label: 'Профиль' },
];

export function MainLayout() {
  const { socket } = useSocket();
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const handleNavClick = (anchor: string) => {
    const base = import.meta.env.BASE_URL.replace(/\/$/, '');
    const currentPath = window.location.pathname;
    const isHomePage = currentPath === base || currentPath === base + '/' || currentPath === '/';
    if (!isHomePage) {
      navigate('/' + anchor);
    } else {
      const el = document.querySelector(anchor);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

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

  const handleLogout = () => { logout(); navigate('/'); };

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

      {/* Glass header */}
      <header className="sticky top-0 z-50">
        <div className="absolute inset-0 bg-dark-bg/70 backdrop-blur-glass border-b border-glass-border" />
        <div className="relative max-w-6xl mx-auto flex items-center justify-between px-4 lg:px-8 py-3 gap-4">

          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-1.5 flex-shrink-0 select-none group">
            <span className="text-sm font-heading font-extrabold tracking-[0.2em] text-white">SPORT</span>
            <span className="text-sm font-heading font-extrabold tracking-[0.2em] text-accent-gold">LOUNGE</span>
          </NavLink>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-8 flex-1 justify-center">
            <a onClick={(e) => { e.preventDefault(); handleNavClick('#menu'); }} className="text-xs font-medium text-white/60 hover:text-accent-gold transition-all tracking-wide cursor-pointer">Меню</a>
            <NavLink to="/booking" className={({ isActive }) => clsx("text-xs font-medium transition-all tracking-wide", isActive ? "text-accent-gold font-bold" : "text-white/60 hover:text-accent-gold")}>Сделать заказ</NavLink>
            <NavLink to="/booking" className={({ isActive }) => clsx("text-xs font-medium transition-all tracking-wide", isActive ? "text-accent-gold font-bold" : "text-white/60 hover:text-accent-gold")}>ИИ-Миксолог</NavLink>
            <a onClick={(e) => { e.preventDefault(); handleNavClick('#zones'); }} className="text-xs font-medium text-white/60 hover:text-accent-gold transition-all tracking-wide cursor-pointer">Зоны</a>
            <a onClick={(e) => { e.preventDefault(); handleNavClick('#contacts'); }} className="text-xs font-medium text-white/60 hover:text-accent-gold transition-all tracking-wide cursor-pointer">Контакты</a>
            {user?.role === 'admin' && (
              <NavLink to="/admin" className={({ isActive }) => clsx("text-xs font-bold transition-all tracking-wide flex items-center gap-1", isActive ? "text-accent-gold" : "text-accent-gold/80 hover:text-accent-gold")}>
                <Crown className="w-3 h-3" /> Панель админа
              </NavLink>
            )}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {isAuthenticated ? (
              <>
                <NavLink to="/profile" className="hidden sm:flex items-center gap-2 text-xs font-semibold text-white/60 hover:text-accent-gold transition-all">
                  {user?.avatar ? (
                    <img src={resolveImageUrl(user.avatar)} alt={user.name} className="w-5 h-5 rounded-full object-cover ring-1 ring-accent-gold/30" />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-accent-gold/20 flex items-center justify-center text-accent-gold text-[10px] font-bold">S</div>
                  )}
                  <span>{user?.name || 'Профиль'}</span>
                </NavLink>
                <button onClick={handleLogout} className="p-2 rounded-full hover:bg-accent-burgundy/20 text-white/40 hover:text-accent-gold transition-all" title="Выйти">
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <NavLink to="/login" className="text-xs font-semibold text-white/60 hover:text-accent-gold transition-all">Sign In</NavLink>
            )}

            <NavLink to="/booking">
              <motion.button
                className="gold-btn px-5 py-2 text-xs font-heading font-bold"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                Сделать заказ
              </motion.button>
            </NavLink>

            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden p-2 text-white/60 hover:text-accent-gold transition-all">
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:hidden bg-dark-surface/95 backdrop-blur-glass border-b border-glass-border"
          >
            <div className="px-4 py-4 space-y-3">
              {navItems.map(item => {
                const to = item.path === '/profile' && !isAuthenticated ? '/login' : item.path;
                return (
                  <NavLink key={item.path} to={to} end={item.path === '/'} onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) => clsx("block px-4 py-2.5 rounded-xl text-sm font-medium transition-all", isActive ? "text-accent-gold bg-accent-gold/5" : "text-white/60 hover:text-white hover:bg-white/5")}>
                    {item.label}
                  </NavLink>
                );
              })}
              <div className="gold-divider my-2" />
              <a onClick={(e) => { e.preventDefault(); handleNavClick('#menu'); setMobileMenuOpen(false); }} className="block px-4 py-2.5 rounded-xl text-sm text-white/60 hover:text-white transition-all cursor-pointer">Меню</a>
              <a onClick={(e) => { e.preventDefault(); handleNavClick('#zones'); setMobileMenuOpen(false); }} className="block px-4 py-2.5 rounded-xl text-sm text-white/60 hover:text-white transition-all cursor-pointer">Зоны</a>
              <a onClick={(e) => { e.preventDefault(); handleNavClick('#contacts'); setMobileMenuOpen(false); }} className="block px-4 py-2.5 rounded-xl text-sm text-white/60 hover:text-white transition-all cursor-pointer">Контакты</a>
            </div>
          </motion.div>
        )}
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 lg:px-8 py-6 relative z-10">
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden">
        <div className="bg-dark-surface/90 backdrop-blur-glass border-t border-glass-border">
          <div className="max-w-lg mx-auto flex items-center justify-around px-2 py-1.5">
            {navItems.map((item) => {
              const to = item.path === '/profile' && !isAuthenticated ? '/login' : item.path;
              return (
                <NavLink key={item.path} to={to} end={item.path === '/'} className="relative">
                  {({ isActive }) => (
                    <motion.div
                      className={clsx('flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-colors', isActive ? 'text-accent-gold' : 'text-white/40 hover:text-white/60')}
                      whileTap={{ scale: 0.9 }}
                    >
                      <span className={clsx("text-[10px] font-heading font-semibold", isActive ? "text-accent-gold" : "")}>{item.label}</span>
                      {isActive && (
                        <motion.div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-accent-gold" layoutId="activeNavDot" transition={{ type: 'spring', stiffness: 380, damping: 30 }} />
                      )}
                    </motion.div>
                  )}
                </NavLink>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}
