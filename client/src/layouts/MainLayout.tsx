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
import girlsImage from '../girls.png';
import speedDialMusic from '../zero-7-speed-dial.mp3';

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
  const [dimensions, setDimensions] = useState({ width: 1200, height: 800 });

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { width, height } = dimensions;

  // Calculate centered girls container dimensions to find lips coordinate in screen-space (3:2 aspect ratio)
  const containerWidth = Math.min(width, 896);
  const containerHeight = containerWidth * (493 / 740);
  const containerLeft = (width - containerWidth) / 2;
  const containerTop = (height - containerHeight) / 2;

  // Left girl's mouth is at 41.5% of container width, 47.8% of container height
  const leftEnd = {
    x: containerLeft + 0.415 * containerWidth,
    y: containerTop + 0.478 * containerHeight
  };

  // Right girl's mouth is at 59.5% of container width, 50% of container height
  const rightEnd = {
    x: containerLeft + 0.595 * containerWidth,
    y: containerTop + 0.50 * containerHeight
  };

  // Large Hookahs are positioned at left-6 (24px) and right-6 (24px).
  // Port is relative at x=160 (going to the right) inside the 280px width hookah frame.
  const leftStart = { x: 24 + 160, y: height - 270 };
  const rightStart = { x: width - (24 + 160), y: height - 270 };

  const leftPath = `M ${leftStart.x} ${leftStart.y} C ${leftStart.x + 220} ${leftStart.y + 220}, ${leftEnd.x - 220} ${leftEnd.y + 220}, ${leftEnd.x} ${leftEnd.y}`;
  const rightPath = `M ${rightStart.x} ${rightStart.y} C ${rightStart.x - 220} ${rightStart.y + 220}, ${rightEnd.x + 220} ${rightEnd.y + 220}, ${rightEnd.x} ${rightEnd.y}`;

  
  // Ambient Lounge Player
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const toggleMusic = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(speedDialMusic);
      audioRef.current.loop = true;
      audioRef.current.volume = 0.10; // 10%
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

        {/* Centered Premium Custom Girls Background (GTA Style Artwork) */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.20] mix-blend-screen pointer-events-none z-0">
          <div className="relative w-full max-w-4xl aspect-[3/2] px-4 flex items-center justify-center">
            <img 
              src={girlsImage} 
              alt="Cyber Lounge Girls" 
              className="w-full h-full object-contain filter drop-shadow-[0_0_35px_rgba(212,175,55,0.25)] animate-breathe-image"
              style={{
                WebkitMaskImage: 'radial-gradient(circle, rgba(0,0,0,1) 40%, rgba(0,0,0,0.7) 58%, rgba(0,0,0,0) 75%)',
                maskImage: 'radial-gradient(circle, rgba(0,0,0,1) 40%, rgba(0,0,0,0.7) 58%, rgba(0,0,0,0) 75%)',
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

      {/* Side Hookahs with Premium Vector Bowls & Bubbling (Left and Right margins) */}
      <div className="hidden xl:block fixed left-6 bottom-0 z-20 pointer-events-none opacity-25 select-none filter drop-shadow-[0_0_15px_rgba(212,175,55,0.18)]">
        <div className="relative w-72 h-[750px] flex flex-col items-center">
          <svg width="280" height="750" viewBox="0 0 280 750" fill="none" className="absolute bottom-0" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="goldStem" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8A6623" />
                <stop offset="30%" stopColor="#D4AF37" />
                <stop offset="70%" stopColor="#FFE485" />
                <stop offset="100%" stopColor="#8A6623" />
              </linearGradient>
              <linearGradient id="clayBowl" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#4A3B32" />
                <stop offset="50%" stopColor="#705A4F" />
                <stop offset="100%" stopColor="#4A3B32" />
              </linearGradient>
              <linearGradient id="glassFlask" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(212,175,55,0.02)" />
                <stop offset="50%" stopColor="rgba(212,175,55,0.12)" />
                <stop offset="100%" stopColor="rgba(212,175,55,0.02)" />
              </linearGradient>
              <linearGradient id="waterGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgba(212,175,55,0.2)" />
                <stop offset="100%" stopColor="rgba(138,102,35,0.05)" />
              </linearGradient>
            </defs>

            {/* Clay Bowl Base & Flare */}
            <path d="M 125 75 L 155 75 L 148 110 L 132 110 Z" fill="url(#clayBowl)" stroke="#3A2E26" strokeWidth="1" />
            <path d="M 115 50 L 165 50 L 125 75 H 155 Z" fill="url(#clayBowl)" stroke="#3A2E26" strokeWidth="1" />
            
            {/* Gold HMD (Kaloud) with Glowing Coals */}
            <path d="M 118 25 H 162 L 165 50 H 115 Z" fill="url(#goldStem)" stroke="#B8860B" strokeWidth="1" />
            <rect x="126" y="32" width="6" height="12" rx="2" className="coal-glow-left" fill="#8B0000" />
            <rect x="137" y="32" width="6" height="12" rx="2" className="coal-glow-left" fill="#8B0000" />
            <rect x="148" y="32" width="6" height="12" rx="2" className="coal-glow-left" fill="#8B0000" />

            {/* Ash Tray */}
            <path d="M 60 110 H 220 C 220 125, 60 125, 60 110 Z" fill="url(#goldStem)" stroke="#B8860B" strokeWidth="1.5" />
            <path d="M 50 110 H 230 L 225 115 H 55 Z" fill="url(#goldStem)" />

            {/* Shaft/Stem with Decorative Elements */}
            <rect x="135" y="135" width="10" height="365" fill="url(#goldStem)" />
            <circle cx="140" cy="180" r="14" fill="url(#goldStem)" stroke="#B8860B" strokeWidth="1.5" />
            <circle cx="140" cy="280" r="14" fill="url(#goldStem)" stroke="#B8860B" strokeWidth="1.5" />
            <circle cx="140" cy="380" r="14" fill="url(#goldStem)" stroke="#B8860B" strokeWidth="1.5" />
            <rect x="125" y="220" width="30" height="12" rx="3" fill="url(#goldStem)" stroke="#B8860B" />
            <rect x="125" y="320" width="30" height="12" rx="3" fill="url(#goldStem)" stroke="#B8860B" />
            <rect x="125" y="420" width="30" height="12" rx="3" fill="url(#goldStem)" stroke="#B8860B" />

            {/* Hose Port & Valve */}
            <path d="M 148 480 L 168 470 L 165 490 Z" fill="url(#goldStem)" stroke="#B8860B" />
            <path d="M 132 480 L 112 470 L 105 490 Z" fill="url(#goldStem)" stroke="#B8860B" />
            <circle cx="108" cy="480" r="6" fill="#D4AF37" />

            {/* Glass Flask & Water Base */}
            <path d="M 115 500 H 165 L 175 540 H 105 Z" fill="url(#glassFlask)" stroke="#D4AF37" strokeWidth="1" />
            <rect x="136" y="540" width="8" height="130" fill="rgba(212,175,55,0.4)" />
            <rect x="132" y="670" width="16" height="12" rx="2" fill="url(#goldStem)" />
            
            <path d="M 120 540 C 100 580, 50 630, 50 700 C 50 735, 230 735, 230 700 C 230 630, 180 580, 160 540 Z" fill="url(#glassFlask)" stroke="rgba(212,175,55,0.4)" strokeWidth="1.5" />
            <path d="M 58 640 C 90 645, 190 645, 222 640 C 228 670, 228 700, 220 722 H 60 C 52 700, 52 670, 58 640 Z" fill="url(#waterGrad)" />
            
            {/* Bubbles */}
            <circle cx="136" cy="690" r="3.5" className="bubble-left-1" fill="rgba(215,185,95,0.5)" />
            <circle cx="144" cy="680" r="2.5" className="bubble-left-2" fill="rgba(215,185,95,0.6)" />
            <circle cx="132" cy="670" r="3" className="bubble-left-3" fill="rgba(215,185,95,0.5)" />
            <circle cx="140" cy="655" r="4.5" className="bubble-left-4" fill="rgba(215,185,95,0.7)" />
            <circle cx="146" cy="645" r="2" className="bubble-left-5" fill="rgba(215,185,95,0.6)" />
          </svg>
        </div>
      </div>

      <div className="hidden xl:block fixed right-6 bottom-0 z-20 pointer-events-none opacity-25 select-none filter drop-shadow-[0_0_15px_rgba(212,175,55,0.18)] scale-x-[-1]">
        <div className="relative w-72 h-[750px] flex flex-col items-center">
          <svg width="280" height="750" viewBox="0 0 280 750" fill="none" className="absolute bottom-0" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="goldStemRight" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8A6623" />
                <stop offset="30%" stopColor="#D4AF37" />
                <stop offset="70%" stopColor="#FFE485" />
                <stop offset="100%" stopColor="#8A6623" />
              </linearGradient>
              <linearGradient id="clayBowlRight" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#4A3B32" />
                <stop offset="50%" stopColor="#705A4F" />
                <stop offset="100%" stopColor="#4A3B32" />
              </linearGradient>
              <linearGradient id="glassFlaskRight" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(212,175,55,0.02)" />
                <stop offset="50%" stopColor="rgba(212,175,55,0.12)" />
                <stop offset="100%" stopColor="rgba(212,175,55,0.02)" />
              </linearGradient>
              <linearGradient id="waterGradRight" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgba(212,175,55,0.2)" />
                <stop offset="100%" stopColor="rgba(138,102,35,0.05)" />
              </linearGradient>
            </defs>

            {/* Clay Bowl Base & Flare */}
            <path d="M 125 75 L 155 75 L 148 110 L 132 110 Z" fill="url(#clayBowlRight)" stroke="#3A2E26" strokeWidth="1" />
            <path d="M 115 50 L 165 50 L 125 75 H 155 Z" fill="url(#clayBowlRight)" stroke="#3A2E26" strokeWidth="1" />
            
            {/* Gold HMD (Kaloud) with Glowing Coals (Right side) */}
            <path d="M 118 25 H 162 L 165 50 H 115 Z" fill="url(#goldStemRight)" stroke="#B8860B" strokeWidth="1" />
            <rect x="126" y="32" width="6" height="12" rx="2" className="coal-glow-right" fill="#8B0000" />
            <rect x="137" y="32" width="6" height="12" rx="2" className="coal-glow-right" fill="#8B0000" />
            <rect x="148" y="32" width="6" height="12" rx="2" className="coal-glow-right" fill="#8B0000" />

            {/* Ash Tray */}
            <path d="M 60 110 H 220 C 220 125, 60 125, 60 110 Z" fill="url(#goldStemRight)" stroke="#B8860B" strokeWidth="1.5" />
            <path d="M 50 110 H 230 L 225 115 H 55 Z" fill="url(#goldStemRight)" />

            {/* Shaft/Stem with Decorative Elements */}
            <rect x="135" y="135" width="10" height="365" fill="url(#goldStemRight)" />
            <circle cx="140" cy="180" r="14" fill="url(#goldStemRight)" stroke="#B8860B" strokeWidth="1.5" />
            <circle cx="140" cy="280" r="14" fill="url(#goldStemRight)" stroke="#B8860B" strokeWidth="1.5" />
            <circle cx="140" cy="380" r="14" fill="url(#goldStemRight)" stroke="#B8860B" strokeWidth="1.5" />
            <rect x="125" y="220" width="30" height="12" rx="3" fill="url(#goldStemRight)" stroke="#B8860B" />
            <rect x="125" y="320" width="30" height="12" rx="3" fill="url(#goldStemRight)" stroke="#B8860B" />
            <rect x="125" y="420" width="30" height="12" rx="3" fill="url(#goldStemRight)" stroke="#B8860B" />

            {/* Hose Port & Valve */}
            <path d="M 148 480 L 168 470 L 165 490 Z" fill="url(#goldStemRight)" stroke="#B8860B" />
            <path d="M 132 480 L 112 470 L 105 490 Z" fill="url(#goldStemRight)" stroke="#B8860B" />
            <circle cx="108" cy="480" r="6" fill="#D4AF37" />

            {/* Glass Flask & Water Base */}
            <path d="M 115 500 H 165 L 175 540 H 105 Z" fill="url(#glassFlaskRight)" stroke="#D4AF37" strokeWidth="1" />
            <rect x="136" y="540" width="8" height="130" fill="rgba(212,175,55,0.4)" />
            <rect x="132" y="670" width="16" height="12" rx="2" fill="url(#goldStemRight)" />
            
            <path d="M 120 540 C 100 580, 50 630, 50 700 C 50 735, 230 735, 230 700 C 230 630, 180 580, 160 540 Z" fill="url(#glassFlaskRight)" stroke="rgba(212,175,55,0.4)" strokeWidth="1.5" />
            <path d="M 58 640 C 90 645, 190 645, 222 640 C 228 670, 228 700, 220 722 H 60 C 52 700, 52 670, 58 640 Z" fill="url(#waterGradRight)" />
            
            {/* Bubbles */}
            <circle cx="136" cy="690" r="3.5" className="bubble-right-1" fill="rgba(215,185,95,0.5)" />
            <circle cx="144" cy="680" r="2.5" className="bubble-right-2" fill="rgba(215,185,95,0.6)" />
            <circle cx="132" cy="670" r="3" className="bubble-right-3" fill="rgba(215,185,95,0.5)" />
            <circle cx="140" cy="655" r="4.5" className="bubble-right-4" fill="rgba(215,185,95,0.7)" />
            <circle cx="146" cy="645" r="2" className="bubble-right-5" fill="rgba(215,185,95,0.6)" />
          </svg>
        </div>
      </div>

      {/* Dynamic Animated Hoses and Smoke (Wide screens only) */}
      <div className="hidden xl:block fixed inset-0 w-full h-full pointer-events-none z-10 select-none">
        <svg className="w-full h-full">
          {/* Left Hose Background */}
          <path
            d={leftPath}
            stroke="rgba(212, 175, 55, 0.12)"
            strokeWidth="3.5"
            fill="none"
          />
          {/* Left Hose Active Inhale Flow */}
          <path
            d={leftPath}
            stroke="url(#goldGradient)"
            strokeWidth="2.2"
            fill="none"
            strokeDasharray="25, 200"
            className="animate-hose-flow-left"
            style={{ filter: 'drop-shadow(0 0 5px rgba(212, 175, 55, 0.75))' }}
          />

          {/* Right Hose Background */}
          <path
            d={rightPath}
            stroke="rgba(212, 175, 55, 0.12)"
            strokeWidth="3.5"
            fill="none"
          />
          {/* Right Hose Active Inhale Flow */}
          <path
            d={rightPath}
            stroke="url(#goldGradient)"
            strokeWidth="2.2"
            fill="none"
            strokeDasharray="25, 200"
            className="animate-hose-flow-right"
            style={{ filter: 'drop-shadow(0 0 5px rgba(212, 175, 55, 0.75))' }}
          />

          {/* Defs for gold gradient flow */}
          <defs>
            <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFE485" />
              <stop offset="50%" stopColor="#D4AF37" />
              <stop offset="100%" stopColor="#8A6623" />
            </linearGradient>
          </defs>
        </svg>



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
