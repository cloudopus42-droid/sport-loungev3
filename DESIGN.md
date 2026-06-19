# Nocturnal Noir — Stitch Design System

## Brand Essence
Nocturnal Noir is a **premium late-night lounge** brand — violet-tinted darkness, liquid glass surfaces, neon accents on deep black. All tones lean violet-purple; avoid warm golds/ambers.

## Color Palette
| Token | Value | Usage |
|-------|-------|-------|
| `--color-bg` | `#0c0c14` | Page background |
| `--color-surface` | `#14141e` | Card backgrounds |
| `--color-surface-elevated` | `#1c1c2a` | Hovered/active surfaces |
| `--color-border` | `rgba(255,255,255,0.06)` | Default borders |
| `--color-border-hover` | `rgba(255,255,255,0.12)` | Hover borders |
| `--color-accent` | `#a78bfa` | Primary accent (violet) |
| `--color-accent-glow` | `rgba(167,139,250,0.3)` | Glow effects |
| `--color-accent-muted` | `rgba(167,139,250,0.15)` | Subtle backgrounds |
| `--color-text-primary` | `#f1f1f7` | Primary text |
| `--color-text-secondary` | `rgba(241,241,247,0.65)` | Secondary text |
| `--color-text-muted` | `rgba(241,241,247,0.35)` | Muted/placeholder text |
| `--color-success` | `#22c55e` | Success states |
| `--color-warning` | `#eab308` | Warning states |
| `--color-error` | `#ef4444` | Error states |

## Typography
- **Headline**: Geist (700–900 weight), letter-spacing: -0.03em
- **Body**: Geist (300–500 weight), letter-spacing: 0
- **Monospace**: JetBrains Mono (400, 500, 700)
- **Display text**: uppercase, wide tracking (0.1–0.3em)

## Glass Morphism
- `backdrop-filter: blur(40px) saturate(220%)`
- `background: rgba(18, 18, 26, 0.65)`
- `border: 0.5px solid rgba(255, 255, 255, 0.06)`
- Top edge highlight: 1px gradient from transparent → violet (rgba(167,139,250,0.25)) → transparent
- Border radius: `0.75rem` (12px)
- Box shadow: `0 12px 40px rgba(0,0,0,0.4)`

## Animation Tokens
| Token | Value | Usage |
|-------|-------|-------|
| `--ease-out` | `cubic-bezier(0.23, 1, 0.32, 1)` | Fade/slide out |
| `--ease-in-out` | `cubic-bezier(0.77, 0, 0.175, 1)` | Pulse/glow loops |
| `--ease-drawer` | `cubic-bezier(0.32, 0.72, 0, 1)` | Sheet/modal slides |
| `--spring-standard` | `cubic-bezier(0.25, 1, 0.5, 1)` | Card hover |
| `--spring-snappy` | `cubic-bezier(0.16, 1, 0.3, 1)` | Reveal entries |
| `--duration-press` | `120ms` | Button tap |
| `--duration-tooltip` | `150ms` | Tooltip |
| `--duration-dropdown` | `200ms` | Dropdown |
| `--duration-modal` | `300ms` | Modal |
| `--duration-page` | `500ms` | Page transitions |

## Button Physics (Motion)
- **Hover**: `{ scale: 1.02, transition: { type: 'spring', duration: 0.4, bounce: 0.2 } }`
- **Tap**: `{ scale: 0.97, transition: { type: 'spring', duration: 0.12, bounce: 0 } }`
- All buttons: `whileHover` / `whileTap` via Framer Motion

## Spacing Scale
| Token | Value |
|-------|-------|
| `--space-1` | `4px` |
| `--space-2` | `8px` |
| `--space-3` | `12px` |
| `--space-4` | `16px` |
| `--space-5` | `24px` |
| `--space-6` | `32px` |
| `--space-7` | `48px` |
| `--space-8` | `64px` |

## Anti-Pattern Rules (taste-skill v2.2)
1. **No 3-column grids** — 2, 4, or asymmetric layouts; lg:grid-cols-12 with varying spans
2. **No emojis in UI** — replace with SVG icons (Lucide or custom)
3. **No box-shadows on light text** — use `text-white/45` or `text-white/65` with font-weight for hierarchy
4. **No `animate-pulse`** — use `animate-pressPop`, `animate-fadeInUp`, or `animate-glowPulse` instead
5. **No hero centering** — offset content to left (60%) with visual element on right (40%)
6. **No z-index stacking without context** — keep z-10, z-20, z-30 with comments
7. **No inline transitions on motion.div** — use animation tokens from `--ease-*` via tailwind animations
8. **No 4-item equal grids** — bento/asymmetric layout preferred (2+1+1 or 3+2+1 spans)

## Stitch Configuration
- Device: `MOBILE` (mobile-first, wraps to desktop)
- Color variant: `TONAL_SPOT`
- Primary: `#a78bfa`
- Mode: `DARK`
- Headline font: `PLUS_JAKARTA_SANS` (Geist unavailable — closest match)
- Body font: `PLUS_JAKARTA_SANS`
- Roundness: `ROUND_TWELVE`
