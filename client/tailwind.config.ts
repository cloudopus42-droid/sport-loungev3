import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0A0A0F',
          surface: '#0F0B14',
          border: 'rgba(107, 15, 15, 0.2)',
        },
        accent: {
          gold: '#D4AF37',
          'gold-light': '#FFD700',
          'gold-dark': '#B8962A',
          burgundy: '#6B0F0F',
          'burgundy-light': '#8B1A1A',
          'burgundy-dark': '#4A0909',
        },
        glass: {
          bg: 'rgba(255, 255, 255, 0.04)',
          border: 'rgba(212, 175, 55, 0.15)',
          'border-light': 'rgba(212, 175, 55, 0.25)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Unbounded', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow-gold': '0 0 20px rgba(212, 175, 55, 0.35)',
        'glow-gold-lg': '0 0 50px rgba(212, 175, 55, 0.5)',
        'glow-burgundy': '0 0 20px rgba(107, 15, 15, 0.4)',
        'gold-pill': '0 0 25px rgba(212, 175, 55, 0.35), inset 0 2px 4px rgba(255, 255, 255, 0.2)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.35)',
        'glass-lg': '0 16px 48px rgba(0, 0, 0, 0.45)',
      },
      backdropBlur: {
        glass: '32px',
        'glass-lg': '48px',
      },
      borderRadius: {
        'glass': '24px',
        'glass-sm': '16px',
        'glass-lg': '32px',
      },
      animation: {
        fadeInUp: 'fadeInUp 0.6s ease-out forwards',
        glowPulse: 'glowPulse 2s ease-in-out infinite',
        slideInRight: 'slideInRight 0.5s ease-out forwards',
        shimmer: 'shimmer 2s linear infinite',
        goldFloat: 'goldFloat 6s ease-in-out infinite',
        revealCard: 'revealCard 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        countUp: 'countUp 2s ease-out forwards',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(212, 175, 55, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(212, 175, 55, 0.5)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(40px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        goldFloat: {
          '0%, 100%': { transform: 'translateY(0) scale(1)', opacity: '0.6' },
          '50%': { transform: 'translateY(-20px) scale(1.05)', opacity: '1' },
        },
        revealCard: {
          '0%': { opacity: '0', transform: 'scale(0.95) translateY(20px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        countUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
