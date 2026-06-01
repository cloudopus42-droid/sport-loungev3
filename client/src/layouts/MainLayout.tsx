import { useState, useEffect, useCallback } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut } from 'lucide-react';
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
import { LuxuryMusicPlayer } from '@/components/ui/LuxuryMusicPlayer';
import { showToast } from '@/components/NotificationToast';
import { GlowIcon } from '@/components/ui/GlowIcon';

const navItems = [
  { path: '/', iconName: 'home' as const, label: 'Главная' },
  { path: '/mixologist', iconName: 'flame' as const, label: 'Миксолог' },
  { path: '/booking', iconName: 'calendar' as const, label: 'Заказ' },
  { path: '/profile', iconName: 'user' as const, label: 'Профиль' },
];

export function MainLayout() {
  const { socket } = useSocket();
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [invitation, setInvitation] = useState<Invitation | null>(null);


  // Request browser push notification permission for guests/clients
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);



  // Listen to real-time hookah ready notifications matching current user ID
  useEffect(() => {
    if (!socket || !user) return;

    const handleHookahReady = (data: any) => {
      if (data.userId === user.id && data.hookahStatus === 'ready') {
        // Avoid duplicate notification if already notified in another session/tab
        try {
          const saved = localStorage.getItem('notified_bookings');
          const notifiedList: string[] = saved ? JSON.parse(saved) : [];
          if (notifiedList.includes(data.id)) return;

          notifiedList.push(data.id);
          localStorage.setItem('notified_bookings', JSON.stringify(notifiedList));
        } catch (err) {
          console.warn('LocalStorage error in notification check:', err);
        }

        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/911/911-200.wav');
        audio.volume = 0.55;
        audio.play().catch(() => {});

        showToast('Ваш кальян готов! Приятного покура! 💨', 'success');

        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification('SPORT LOUNGE', {
              body: 'Ваш кальян готов! Приятного покура! 💨',
              icon: '/icon-192.png'
            });
          } catch (err) {
            console.warn('Push alert failed:', err);
          }
        }
      }
    };

    socket.on('booking:updated', handleHookahReady);
    return () => {
      socket.off('booking:updated', handleHookahReady);
    };
  }, [socket, user]);

  const handleNavClick = (anchor: string) => {
    if (window.location.pathname !== '/') {
      navigate('/' + anchor);
    } else {
      const el = document.querySelector(anchor);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  
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
        
        {/* Floating Ambient Mesh Gradient Spheres */}
        <div className="float-sphere-1" />
        <div className="float-sphere-2" />
        <div className="float-sphere-3" />
        
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

      {/* Decorative luxury side margins for wide screens */}
      <div className="hidden xl:flex fixed left-8 top-1/2 -translate-y-1/2 flex-col items-center gap-6 z-20 pointer-events-none opacity-30 select-none">
        <span className="text-[10px] uppercase tracking-[0.6em] text-accent-gold font-semibold [writing-mode:vertical-lr] rotate-180">PREMIUM LOUNGE</span>
        <div className="w-[1px] h-32 bg-gradient-to-b from-accent-gold/40 to-transparent" />
      </div>
      
      <div className="hidden xl:flex fixed right-8 top-1/2 -translate-y-1/2 flex-col items-center gap-6 z-20 pointer-events-none opacity-40 select-none font-display text-xs">
        <div className="flex flex-col items-center gap-4 text-white/40">
          <span className="text-accent-gold border-b border-accent-gold pb-1 font-bold">01</span>
          <span>02</span>
          <span>03</span>
        </div>
        <div className="w-[1px] h-20 bg-gradient-to-t from-accent-gold/30 to-transparent" />
      </div>
      <ParticleEngine />
      <ConciergeChat />
      <LuxuryMusicPlayer />
      {invitation && <InvitationBanner invitation={invitation} onClose={() => setInvitation(null)} />}

      {/* Top Luxury Header matching reference image */}
      <header className="sticky top-0 z-40 bg-[#050308]/90 backdrop-blur-md border-b border-white/5">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 lg:px-8 py-4 gap-4">
          
          {/* Logo - bold clean wordmark */}
          <NavLink to="/" className="flex items-center gap-1.5 flex-shrink-0 select-none group">
            <span className="text-sm font-sans font-extrabold tracking-[0.2em] text-white">SPORT</span>
            <span className="text-sm font-sans font-extrabold tracking-[0.2em] text-accent-gold">LOUNGE</span>
          </NavLink>

          {/* Desktop Navigation Links - Centered (exactly 5 items matching Sellix structure) */}
          <nav className="hidden lg:flex items-center gap-8 flex-1 justify-center">
            <a 
              href="#menu" 
              onClick={(e) => { e.preventDefault(); handleNavClick('#menu'); }}
              className="text-xs font-medium text-white/70 hover:text-white transition-all tracking-wide"
            >
              Меню
            </a>
            <NavLink to="/booking" className={({ isActive }) => clsx(
              "text-xs font-medium transition-all tracking-wide",
              isActive ? "text-accent-gold font-bold" : "text-white/70 hover:text-white"
            )}>
              Цены
            </NavLink>
            <NavLink to="/mixologist" className={({ isActive }) => clsx(
              "text-xs font-medium transition-all tracking-wide",
              isActive ? "text-accent-gold font-bold" : "text-white/70 hover:text-white"
            )}>
              ИИ-Миксолог
            </NavLink>
            <a 
              href="#menu" 
              onClick={(e) => { e.preventDefault(); handleNavClick('#menu'); }}
              className="text-xs font-medium text-white/70 hover:text-white transition-all tracking-wide"
            >
              Зоны
            </a>
            <a 
              href="#contacts" 
              onClick={(e) => { e.preventDefault(); handleNavClick('#contacts'); }}
              className="text-xs font-medium text-white/70 hover:text-white transition-all tracking-wide"
            >
              Контакты
            </a>
          </nav>

          {/* Action buttons (Right side) - Instagram, Telegram & Auth / Book order */}
          <div className="flex items-center gap-3 sm:gap-5 flex-shrink-0">
            {/* Social Links (Instagram / Telegram) */}
            <div className="hidden sm:flex items-center gap-3">
              <a 
                href="https://www.instagram.com/sportloungehhs?igsh=bzRqeGM0a2ZsazM0" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-7 h-7 rounded-full border border-white/5 hover:border-white/20 flex items-center justify-center bg-white/5 text-white/60 hover:text-white transition-all" 
                title="Instagram"
              >
                <GlowIcon name="instagram" color="magenta" size={14} animateOnHover />
              </a>
              <a 
                href={CONTACT.telegramUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-7 h-7 rounded-full border border-white/5 hover:border-white/20 flex items-center justify-center bg-white/5 text-white/60 hover:text-white transition-all" 
                title="Telegram"
              >
                <GlowIcon name="send" color="cyan" size={14} animateOnHover />
              </a>
            </div>

            {/* Authentication text link */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <NavLink to="/profile" className="hidden sm:flex items-center gap-2 text-xs font-semibold text-white/70 hover:text-white transition-all">
                  {user?.avatar ? (
                    <img src={resolveImageUrl(user.avatar)} alt={user.name} className="w-4 h-4 rounded-full object-cover" />
                  ) : (
                    <GlowIcon name="user" color="purple" size={14} />
                  )}
                  <span>{user?.name || 'Профиль'}</span>
                </NavLink>
                <button onClick={handleLogout} className="p-2 rounded-full hover:bg-red-500/10 text-white/50 hover:text-red-400 transition-colors" title="Выйти">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <NavLink to="/login" className="text-xs font-semibold text-white/70 hover:text-white transition-all">
                Sign In
              </NavLink>
            )}

            {/* Make booking order button a premium white pill with dark text */}
            <NavLink to="/booking">
              <motion.button
                className="px-5 py-2 text-xs rounded-full bg-white hover:bg-white/90 text-[#050308] border-none font-extrabold shadow-[0_4px_16px_rgba(168,85,247,0.25)] transition-all flex items-center gap-1"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                Сделать заказ
              </motion.button>
            </NavLink>
          </div>
        </div>
      </header>

      {/* High-Tech Fintech Grid Lines in background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 opacity-[0.06]">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(168,85,247,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(168,85,247,0.08)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      {/* Background Tech Purple Particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {Array.from({ length: 14 }).map((_, i) => (
          <div
            key={i}
            className="purple-particle"
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
                      <GlowIcon name={item.iconName} size={20} color={isActive ? 'purple' : 'white'} glow={isActive} />
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
        .purple-particle {
          position: absolute;
          bottom: -20px;
          background: radial-gradient(circle, rgba(168,85,247,0.4) 0%, rgba(168,85,247,0) 70%);
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
