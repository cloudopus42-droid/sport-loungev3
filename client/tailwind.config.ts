import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0b0807',
          surface: '#0D0F13',
          'surface-alt': '#13161C',
          border: 'rgba(176, 141, 87, 0.18)',
        },
        accent: {
          gold: '#B08D57',
          'gold-bright': '#FFBF00',
          'gold-light': '#C4A46B',
          'gold-dark': '#8D6B3D',
          amber: '#B08D57',
          'amber-dim': '#A07D47',
        },
        glass: {
          bg: 'rgba(13, 15, 19, 0.6)',
          border: 'rgba(176, 141, 87, 0.18)',
          'border-light': 'rgba(176, 141, 87, 0.25)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Playfair Display', 'Georgia', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
      },
      boxShadow: {
        'elevated': '0 4px 12px rgba(0,0,0,0.3)',
        'glass': '0 6px 24px rgba(0,0,0,0.35)',
        'glass-lg': '0 12px 40px rgba(0,0,0,0.4)',
        'glass-premium': '0 24px 64px rgba(0,0,0,0.55), inset 0 0 0 0.5px rgba(255,255,255,0.04)',
        'gold-ambient': '0 4px 20px rgba(176,141,87,0.06)',
      },
      backdropBlur: {
        glass: '24px',
        'glass-lg': '32px',
        'glass-xl': '48px',
      },
      borderRadius: {
        'glass': '16px',
        'glass-sm': '12px',
        'glass-lg': '20px',
      },
      animation: {
        fadeInUp: 'fadeInUp 0.6s cubic-bezier(0.23, 1, 0.32, 1) forwards',
        fadeIn: 'fadeIn 0.6s ease-out forwards',
        luxuryReveal: 'luxuryReveal 0.6s cubic-bezier(0.23, 1, 0.32, 1) forwards',
        shimmer: 'shimmer 4s ease-in-out infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(40px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        luxuryReveal: {
          '0%': { opacity: '0', transform: 'translateY(24px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        shimmer: {
          '0%': { 'background-position': '200% 0' },
          '100%': { 'background-position': '-200% 0' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
