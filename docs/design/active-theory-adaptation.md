# Active Theory Design Adaptation

**Date:** 2026-06-24
**Status:** Implemented
**Commit:** 63d5a7c

## Overview

Adapted the Sport Lounge homepage and global UI to follow the Active Theory design aesthetic — a void-canvas approach where the 3D hookah artifact IS the interface, and all chrome defers to it.

## Key Principles Applied

### 1. Pure Void Canvas
- Background changed from `#070707` to `#000000` (absolute black)
- Removed all background images, gradients, textures, and architectural lines
- The 3D hookah is the ONLY visual subject on the page

### 2. Instrument-Panel Typography
- Added **Space Mono** (substitute for nbarchitekt) as the monospace label font
- All UI labels: uppercase, 10px, tight tracking, `font-mono`
- Reserved for navigation, section markers, micro-copy
- Body text remains serif (Cormorant Garamond) for editorial contrast

### 3. Hairline Borders
- All borders: `#4d4d4d` / `#808080` / `#999999` at 1px
- No shadows, no elevation effects
- UI zones differentiated by borders and positioning, not fills

### 4. Color Palette
| Element | Value | Usage |
|---------|-------|-------|
| Void Black | `#000000` | Page canvas, surfaces |
| Pure White | `#ffffff` | Primary text |
| Graphite | `#4d4d4d` | Hairline borders |
| Steel | `#808080` | Secondary borders |
| Fog | `#999999` | Tertiary borders |
| Ash | `#c6c6c6` | Muted links |
| Midnight Violet | `#343755` | Cookie accept only |

### 5. Component Changes

#### Hero Section
- Removed Unsplash background image
- 3D hookah centered in viewport as sole artifact
- Instrument-panel labels pushed to corners
- Scroll indicator: simple white hairline

#### Cookie Banner
- Positioned bottom-right (not bottom-center)
- Pure black fill, `#4d4d4d` border
- Serif body text (Georgia)
- Accept button: `#343755` midnight violet
- Reject button: transparent, `#999999` border

#### Navigation
- Monospace uppercase labels
- Hairline underlines for active state (white/30)
- No gold accents in nav
- Mobile menu: pure black, white/5 borders

#### Buttons
- Primary: `#343755` violet fill, white text, 5px radius
- Secondary: transparent, `#999999` border, 5px radius

## Files Modified

- `client/index.html` — Space Mono font, `#000000` body bg
- `client/tailwind.config.ts` — Updated colors, fonts, backgrounds
- `client/src/index.css` — Updated CSS variables, components
- `client/src/pages/HomePage.tsx` — Complete Active Theory rewrite
- `client/src/components/ui/CookieBanner.tsx` — Active Theory cookie
- `client/src/layouts/MainLayout.tsx` — Instrument-panel navigation

## Reference

- Active Theory website aesthetic
- Observatory dome at midnight — single instrument glowing in void
- nbarchitekt + Times typography pairing
- Connected pill navigation with hairline connector
