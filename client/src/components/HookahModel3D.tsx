import { useMemo } from 'react';

interface HookahModelProps {
  variant: 'cyber_premium' | 'crystal_edition' | 'chrome_abstract' | 'stealth_obsidian';
}

export function HookahModel3D({ variant }: HookahModelProps) {
  // Styles for ambient glow colors
  const theme = useMemo(() => {
    switch (variant) {
      case 'cyber_premium':
        return {
          glowColor: 'rgba(255, 191, 0, 0.4)',
          accentColor: '#FFBF00',
        };
      case 'crystal_edition':
        return {
          glowColor: 'rgba(6, 182, 212, 0.4)',
          accentColor: '#06B6D4',
        };
      case 'chrome_abstract':
        return {
          glowColor: 'rgba(236, 72, 153, 0.4)',
          accentColor: '#EC4899',
        };
      case 'stealth_obsidian':
      default:
        return {
          glowColor: 'rgba(255, 191, 0, 0.4)',
          accentColor: '#D4AF37',
        };
    }
  }, [variant]);

  if (variant === 'cyber_premium') {
    return (
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
        {/* Deep ambient golden glow */}
        <div className="absolute w-[450px] h-[450px] rounded-full bg-accent-gold/5 blur-[100px] animate-pulse" />
        
        {/* Floating golden smoke particles */}
        <div className="absolute inset-0 flex justify-center items-center overflow-hidden">
          <svg className="w-full h-full max-w-lg opacity-30" viewBox="0 0 400 400" fill="none">
            <style>
              {`
                @keyframes float-smoke {
                  0% { transform: translateY(40px) scale(0.8); opacity: 0; }
                  50% { opacity: 0.5; }
                  100% { transform: translateY(-100px) scale(1.2); opacity: 0; }
                }
                .smoke-particle {
                  animation: float-smoke 7s ease-in-out infinite;
                  transform-origin: center;
                }
              `}
            </style>
            <circle className="smoke-particle" cx="200" cy="300" r="30" fill="url(#gold-glow-grad)" style={{ animationDelay: '0s' }} />
            <circle className="smoke-particle" cx="160" cy="270" r="20" fill="url(#gold-glow-grad)" style={{ animationDelay: '2.5s' }} />
            <circle className="smoke-particle" cx="240" cy="250" r="25" fill="url(#gold-glow-grad)" style={{ animationDelay: '5s' }} />
            
            <defs>
              <radialGradient id="gold-glow-grad" cx="0.5" cy="0.5" r="0.5">
                <stop offset="0%" stopColor="#FFBF00" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#FFBF00" stopOpacity="0" />
              </radialGradient>
            </defs>
          </svg>
        </div>
      </div>
    );
  }

  // Draw customized SVGs for 2D premium hookah shapes
  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative select-none">
      <style>
        {`
          @keyframes pulse-glow {
            0%, 100% { filter: drop-shadow(0 0 15px ${theme.glowColor}); opacity: 0.95; }
            50% { filter: drop-shadow(0 0 30px ${theme.glowColor}); opacity: 1; }
          }
          @keyframes rise-steam {
            0% { transform: translateY(5px) scaleX(0.9); opacity: 0; }
            15% { opacity: 0.6; }
            80% { opacity: 0.3; }
            100% { transform: translateY(-30px) scaleX(1.3); opacity: 0; }
          }
          .animate-pulse-glow {
            animation: pulse-glow 3s ease-in-out infinite;
          }
          .steam-line {
            animation: rise-steam 4s ease-in-out infinite;
            transform-origin: center bottom;
          }
        `}
      </style>

      {/* SVG Canvas */}
      <svg 
        width="120" 
        height="220" 
        viewBox="0 0 120 220" 
        fill="none" 
        className="animate-pulse-glow hover:scale-105 transition-transform duration-500 cursor-pointer"
      >
        {/* Animated Steam lines from bowl */}
        <path d="M50 18 Q45 5 53 -5" stroke={theme.accentColor} strokeWidth="1.5" strokeLinecap="round" opacity="0.5" className="steam-line" style={{ animationDelay: '0.2s' }} />
        <path d="M60 18 Q65 7 57 -3" stroke={theme.accentColor} strokeWidth="1.5" strokeLinecap="round" opacity="0.5" className="steam-line" style={{ animationDelay: '1.8s' }} />
        <path d="M70 18 Q68 4 75 -7" stroke={theme.accentColor} strokeWidth="1.5" strokeLinecap="round" opacity="0.5" className="steam-line" style={{ animationDelay: '3s' }} />

        {/* Hookah Top Bowl */}
        <path 
          d="M48 20 H72 L70 32 H50 Z" 
          fill={variant === 'stealth_obsidian' ? '#1F2937' : '#0F172A'} 
          stroke={theme.accentColor} 
          strokeWidth="2" 
        />
        <rect x="58" y="32" width="4" height="18" fill={theme.accentColor} opacity="0.7" />

        {/* Tray */}
        <ellipse cx="60" cy="32" rx="26" ry="5" fill={variant === 'stealth_obsidian' ? '#1F2937' : '#0F172A'} stroke={theme.accentColor} strokeWidth="2" />
        
        {/* Stem Rings */}
        <rect x="58" y="50" width="4" height="60" fill={theme.accentColor} />
        <circle cx="60" cy="65" r="6" fill={variant === 'stealth_obsidian' ? '#FFBF00' : theme.accentColor} />
        <circle cx="60" cy="85" r="5" fill={variant === 'stealth_obsidian' ? '#FFBF00' : theme.accentColor} />
        <circle cx="60" cy="105" r="6" fill={variant === 'stealth_obsidian' ? '#FFBF00' : theme.accentColor} />

        {/* Base Connection */}
        <path d="M50 110 H70 L72 120 H48 Z" fill={theme.accentColor} />

        {/* Flask Base */}
        <path 
          d="M60 120 C42 120 34 165 34 185 C34 195 44 200 60 200 C76 200 86 195 86 185 C86 165 78 120 60 120 Z" 
          fill="url(#glass-base-grad)" 
          stroke={theme.accentColor} 
          strokeWidth="2.5" 
        />

        {/* Liquid inside Base */}
        <path 
          d="M36 175 C45 180 75 180 84 175 C85 180 86 185 86 185 C86 195 76 200 60 200 C44 200 34 195 34 185 C34 185 35 180 36 175 Z" 
          fill={theme.accentColor} 
          fillOpacity="0.35" 
        />

        {/* Downstem inside flask */}
        <rect x="59" y="120" width="2" height="50" fill={theme.accentColor} opacity="0.6" />

        {/* Purge Valve and Hose Port */}
        <line x1="48" y1="114" x2="38" y2="108" stroke={theme.accentColor} strokeWidth="2" />
        <line x1="72" y1="114" x2="82" y2="108" stroke={theme.accentColor} strokeWidth="2" />

        <defs>
          <linearGradient id="glass-base-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1E293B" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#0F172A" stopOpacity="0.9" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

export default HookahModel3D;
