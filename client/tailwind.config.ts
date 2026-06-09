import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#131313',
          surface: '#201f1f',
          border: 'rgba(255, 191, 0, 0.16)',
        },
        accent: {
          gold: '#FFD966',
          amber: '#D4AF37',
          bronze: '#af8d11',
          cyan: '#06b6d4',
          blue: '#3b82f6',
          purple: '#FFBF00',
        },
        glass: {
          bg: 'rgba(255, 255, 255, 0.04)',
          border: 'rgba(255, 191, 0, 0.12)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
      },
      boxShadow: {
        'glow-amber': '0 0 20px rgba(255, 191, 0, 0.3)',
        'glow-amber-lg': '0 0 40px rgba(255, 191, 0, 0.5)',
        'glow-gold': '0 0 25px rgba(255, 191, 0, 0.45)',
        'glow-gold-lg': '0 0 50px rgba(255, 191, 0, 0.65)',
        'glow-cyan': '0 0 20px rgba(6, 182, 212, 0.35)',
        'glow-blue': '0 0 20px rgba(59, 130, 246, 0.35)',
        'glow-lg': '0 0 40px rgba(255, 191, 0, 0.5)',
        'glow-purple': '0 0 20px rgba(255, 191, 0, 0.35)',
        'glow-red': '0 0 20px rgba(239, 68, 68, 0.35)',
        'glow-green': '0 0 20px rgba(34, 197, 94, 0.35)',
        'gold-pill': '0 0 25px rgba(255, 191, 0, 0.45), inset 0 2px 4px rgba(255, 255, 255, 0.3)',
      },
      backdropBlur: {
        glass: '32px',
      },
      borderRadius: {
        cyber: '2rem',
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
          '0%, 100%': { boxShadow: '0 0 20px rgba(255, 191, 0, 0.4)' },
          '50%': { boxShadow: '0 0 40px rgba(255, 191, 0, 0.6)' },
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
