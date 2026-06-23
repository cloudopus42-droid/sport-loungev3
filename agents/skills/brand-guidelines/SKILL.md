---
name: brand-guidelines
description: Applies SPORT LOUNGE official brand colors and typography to any artifact. Use when brand colors, style guidelines, visual formatting, or company design standards apply.
---

# SPORT LOUNGE Brand Styling

## Brand Guidelines

### Colors

**Dark Background:**
- `#0b0807` - Primary background (Nocturnal Noir)
- `#0D0F13` - Surface color

**Gold Palette (Dual Gold):**
- `#B08D57` - Muted gold (borders, UI surfaces, decorative text)
- `#FFBF00` - Bright gold / accent gold (CTAs, active states, highlights, glows)
- `#C4A46B` - Soft gold (secondary elements)
- `#8D6B3D` - Dark gold (depth, shadows)

**Text:**
- `#F5F5F5` - Primary text
- `#9D9D9D` - Secondary text

### Typography

- **Headings**: Playfair Display (with Georgia fallback)
- **Body Text**: Inter (with Arial fallback)

### Glassmorphism Tokens

```css
background: rgba(15, 12, 10, 0.5);
backdrop-filter: blur(20px);
border: 1px solid rgba(255, 191, 0, 0.15);
```

### Tailwind Classes

- `bg-dark-bg` → `#0b0807`
- `text-accent-gold` → `#B08D57`
- `text-accent-gold-bright` → `#FFBF00`
- `border-gold-bright` → `border-color: #FFBF00`
- `font-heading` → Playfair Display
- `font-body` → Inter

### Pre-Delivery Checklist
- No emojis as icons (use Lucide SVG icons)
- `cursor-pointer` on all clickable elements
- Hover states with smooth transitions (200-300ms)
- Text contrast >= 4.5:1
- Focus states visible for keyboard navigation
- `prefers-reduced-motion` respected
- Responsive: 375px, 768px, 1024px, 1440px
- Loading states (skeleton/spinner)
- Error states with recovery actions
- Empty states with call-to-action
