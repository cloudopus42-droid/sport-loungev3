import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#080604', // Rich obsidian gold-black
          surface: '#120f0c', // Dark warm gold-tinted surface
          border: 'rgba(212, 175, 55, 0.15)',
        },
        accent: {
          gold: '#D4AF37', // Luxury gold
          amber: '#FFB800', // Glowing amber
          bronze: '#8A6623', // Muted bronze
          cyan: '#D4AF37', // Map old accent to gold
          blue: '#FFB800', // Map old accent to amber
          purple: '#8A6623', // Map old accent to bronze
        },
        glass: {
          bg: 'rgba(18, 14, 10, 0.7)',
          border: 'rgba(212, 175, 55, 0.15)',
        },
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Cinzel', 'Space Grotesk', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow-cyan': '0 0 20px rgba(212, 175, 55, 0.35)',
        'glow-blue': '0 0 20px rgba(255, 184, 0, 0.35)',
        'glow-lg': '0 0 40px rgba(212, 175, 55, 0.5)',
        'glow-purple': '0 0 20px rgba(138, 102, 35, 0.35)',
        'glow-red': '0 0 20px rgba(239, 68, 68, 0.35)',
        'glow-green': '0 0 20px rgba(34, 197, 94, 0.35)',
        'glow-gold': '0 0 25px rgba(212, 175, 55, 0.45)',
        'glow-gold-lg': '0 0 50px rgba(212, 175, 55, 0.65)',
        'gold-pill': '0 0 25px rgba(212, 175, 55, 0.45), inset 0 2px 4px rgba(255, 255, 255, 0.3)',
      },
      backdropBlur: {
        glass: '20px',
      },
      animation: {
        fadeInUp: 'fadeInUp 0.5s ease-out forwards',
        glowPulse: 'glowPulse 2s ease-in-out infinite',
        slideInRight: 'slideInRight 0.4s ease-out forwards',
        shimmer: 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(212, 175, 55, 0.4)' },
          '50%': { boxShadow: '0 0 40px rgba(212, 175, 55, 0.6)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(40px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
