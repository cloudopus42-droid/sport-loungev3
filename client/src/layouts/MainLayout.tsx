import { useState, useEffect, useCallback, useRef } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Flame, UserCircle, Shield, LogOut, MapPin, MessageCircle, Search, Bell, Volume2, VolumeX } from 'lucide-react';
import clsx from 'clsx';
import { useSocket } from '@/hooks/useSocket';
import { useAuth } from '@/hooks/useAuth';
import { InvitationBanner } from '@/components/InvitationBanner';
import { CONTACT } from '@/config/seats';
import type { Invitation } from '@/types';
import { LuxuryCursor } from '@/components/ui/LuxuryCursor';
import { ParticleEngine } from '@/components/ui/ParticleEngine';
import { ConciergeChat } from '@/components/ui/ConciergeChat';
import { resolveImageUrl } from '@/lib/urls';
import { ThreeSmoke } from '@/components/ThreeSmoke';
import bowlImage from '@/bowl.png';

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
  const [searchQuery, setSearchQuery] = useState('');
  
  // Ambient Lounge Player
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const toggleMusic = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio('https://stream.sol.fm/lounge?direct=true');
      audioRef.current.loop = true;
      audioRef.current.volume = 0.25;
    }
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(err => console.log('Audio playback failed', err));
    }
    setIsPlaying(!isPlaying);
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  // Broadcast music play/pause status to canvas particle engine
  useEffect(() => {
    const event = new CustomEvent('lounge-music-status', { detail: { isPlaying } });
    window.dispatchEvent(event);
  }, [isPlaying]);

  const handleNewInvitation = useCallback((data: Invitation) => {
    setInvitation(data);
  }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on('invitation:published', handleNewInvitation);
    return () => { socket.off('invitation:published', handleNewInvitation); };
  }, [socket, handleNewInvitation]);

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <div className="min-h-screen pb-16 lg:pb-0 bg-[#080605] text-white relative">
      {/* Volumetric ambient gold fog & depth haze layers */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 bg-[#070504]">
        {/* Dynamic moving radial gold light spots */}
        <div className="absolute top-[-25%] left-[-15%] w-[80%] h-[80%] rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.08)_0%,transparent_70%)] blur-[100px] animate-haze-pulse" style={{ animationDuration: '14s' }} />
        <div className="absolute bottom-[-25%] right-[-15%] w-[85%] h-[85%] rounded-full bg-[radial-gradient(circle,rgba(138,102,35,0.07)_0%,transparent_70%)] blur-[110px] animate-haze-pulse" style={{ animationDuration: '20s' }} />
        <div className="absolute top-[35%] left-[20%] w-[70%] h-[70%] rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.04)_0%,transparent_75%)] blur-[120px]" />
        
        {/* Ambient smoke/mist overlay */}
        <div className="absolute inset-0 opacity-[0.06] mix-blend-screen bg-[url('https://assets.mixkit.co/videos/preview/mixkit-smoke-in-slow-motion-41814-large.mp4')] bg-cover" />
        
        {/* 3D WebGL Smoke Render - Drift across entire background */}
        <ThreeSmoke />

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

      {/* Volumetric hookah bowls in bottom corners (smoke origin) */}
      <div className="hidden md:block fixed bottom-[-15px] left-[-15px] w-28 lg:w-36 z-20 pointer-events-none opacity-50 select-none filter drop-shadow-[0_0_15px_rgba(212,175,55,0.25)]">
        <img 
          src={bowlImage} 
          alt="" 
          className="w-full h-auto object-contain" 
          style={{
            mixBlendMode: 'screen',
            maskImage: 'linear-gradient(to top, transparent 5%, black 40%)',
            WebkitMaskImage: 'linear-gradient(to top, transparent 5%, black 40%)'
          }}
        />
      </div>
      
      <div className="hidden md:block fixed bottom-[-15px] right-[-15px] w-28 lg:w-36 z-20 pointer-events-none opacity-50 select-none filter drop-shadow-[0_0_15px_rgba(212,175,55,0.25)]">
        <img 
          src={bowlImage} 
          alt="" 
          className="w-full h-auto object-contain scale-x-[-1]" 
          style={{
            mixBlendMode: 'screen',
            maskImage: 'linear-gradient(to top, transparent 5%, black 40%)',
            WebkitMaskImage: 'linear-gradient(to top, transparent 5%, black 40%)'
          }}
        />
      </div>
      <LuxuryCursor />
      <ParticleEngine />
      <ConciergeChat />
      {invitation && <InvitationBanner invitation={invitation} onClose={() => setInvitation(null)} />}

      {/* Top Luxury Header matching reference image */}
      <header className="sticky top-0 z-40 bg-dark-bg/85 backdrop-blur-glass border-b border-glass-border">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 lg:px-8 py-3.5 gap-4">
          
          {/* Logo / Admin label matching image */}
          <NavLink to="/" className="flex items-center gap-2 flex-shrink-0">
            <h1 className="text-xl sm:text-2xl font-display font-semibold text-white tracking-wide">
              {isAdmin ? 'Admin' : 'SPORT LOUNGE'}
            </h1>
          </NavLink>

          {/* Premium Search Bar in center (similar to reference image) */}
          <div className="hidden md:flex items-center flex-1 max-w-sm relative">
            <Search className="w-4 h-4 text-white/40 absolute left-3.5" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-1.5 text-sm text-white placeholder-white/35 bg-white/5 border border-glass-border rounded-full outline-none focus:border-accent-gold/40 focus:bg-white/10 transition-all"
            />
          </div>

          {/* Desktop Navigation Links / Action buttons (similar to reference image) */}
          <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
            
            <nav className="hidden lg:flex items-center gap-2">
              <NavLink to="/" end className={({ isActive }) => clsx(
                "text-xs sm:text-sm font-medium px-3 py-1.5 rounded-full transition-all",
                isActive ? "text-accent-gold bg-white/5 border border-accent-gold/25" : "text-white/60 hover:text-white hover:bg-white/5"
              )}>
                Главная
              </NavLink>
              <NavLink to="/booking" className={({ isActive }) => clsx(
                "text-xs sm:text-sm font-medium px-3 py-1.5 rounded-full transition-all",
                isActive ? "text-accent-gold bg-white/5 border border-accent-gold/25" : "text-white/60 hover:text-white hover:bg-white/5"
              )}>
                Заказ кальяна
              </NavLink>
              <NavLink to="/feed" className={({ isActive }) => clsx(
                "text-xs sm:text-sm font-medium px-3 py-1.5 rounded-full transition-all",
                isActive ? "text-accent-gold bg-white/5 border border-accent-gold/25" : "text-white/60 hover:text-white hover:bg-white/5"
              )}>
                Лента
              </NavLink>
              {isAdmin && (
                <NavLink to="/admin" className="text-xs sm:text-sm font-medium px-3 py-1.5 rounded-full text-white/60 hover:text-white hover:bg-white/5 flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-accent-gold" />
                  Панель
                </NavLink>
              )}
            </nav>

            {/* Premium Ambient Music Player */}
            <div className="flex items-center gap-2 cursor-pointer p-1.5 px-2.5 rounded-full hover:bg-white/5 transition-all select-none border border-glass-border/30 bg-white/5" onClick={toggleMusic} title="Включить Ambient Lounge">
              {isPlaying ? (
                <>
                  <Volume2 className="w-4 h-4 text-accent-gold animate-pulse animate-duration-1000" />
                  <div className="flex gap-0.5 items-end h-3 w-4">
                    <span className="w-0.5 bg-accent-gold soundwave-bar h-[70%] rounded-full" />
                    <span className="w-0.5 bg-accent-gold soundwave-bar h-[100%] rounded-full animate-delay-200" />
                    <span className="w-0.5 bg-accent-gold soundwave-bar h-[50%] rounded-full animate-delay-500" />
                    <span className="w-0.5 bg-accent-gold soundwave-bar h-[80%] rounded-full animate-delay-300" />
                  </div>
                </>
              ) : (
                <>
                  <VolumeX className="w-4 h-4 text-white/40" />
                  <span className="text-[10px] text-white/30 font-medium">Lounge</span>
                </>
              )}
            </div>

            {/* Notification Bell with animated red badge */}
            <div className="relative cursor-pointer p-2 rounded-full hover:bg-white/5 transition-colors">
              <Bell className="w-4 h-4 text-white/70 hover:text-white" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 shadow-glow-red animate-pulse" />
            </div>

            {/* Authentication Buttons matching reference image */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <NavLink to="/profile" className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-glass-border hover:bg-white/10 transition-all text-xs font-semibold text-white/80">
                  {user?.avatar ? (
                    <img src={resolveImageUrl(user.avatar)} alt={user.name} className="w-5 h-5 rounded-full object-cover" />
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

            {/* Float Book Order Pill Button matching reference image perfectly */}
            <NavLink to="/booking">
              <motion.button
                className="px-4 sm:px-5 py-1.5 sm:py-2 text-xs font-bold text-black bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 rounded-full shadow-gold-pill hover:shadow-glow-gold-lg transition-all flex items-center gap-1.5 border border-yellow-200/35"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
              >
                <Flame className="w-3.5 h-3.5 text-black" />
                <span>Заказать кальян</span>
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
      `}</style>
    </div>
  );
}
