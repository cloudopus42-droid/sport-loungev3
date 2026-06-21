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
          gold: '#d4af37',
          'gold-light': '#f3e5ab',
          'gold-dark': '#b8962e',
          amber: '#d4af37',
          'amber-dim': '#c9a032',
          burgundy: '#5c1818',
          'burgundy-light': '#702020',
          'burgundy-dark': '#3a0d0d',
        },
        glass: {
          bg: 'rgba(18, 18, 26, 0.6)',
          border: 'rgba(212, 175, 55, 0.15)',
          'border-light': 'rgba(212, 175, 55, 0.25)',
        },
      },
      fontFamily: {
        sans: ['Geist', 'system-ui', 'sans-serif'],
        heading: ['Playfair Display', 'Georgia', 'serif'],
        body: ['Geist', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'glow-gold': '0 0 20px rgba(212, 175, 55, 0.35)',
        'glow-gold-lg': '0 0 50px rgba(212, 175, 55, 0.5)',
        'glow-amber': '0 0 20px rgba(212, 175, 55, 0.25)',
        'glow-burgundy': '0 0 20px rgba(92, 24, 24, 0.4)',
        'gold-pill': '0 0 25px rgba(212, 175, 55, 0.35), inset 0 2px 4px rgba(255, 255, 255, 0.1)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.4)',
        'glass-lg': '0 16px 48px rgba(0, 0, 0, 0.5)',
        'glass-premium': '0 24px 64px rgba(0,0,0,0.55), inset 0 0 0 0.5px rgba(255,255,255,0.06), inset 0 0 40px rgba(255,255,255,0.02)',
        'gold-ambient': '0 8px 32px rgba(212,175,55,0.08), 0 0 0 1px rgba(212,175,55,0.06)',
        'depth-lg': '0 32px 80px rgba(0,0,0,0.6)',
        'depth-xl': '0 48px 120px rgba(0,0,0,0.7)',
        'elevated': '0 4px 12px rgba(0,0,0,0.3), 0 0 0 0.5px rgba(255,255,255,0.04)',
      },
      backdropBlur: {
        glass: '32px',
        'glass-lg': '48px',
        'glass-xl': '64px',
      },
      borderRadius: {
        'glass': '24px',
        'glass-sm': '16px',
        'glass-lg': '32px',
        'glass-xl': '48px',
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
        goldSheen: 'goldSheen 3s ease-in-out infinite',
        orbFloat: 'orbFloat 20s ease-in-out infinite',
        glassShimmer: 'glassShimmer 6s ease-in-out infinite',
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
        goldSheen: {
          '0%, 100%': { transform: 'translateX(-100%) translateY(-100%)' },
          '50%': { transform: 'translateX(100%) translateY(100%)' },
        },
        orbFloat: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 30px) scale(0.95)' },
        },
        glassShimmer: {
          '0%': { transform: 'rotate(15deg) translateX(-30%) translateY(-10%)' },
          '50%': { transform: 'rotate(15deg) translateX(15%) translateY(5%)' },
          '100%': { transform: 'rotate(15deg) translateX(-30%) translateY(-10%)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
