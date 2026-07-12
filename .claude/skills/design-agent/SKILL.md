# Design Agent — Autonomous Design Structure Intelligence

## Embedded Skills

This agent embeds two design intelligence systems:

### 1. UI/UX Pro Max (50+ styles, 161 palettes, 57 fonts, 99 UX rules)

#### Style Taxonomy
- **General (49):** Minimal, Clean, Modern, Contemporary, Corporate, Professional, Luxury, Premium, Elegant, Sophisticated, Bold, Edgy, Playful, Whimsical, Creative, Artistic, Vibrant, Energetic, Dark, Moody, Light, Airy, Warm, Cozy, Cool, Sleek, Retro, Vintage, Nostalgic, Grunge, Industrial, Rustic, Organic, Natural, Futuristic, Sci-Fi, Tech, Cyberpunk, Neon, Glassmorphism, Neumorphism, Skeuomorphic, Flat, Material, Brutalist, Bauhaus, Art Deco, Scandinavian, Japanese, Tribal
- **Landing (8):** Hero-centric, Storytelling, Product-focused, Video, Split screen, Single page, Coming soon, SaaS
- **Dashboard (10):** Analytics, KPI, Social, Financial, Healthcare, Project, E-commerce, Real-time, Minimal, Data-heavy

#### UX Rules (99) — CRITICAL
1. Every interactive element must have visible focus state
2. Touch targets ≥ 44x44px
3. Color never sole means of conveying info
4. All form inputs must have labels
5. Error messages must be clear and actionable
6. Users must be able to undo destructive actions
7. Loading states for operations >300ms
8. Session timeout warns before occurring
9. Content readable at 200% zoom
10. Keyboard navigation follows visual order

#### Chart Types (25)
Bar, Column, Line, Area, Pie, Donut, Scatter, Bubble, Radar, Polar, Heatmap, Treemap, Sunburst, Sankey, Funnel, Waterfall, Gantt, Timeline, Chord, Network, Force-directed, Streamgraph, Horizon, Box plot, Violin

### 2. Frontend Design (Distinctive Visual Intelligence)

#### Core Principles
- **Ground in subject:** Name concrete subject, audience, page's single job
- **Hero as thesis:** Open with most characteristic thing in subject's world
- **Typography = personality:** Pair display + body faces deliberately
- **Structure = information:** Numbering, eyebrows, dividers encode truth
- **Motion = deliberate:** Orchestrate one moment, not scattered effects
- **Restraint:** Spend boldness in ONE place, cut decoration

#### Anti-Pattern Detection (AI Defaults to Avoid)
1. Warm cream background (#F4F1EA) + high-contrast serif + terracotta accent
2. Near-black background + single acid-green/vermilion accent
3. Broadsheet layout + hairline rules + zero border-radius + newspaper columns

#### Process
1. Brainstorm design plan (tokens, palette, type, layout, signature)
2. Review plan against brief — revise generic parts
3. Build following revised plan exactly
4. Critique own work — take screenshot if possible
5. Remove one accessory before shipping (Chanel rule)

## Sport Lounge Design System

### Color Palette
| Token | Value | Usage |
|-------|-------|-------|
| `dark-bg` | `#1a1815` | Page background |
| `dark-surface-alt` | `#221f1b` | Card backgrounds |
| `dark-surface-elevated` | `#2a2621` | Elevated surfaces |
| `gold-DEFAULT` | `#FFBF00` | Primary accent |
| `gold-light` | `#FFD54F` | Hover states |
| `gold-dark` | `#B08D57` | Muted accent |
| `text-primary` | `#ffffff` | Headings |
| `text-secondary` | `#c6c6c6` | Body text |
| `text-muted` | `rgba(198,198,198,0.5)` | Labels, captions |

### Typography
| Role | Font | Fallback |
|------|------|----------|
| Display/Heading | Playfair Display | Georgia, serif |
| Body | Inter | system-ui, sans-serif |
| Label/Data | Space Mono | ui-monospace, monospace |

### Glass Morphism System
```css
/* Use these classes, NOT inline styles */
.bg-liquid-glass     /* backdrop-filter: blur(24px) saturate(180%) */
.glass-card          /* Standard glass card */
.glass-card-premium  /* Premium with inner glow */
.glass-card-gold-ring /* Gold border ring */
.glass-input         /* Form inputs */
```

### Border Radius Scale
| Token | Value |
|-------|-------|
| `rounded-glass-sm` | 12px |
| `rounded-glass` | 16px |
| `rounded-glass-lg` | 20px |
| `rounded-glass-xl` | 24px |
| `rounded-pill` | 9999px |

### Shadow System
| Token | Usage |
|-------|-------|
| `shadow-elevated` | Cards, dropdowns |
| `shadow-glass` | Modals, overlays |
| `shadow-glass-lg` | Hero sections |
| `shadow-gold-glow` | CTA buttons |

### Spacing Scale (Tailwind)
Use standard Tailwind spacing: `p-1`(4px), `p-2`(8px), `p-3`(12px), `p-4`(16px), `p-5`(20px), `p-6`(24px), `p-8`(32px), `p-10`(40px), `p-12`(48px), `p-16`(64px)

## Design QA Script

Run before any UI work and before deploy:

```powershell
.\scripts\design-qa.ps1 -Verbose
```

Checks:
1. Rogue colors (outside palette)
2. Font family consistency
3. Border radius consistency
4. Glass morphism consistency
5. Spacing scale adherence
6. Focus states on interactive elements

## When to Use

### ALWAYS invoke this agent when:
- Creating new pages or components
- Redesigning existing UI
- Adding animations or micro-interactions
- Changing color scheme or typography
- Building landing pages or marketing screens
- Any visual design decision

### Design Review Checklist
- [ ] Colors from design system only
- [ ] Typography uses font tokens
- [ ] Border radius from scale
- [ ] Glass effects use standard classes
- [ ] Spacing follows Tailwind scale
- [ ] Touch targets ≥ 44px
- [ ] Focus states visible
- [ ] Responsive: mobile → tablet → desktop
- [ ] Reduced motion respected
- [ ] No AI-default patterns (check anti-patterns above)
- [ ] Signature element is ONE memorable thing
- [ ] Copy is clear, active voice, no filler

## Files

- `scripts/design-qa.ps1` — Design consistency checker
- `.claude/skills/design-agent/SKILL.md` — This file
- `.claude/skills/design-agent/skill.yaml` — Skill metadata
- `client/tailwind.config.ts` — Design tokens
- `client/src/index.css` — CSS variables and glass system
