import { useState, useEffect, useCallback } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Flame, UserCircle, Shield, LogOut, MapPin, MessageCircle, Instagram, Send } from 'lucide-react';
import clsx from 'clsx';
import { useSocket } from '@/hooks/useSocket';
import { useAuth } from '@/hooks/useAuth';
import { InvitationBanner } from '@/components/InvitationBanner';
import { CONTACT } from '@/config/seats';
import type { Invitation } from '@/types';
import { ParticleEngine } from '@/components/ui/ParticleEngine';
import { ConciergeChat } from '@/components/ui/ConciergeChat';
import { resolveImageUrl } from '@/lib/urls';
import { ThreeSmoke } from '@/components/ThreeSmoke';
import girlsImage from '../girls.png';
import premiumHookah from '../premium_hookah.png';
import { LuxuryMusicPlayer } from '@/components/ui/LuxuryMusicPlayer';

const navItems = [
  { path: '/', icon: Home, label: 'Главная' },
  { path: '/booking', icon: Flame, label: 'Заказ' },
  { path: '/feed', icon: MessageCircle, label: 'Лента' },
  { path: '/profile', icon: UserCircle, label: 'Профиль' },
];

export function MainLayout() {
  const { socket } = useSocket();
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const navigate = useNavigate();
  const [invitation, setInvitation] = useState<Invitation | null>(null);

  
  // Ambient Lounge Player state and audio references are now managed by LuxuryMusicPlayer component

  const handleNewInvitation = useCallback((data: Invitation) => {
    setInvitation(data);
  }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on('invitation:published', handleNewInvitation);
    return () => { socket.off('invitation:published', handleNewInvitation); };
  }, [socket, handleNewInvitation]);

  // Emit user:active heartbeat to socket when authenticated
  useEffect(() => {
    if (socket && isAuthenticated && user) {
      socket.emit('user:active', {
        id: user.id,
        name: user.name,
        role: user.role,
      });
    }
  }, [socket, isAuthenticated, user]);

  // Load and apply custom glassmorphism settings from localStorage
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
    <div className="min-h-screen pb-16 lg:pb-0 bg-[#080605] text-white relative">
      {/* Volumetric ambient gold fog & depth haze layers */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 bg-[#070504]">
        {/* Dynamic moving radial gold & neon light spots for Liquid Glass refraction */}
        <div className="absolute top-[-25%] left-[-15%] w-[80%] h-[80%] rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.08)_0%,transparent_70%)] blur-[100px] animate-haze-pulse" style={{ animationDuration: '14s' }} />
        <div className="absolute bottom-[-25%] right-[-15%] w-[85%] h-[85%] rounded-full bg-[radial-gradient(circle,rgba(138,102,35,0.07)_0%,transparent_70%)] blur-[110px] animate-haze-pulse" style={{ animationDuration: '20s' }} />
        <div className="absolute top-[35%] left-[20%] w-[70%] h-[70%] rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.04)_0%,transparent_75%)] blur-[120px]" />
        
        {/* Liquid Glass Neon Glow spots */}
        <div className="absolute top-[10%] left-[60%] w-[55%] h-[55%] rounded-full bg-[radial-gradient(circle,rgba(6,182,212,0.18)_0%,transparent_70%)] blur-[120px] animate-haze-pulse" style={{ animationDuration: '18s' }} />
        <div className="absolute bottom-[15%] left-[5%] w-[50%] h-[50%] rounded-full bg-[radial-gradient(circle,rgba(217,70,239,0.16)_0%,transparent_70%)] blur-[110px] animate-haze-pulse" style={{ animationDuration: '16s' }} />
        <div className="absolute top-[50%] left-[35%] w-[45%] h-[45%] rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.14)_0%,transparent_70%)] blur-[130px] animate-haze-pulse" style={{ animationDuration: '22s' }} />
        
        {/* Ambient smoke/mist overlay */}
        <div className="absolute inset-0 opacity-[0.06] mix-blend-screen bg-[url('https://assets.mixkit.co/videos/preview/mixkit-smoke-in-slow-motion-41814-large.mp4')] bg-cover" />
        
        {/* 3D WebGL Smoke Render - Drift across entire background */}
        <ThreeSmoke />

        {/* Centered Premium Custom Girls Background (GTA Style Artwork) */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.20] mix-blend-screen pointer-events-none z-0">
          <div className="relative w-full max-w-4xl aspect-[3/2] px-4 flex items-center justify-center">
            <img 
              src={girlsImage} 
              alt="Cyber Lounge Girls" 
              className="w-full h-full object-contain filter drop-shadow-[0_0_35px_rgba(212,175,55,0.25)] animate-breathe-image"
              style={{
                WebkitMaskImage: 'radial-gradient(ellipse at center, rgba(0,0,0,1) 20%, rgba(0,0,0,0.75) 42%, rgba(0,0,0,0) 55%)',
                maskImage: 'radial-gradient(ellipse at center, rgba(0,0,0,1) 20%, rgba(0,0,0,0.75) 42%, rgba(0,0,0,0) 55%)',
              }}
            />

            {/* Volumetric Exhale Smoke Clouds at girls' mouths */}
            <div className="absolute" style={{ left: '41.5%', top: '47.8%' }}>
              <div className="smoke-exhale-left absolute w-6 h-6 bg-white/20 rounded-full blur-[5px]" style={{ animationDelay: '2.5s' }} />
              <div className="smoke-exhale-left absolute w-9 h-9 bg-white/15 rounded-full blur-[7px]" style={{ animationDelay: '2.9s' }} />
              <div className="smoke-exhale-left absolute w-12 h-12 bg-white/10 rounded-full blur-[9px]" style={{ animationDelay: '3.3s' }} />
            </div>

            <div className="absolute" style={{ left: '59.5%', top: '50%' }}>
              <div className="smoke-exhale-right absolute w-6 h-6 bg-white/20 rounded-full blur-[5px]" style={{ animationDelay: '5.5s' }} />
              <div className="smoke-exhale-right absolute w-9 h-9 bg-white/15 rounded-full blur-[7px]" style={{ animationDelay: '5.9s' }} />
              <div className="smoke-exhale-right absolute w-12 h-12 bg-white/10 rounded-full blur-[9px]" style={{ animationDelay: '6.3s' }} />
            </div>
          </div>
        </div>

        {/* CSS Volumetric Haze Layers */}
        <div className="absolute inset-0 opacity-[0.08] mix-blend-color-dodge">
          <div className="absolute w-[200%] h-[200%] top-[-50%] left-[-50%] bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.12)_0%,transparent_60%)] animate-haze-float pointer-events-none" />
          <div className="absolute w-[180%] h-[180%] top-[-40%] left-[-40%] bg-[radial-gradient(circle_at_center,rgba(138,102,35,0.08)_0%,transparent_70%)] animate-haze-float-reverse pointer-events-none" />
        </div>
      </div>

      {/* Decorative luxury side margins for wide screens (fill empty space) */}
      <div className="hidden xl:flex fixed left-8 top-1/2 -translate-y-1/2 flex-col items-center gap-6 z-20 pointer-events-none opacity-25 select-none">
        <span className="text-[10px] uppercase tracking-[0.6em] text-accent-gold font-semibold [writing-mode:vertical-lr] rotate-180">SPORT LOUNGE</span>
        <div className="w-[1px] h-32 bg-gradient-to-b from-accent-gold/40 to-transparent" />
      </div>
      
      <div className="hidden xl:flex fixed right-8 top-1/2 -translate-y-1/2 flex-col items-center gap-6 z-20 pointer-events-none opacity-25 select-none">
        <div className="w-[1px] h-32 bg-gradient-to-t from-accent-gold/40 to-transparent" />
        <span className="text-[10px] uppercase tracking-[0.6em] text-accent-gold font-semibold [writing-mode:vertical-lr]">PREMIUM 24/7</span>
      </div>

      {/* Side Hookahs matching the premium user upload */}
      <div className="hidden xl:block fixed left-4 bottom-0 z-20 pointer-events-none opacity-[0.24] select-none h-[75vh] w-64 filter drop-shadow-[0_0_25px_rgba(212,175,55,0.22)]">
        <img src={premiumHookah} alt="Premium Hookah Left" className="h-full w-full object-contain" />
      </div>

      <div className="hidden xl:block fixed right-4 bottom-0 z-20 pointer-events-none opacity-[0.24] select-none h-[75vh] w-64 filter drop-shadow-[0_0_25px_rgba(212,175,55,0.22)] scale-x-[-1]">
        <img src={premiumHookah} alt="Premium Hookah Right" className="h-full w-full object-contain" />
      </div>
      <ParticleEngine />
      <ConciergeChat />
      <LuxuryMusicPlayer />
      {invitation && <InvitationBanner invitation={invitation} onClose={() => setInvitation(null)} />}

      {/* Top Luxury Header matching reference image */}
      <header className="sticky top-0 z-40 bg-dark-bg/85 backdrop-blur-glass border-b border-glass-border/30">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 lg:px-8 py-3.5 gap-4">
          
          {/* Logo / Admin label matching image */}
          <NavLink to="/" className="flex items-center gap-2 flex-shrink-0">
            <h1 className="text-xl sm:text-2xl font-display font-semibold text-white tracking-wide uppercase">
              {isAdmin ? 'Admin' : 'SPORT LOUNGE'}
            </h1>
          </NavLink>

          {/* Desktop Navigation Links - Centered */}
          <nav className="hidden lg:flex items-center gap-6 flex-1 justify-center">
            <NavLink to="/" end className={({ isActive }) => clsx(
              "text-xs sm:text-sm font-medium transition-all",
              isActive ? "text-accent-gold" : "text-white/60 hover:text-white"
            )}>
              Главная
            </NavLink>
            <NavLink to="/booking" className={({ isActive }) => clsx(
              "text-xs sm:text-sm font-medium transition-all",
              isActive ? "text-accent-gold" : "text-white/60 hover:text-white"
            )}>
              Заказ кальяна
            </NavLink>
            <a href="#menu" className="text-xs sm:text-sm font-medium text-white/60 hover:text-white transition-all">
              Меню
            </a>
            <a href="#events" className="text-xs sm:text-sm font-medium text-white/60 hover:text-white transition-all">
              Мероприятия
            </a>
            <a href="#contacts" className="text-xs sm:text-sm font-medium text-white/60 hover:text-white transition-all">
              Контакты
            </a>
            {isAdmin && (
              <NavLink to="/admin" className="text-xs sm:text-sm font-medium text-white/60 hover:text-white flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-accent-gold" />
                Панель
              </NavLink>
            )}
          </nav>

          {/* Action buttons (Right side) - Instagram, Telegram & Auth / Book order */}
          <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
            {/* Social Links (Instagram / Telegram) matching reference */}
            <div className="hidden sm:flex items-center gap-2">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full hover:bg-white/5 text-white/60 hover:text-white transition-colors" title="Instagram">
                <Instagram className="w-4 h-4" />
              </a>
              <a href={CONTACT.telegramUrl} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full hover:bg-white/5 text-white/60 hover:text-white transition-colors" title="Telegram">
                <Send className="w-4 h-4" />
              </a>
            </div>

            {/* Authentication Buttons */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <NavLink to="/profile" className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-glass-border hover:bg-white/10 transition-all text-xs font-medium text-white/80">
                  {user?.avatar ? (
                    <img src={resolveImageUrl(user.avatar)} alt={user.name} className="w-4 h-4 rounded-full object-cover" />
                  ) : (
                    <UserCircle className="w-4 h-4 text-accent-gold" />
                  )}
                  <span>{user?.name || 'Профиль'}</span>
                </NavLink>
                <button onClick={handleLogout} className="p-2 rounded-full hover:bg-red-500/10 text-white/50 hover:text-red-400 transition-colors" title="Выйти">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <NavLink to="/login" className="px-4 py-1.5 text-xs font-semibold text-white/80 hover:text-white border border-glass-border rounded-full hover:bg-white/5 transition-all">
                Sign In
              </NavLink>
            )}

            {/* Book order button */}
            <NavLink to="/booking">
              <motion.button
                className="px-4 py-1.5 text-xs rounded-full border border-accent-gold text-accent-gold hover:bg-accent-gold hover:text-black transition-all font-medium"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
              >
                Заказать кальян
              </motion.button>
            </NavLink>
          </div>
        </div>

        {/* Address bar under header */}
        <div className="max-w-6xl mx-auto px-4 lg:px-8 pb-2">
          <div className="flex items-center gap-1.5 text-[10px] text-white/30">
            <MapPin className="w-3 h-3 flex-shrink-0 text-accent-gold" />
            <span>{CONTACT.address} • 24/7 Premium Lounge</span>
          </div>
        </div>
      </header>

      {/* Background Golden Particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {Array.from({ length: 14 }).map((_, i) => (
          <div
            key={i}
            className="gold-particle"
            style={{
              left: `${Math.random() * 100}%`,
              width: `${4 + Math.random() * 10}px`,
              height: `${4 + Math.random() * 10}px`,
              animationDelay: `${Math.random() * 12}s`,
              animationDuration: `${14 + Math.random() * 10}s`,
            }}
          />
        ))}
      </div>

      {/* Main Content - responsive width */}
      <main className="max-w-6xl mx-auto px-4 lg:px-8 py-6 relative z-10">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
        <div className="bg-dark-surface/90 backdrop-blur-glass border-t border-glass-border">
          <div className="max-w-lg mx-auto flex items-center justify-around px-2 py-1.5">
            {navItems.map((item) => {
              const to = item.path === '/profile' && !isAuthenticated ? '/login' : item.path;
              return (
                <NavLink key={item.path} to={to} end={item.path === '/'} className="relative">
                  {({ isActive }) => (
                    <motion.div
                      className={clsx(
                        'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors',
                        isActive ? 'text-accent-gold' : 'text-white/40 hover:text-white/60'
                      )}
                      whileTap={{ scale: 0.9 }}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="text-[10px] font-medium">{item.label}</span>
                      {isActive && (
                        <motion.div
                          className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent-gold shadow-glow-gold"
                          layoutId="activeNavDot"
                          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                        />
                      )}
                    </motion.div>
                  )}
                </NavLink>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Local embedded styles for soundwave, gold particles, and haze */}
      <style>{`
        @keyframes soundwave {
          0%, 100% { transform: scaleY(0.3); }
          50% { transform: scaleY(1); }
        }
        .soundwave-bar {
          animation: soundwave 1.2s ease-in-out infinite;
          transform-origin: bottom;
        }
        .soundwave-bar:nth-child(2) { animation-delay: 0.25s; }
        .soundwave-bar:nth-child(3) { animation-delay: 0.5s; }
        .soundwave-bar:nth-child(4) { animation-delay: 0.15s; }

        @keyframes float-particle {
          0% { transform: translateY(110vh) translateX(0) scale(0.6); opacity: 0; }
          40% { opacity: 0.5; }
          80% { opacity: 0.3; }
          100% { transform: translateY(-10vh) translateX(60px) scale(1.1); opacity: 0; }
        }
        .gold-particle {
          position: absolute;
          bottom: -20px;
          background: radial-gradient(circle, rgba(212,175,55,0.4) 0%, rgba(212,175,55,0) 70%);
          border-radius: 50%;
          pointer-events: none;
          animation: float-particle 15s linear infinite;
        }

        @keyframes haze-float {
          0% { transform: translate(0, 0) rotate(0deg) scale(1); }
          50% { transform: translate(-3%, 3%) rotate(180deg) scale(1.08); }
          100% { transform: translate(0, 0) rotate(360deg) scale(1); }
        }
        @keyframes haze-float-reverse {
          0% { transform: translate(0, 0) rotate(360deg) scale(1.08); }
          50% { transform: translate(3%, -3%) rotate(180deg) scale(0.96); }
          100% { transform: translate(0, 0) rotate(0deg) scale(1.08); }
        }
        @keyframes haze-pulse {
          0%, 100% { opacity: 0.75; }
          50% { opacity: 1; }
        }
        .animate-haze-float {
          animation: haze-float 45s linear infinite;
        }
        .animate-haze-float-reverse {
          animation: haze-float-reverse 60s linear infinite;
        }
        .animate-haze-pulse {
          animation: haze-pulse 12s ease-in-out infinite;
        }

        /* Hookah Inhale & Exhale Animations */
        @keyframes hose-flow-left-anim {
          0% { stroke-dashoffset: 0; opacity: 0; }
          5% { opacity: 1; }
          35% { stroke-dashoffset: -400; opacity: 1; }
          40%, 100% { stroke-dashoffset: -400; opacity: 0; }
        }
        .animate-hose-flow-left {
          animation: hose-flow-left-anim 6s linear infinite;
        }

        @keyframes hose-flow-right-anim {
          0%, 50% { stroke-dashoffset: 0; opacity: 0; }
          55% { opacity: 1; }
          85% { stroke-dashoffset: -400; opacity: 1; }
          90%, 100% { stroke-dashoffset: -400; opacity: 0; }
        }
        .animate-hose-flow-right {
          animation: hose-flow-right-anim 6s linear infinite;
        }

        /* --- Left/Right Hookah Coals Glow --- */
        @keyframes coal-glow-left-anim {
          0% { fill: #8B0000; filter: drop-shadow(0 0 0px transparent); }
          20%, 40% { fill: #FF4500; filter: drop-shadow(0 0 8px #FF8C00); }
          60%, 100% { fill: #8B0000; filter: drop-shadow(0 0 0px transparent); }
        }
        .coal-glow-left {
          animation: coal-glow-left-anim 6s infinite ease-in-out;
        }

        @keyframes coal-glow-right-anim {
          0%, 50% { fill: #8B0000; filter: drop-shadow(0 0 0px transparent); }
          70%, 90% { fill: #FF4500; filter: drop-shadow(0 0 8px #FF8C00); }
          95%, 100% { fill: #8B0000; filter: drop-shadow(0 0 0px transparent); }
        }
        .coal-glow-right {
          animation: coal-glow-right-anim 6s infinite ease-in-out;
        }

        /* --- Left/Right Hookah Bubbles --- */
        @keyframes bubble-rise-left-anim {
          0% { transform: translateY(50px) scale(0.3); opacity: 0; }
          10% { opacity: 0.8; }
          35% { transform: translateY(0px) scale(1.1); opacity: 0.8; }
          40%, 100% { transform: translateY(0px) scale(1.1); opacity: 0; }
        }
        .bubble-left-1 { animation: bubble-rise-left-anim 6s infinite ease-in; animation-delay: 0.1s; }
        .bubble-left-2 { animation: bubble-rise-left-anim 6s infinite ease-in; animation-delay: 0.5s; }
        .bubble-left-3 { animation: bubble-rise-left-anim 6s infinite ease-in; animation-delay: 0.9s; }
        .bubble-left-4 { animation: bubble-rise-left-anim 6s infinite ease-in; animation-delay: 1.3s; }
        .bubble-left-5 { animation: bubble-rise-left-anim 6s infinite ease-in; animation-delay: 1.7s; }

        @keyframes bubble-rise-right-anim {
          0%, 50% { transform: translateY(50px) scale(0.3); opacity: 0; }
          60% { opacity: 0.8; }
          85% { transform: translateY(0px) scale(1.1); opacity: 0.8; }
          90%, 100% { transform: translateY(0px) scale(1.1); opacity: 0; }
        }
        .bubble-right-1 { animation: bubble-rise-right-anim 6s infinite ease-in; animation-delay: 0.1s; }
        .bubble-right-2 { animation: bubble-rise-right-anim 6s infinite ease-in; animation-delay: 0.5s; }
        .bubble-right-3 { animation: bubble-rise-right-anim 6s infinite ease-in; animation-delay: 0.9s; }
        .bubble-right-4 { animation: bubble-rise-right-anim 6s infinite ease-in; animation-delay: 1.3s; }
        .bubble-right-5 { animation: bubble-rise-right-anim 6s infinite ease-in; animation-delay: 1.7s; }

        /* --- Background Image Breathing --- */
        @keyframes breathe-image-anim {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 0 35px rgba(212,175,55,0.25)) brightness(1); }
          50% { transform: scale(1.02); filter: drop-shadow(0 0 45px rgba(212,175,55,0.35)) brightness(1.05); }
        }
        .animate-breathe-image {
          animation: breathe-image-anim 8s infinite ease-in-out;
        }

        /* --- Left/Right Smoke Clouds --- */
        @keyframes smoke-cloud-left {
          0% {
            transform: translate(0, 0) scale(0.2);
            opacity: 0;
          }
          5% {
            opacity: 0.75;
            filter: blur(4px);
          }
          60% {
            transform: translate(-70px, -100px) scale(2.2);
            opacity: 0.45;
            filter: blur(12px);
          }
          100% {
            transform: translate(-120px, -170px) scale(3.5);
            opacity: 0;
            filter: blur(22px);
          }
        }
        .smoke-exhale-left {
          animation: smoke-cloud-left 6s ease-out infinite;
        }

        @keyframes smoke-cloud-right {
          0% {
            transform: translate(0, 0) scale(0.2);
            opacity: 0;
          }
          5% {
            opacity: 0.75;
            filter: blur(4px);
          }
          60% {
            transform: translate(70px, -100px) scale(2.2);
            opacity: 0.45;
            filter: blur(12px);
          }
          100% {
            transform: translate(120px, -170px) scale(3.5);
            opacity: 0;
            filter: blur(22px);
          }
        }
        .smoke-exhale-right {
          animation: smoke-cloud-right 6s ease-out infinite;
        }
      `}</style>
    </div>
  );
}
