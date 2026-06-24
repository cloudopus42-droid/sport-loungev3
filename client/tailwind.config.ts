import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#070707',
          surface: '#0A0C0E',
          'surface-alt': '#0F1216',
          'surface-elevated': '#14181E',
          border: 'rgba(176, 141, 87, 0.12)',
          'border-medium': 'rgba(176, 141, 87, 0.18)',
        },
        gold: {
          DEFAULT: '#B08D57',
          light: '#C4A46B',
          dark: '#8D6B3D',
          muted: 'rgba(176, 141, 87, 0.6)',
          subtle: 'rgba(176, 141, 87, 0.08)',
          glow: 'rgba(176, 141, 87, 0.06)',
        },
        glass: {
          bg: 'rgba(10, 12, 14, 0.55)',
          'bg-dark': 'rgba(7, 7, 7, 0.75)',
          border: 'rgba(176, 141, 87, 0.08)',
          'border-hover': 'rgba(176, 141, 87, 0.18)',
        },
        text: {
          primary: '#F5F0EA',
          secondary: '#9D978E',
          muted: 'rgba(157, 151, 142, 0.35)',
          inverse: '#070707',
        },
        accent: {
          gold: '#B08D57',
          'gold-light': '#C4A46B',
          'gold-dark': '#8D6B3D',
          amber: '#B08D57',
          'amber-dim': '#A07D47',
          'gold-bright': '#C4A46B',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Cormorant Garamond', 'Georgia', 'serif'],
        heading: ['Cormorant Garamond', 'Georgia', 'serif'],
        display: ['Cormorant Garamond', 'Georgia', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'elevated': '0 4px 16px rgba(0,0,0,0.3)',
        'glass': '0 8px 32px rgba(0,0,0,0.4)',
        'glass-lg': '0 16px 48px rgba(0,0,0,0.45)',
        'glass-premium': '0 24px 64px rgba(0,0,0,0.55), inset 0 0 0 0.5px rgba(245,240,234,0.03)',
        'gold-glow': '0 8px 32px rgba(176,141,87,0.06)',
        'inner-glow': 'inset 0 1px 0 rgba(245,240,234,0.03)',
        'inner-edge': 'inset 0 0 0 0.5px rgba(245,240,234,0.04)',
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
        'glass-xl': '24px',
        'pill': '9999px',
      },
      animation: {
        fadeUp: 'fadeUp 0.7s cubic-bezier(0.23, 1, 0.32, 1) forwards',
        fadeIn: 'fadeIn 0.7s ease-out forwards',
        reveal: 'reveal 0.8s cubic-bezier(0.23, 1, 0.32, 1) forwards',
        shimmer: 'shimmer 6s ease-in-out infinite',
        'gold-pulse': 'goldPulse 4s ease-in-out infinite',
        breathe: 'breathe 6s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(32px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        reveal: {
          '0%': { opacity: '0', transform: 'translateY(24px) scale(0.97)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        shimmer: {
          '0%': { 'background-position': '200% 0' },
          '100%': { 'background-position': '-200% 0' },
        },
        goldPulse: {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
        breathe: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.02)' },
        },
      },
      spacing: {
        'section': '120px',
        'section-lg': '180px',
        'gap-lg': '48px',
        'gap-xl': '64px',
      },
      backgroundImage: {
        'vignette': 'radial-gradient(ellipse at center, transparent 40%, rgba(7,7,7,0.6) 100%)',
        'vignette-strong': 'radial-gradient(ellipse at center, transparent 30%, rgba(7,7,7,0.8) 100%)',
        'gold-gradient': 'linear-gradient(135deg, #B08D57 0%, #C4A46B 30%, #B08D57 60%, #8D6B3D 100%)',
        'gold-fade': 'linear-gradient(180deg, rgba(176,141,87,0.08) 0%, transparent 100%)',
        'gold-divider': 'linear-gradient(90deg, transparent, rgba(176,141,87,0.15), transparent)',
        'light-sweep': 'linear-gradient(90deg, transparent, rgba(245,240,234,0.02), transparent)',
      },
    },
  },
  plugins: [],
};

export default config;
