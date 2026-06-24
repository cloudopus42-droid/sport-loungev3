import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#1a1815',
          surface: '#1a1815',
          'surface-alt': '#221f1b',
          'surface-elevated': '#2a2621',
          border: 'rgba(255, 191, 0, 0.12)',
          'border-medium': 'rgba(255, 191, 0, 0.2)',
        },
        gold: {
          DEFAULT: '#FFBF00',
          light: '#FFD54F',
          dark: '#B08D57',
          muted: 'rgba(255, 191, 0, 0.6)',
          subtle: 'rgba(255, 191, 0, 0.08)',
          glow: 'rgba(255, 191, 0, 0.06)',
        },
        glass: {
          bg: 'rgba(15, 12, 10, 0.55)',
          'bg-dark': 'rgba(15, 12, 10, 0.75)',
          border: 'rgba(255, 191, 0, 0.12)',
          'border-hover': 'rgba(255, 191, 0, 0.25)',
        },
        text: {
          primary: '#ffffff',
          secondary: '#c6c6c6',
          muted: 'rgba(198, 198, 198, 0.5)',
          inverse: '#1a1815',
        },
        accent: {
          gold: '#FFBF00',
          'gold-light': '#FFD54F',
          'gold-dark': '#B08D57',
          amber: '#FFBF00',
          'amber-dim': '#E6AC00',
          'gold-bright': '#FFD54F',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        heading: ['"Playfair Display"', 'Georgia', 'serif'],
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"Space Mono"', 'ui-monospace', 'monospace'],
        label: ['"Space Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'elevated': '0 4px 16px rgba(0,0,0,0.3)',
        'glass': '0 8px 32px rgba(0,0,0,0.4)',
        'glass-lg': '0 16px 48px rgba(0,0,0,0.45)',
        'glass-premium': '0 24px 64px rgba(0,0,0,0.55), inset 0 0 0 0.5px rgba(255,255,255,0.03)',
        'gold-glow': '0 4px 20px rgba(255,191,0,0.2), 0 0 40px rgba(255,191,0,0.08)',
        'gold-glow-sm': '0 0 12px rgba(255,191,0,0.1)',
        'gold-glow-lg': '0 4px 32px rgba(255,191,0,0.25), 0 0 60px rgba(255,191,0,0.1)',
        'inner-glow': 'inset 0 1px 0 rgba(255,255,255,0.03)',
        'inner-edge': 'inset 0 0 0 0.5px rgba(255,255,255,0.04)',
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
        'vignette': 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)',
        'vignette-strong': 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.8) 100%)',
        'gold-gradient': 'linear-gradient(135deg, #FFBF00 0%, #FFD54F 30%, #FFBF00 60%, #B08D57 100%)',
        'gold-fade': 'linear-gradient(180deg, rgba(255,191,0,0.08) 0%, transparent 100%)',
        'gold-divider': 'linear-gradient(90deg, transparent, rgba(255,191,0,0.15), transparent)',
        'light-sweep': 'linear-gradient(90deg, transparent, rgba(255,255,255,0.02), transparent)',
      },
    },
  },
  plugins: [],
};

export default config;
