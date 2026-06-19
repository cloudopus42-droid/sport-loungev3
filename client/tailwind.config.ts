import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0a0a0f',
          surface: '#12121a',
          'surface-alt': '#1a1a26',
          border: 'rgba(255, 255, 255, 0.06)',
        },
        accent: {
          gold: '#a78bfa',
          'gold-light': '#c4b5fd',
          'gold-dark': '#7c3aed',
          amber: '#a78bfa',
          'amber-dim': '#8b5cf6',
          burgundy: '#4c1d95',
          'burgundy-light': '#6d28d9',
          'burgundy-dark': '#311082',
        },
        glass: {
          bg: 'rgba(18, 18, 26, 0.6)',
          border: 'rgba(167, 139, 250, 0.15)',
          'border-light': 'rgba(167, 139, 250, 0.25)',
        },
      },
      fontFamily: {
        sans: ['Geist', 'system-ui', 'sans-serif'],
        heading: ['Geist', 'system-ui', 'sans-serif'],
        display: ['Geist', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'glow-gold': '0 0 20px rgba(167, 139, 250, 0.35)',
        'glow-gold-lg': '0 0 50px rgba(167, 139, 250, 0.5)',
        'glow-amber': '0 0 20px rgba(167, 139, 250, 0.25)',
        'glow-burgundy': '0 0 20px rgba(76, 29, 149, 0.4)',
        'gold-pill': '0 0 25px rgba(167, 139, 250, 0.35), inset 0 2px 4px rgba(255, 255, 255, 0.1)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.4)',
        'glass-lg': '0 16px 48px rgba(0, 0, 0, 0.5)',
      },
      backdropBlur: {
        glass: '32px',
        'glass-lg': '48px',
      },
      borderRadius: {
        'glass': '24px',
        'glass-sm': '16px',
        'glass-lg': '32px',
        'stitch': '0.25rem',
        'stitch-lg': '0.75rem',
      },
      animation: {
        fadeInUp: 'fadeInUp 0.6s cubic-bezier(0.23, 1, 0.32, 1) forwards',
        glowPulse: 'glowPulse 2s cubic-bezier(0.77, 0, 0.175, 1) infinite',
        slideInRight: 'slideInRight 0.5s cubic-bezier(0.23, 1, 0.32, 1) forwards',
        shimmer: 'shimmer 2s linear infinite',
        accentFloat: 'accentFloat 6s cubic-bezier(0.77, 0, 0.175, 1) infinite',
        revealCard: 'revealCard 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        countUp: 'countUp 2s cubic-bezier(0.23, 1, 0.32, 1) forwards',
        drawerIn: 'drawerIn 0.4s cubic-bezier(0.32, 0.72, 0, 1) forwards',
        springIn: 'springIn 0.5s cubic-bezier(0.23, 1, 0.32, 1) forwards',
        pressPop: 'pressPop 0.15s cubic-bezier(0.23, 1, 0.32, 1)',
        staggerFade: 'staggerFade 0.4s cubic-bezier(0.23, 1, 0.32, 1) forwards',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(167, 139, 250, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(167, 139, 250, 0.5)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(40px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        accentFloat: {
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
        drawerIn: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        springIn: {
          '0%': { opacity: '0', transform: 'scale(0.95) translateY(10px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        pressPop: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(0.97)' },
          '100%': { transform: 'scale(1)' },
        },
        staggerFade: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
