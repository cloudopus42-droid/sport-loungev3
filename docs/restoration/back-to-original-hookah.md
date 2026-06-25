# Restoration: Back to Original Hookah Design

**Date:** 2026-06-24
**Commit:** `ffc7b5c`

## What Was Done

### 1. Deleted ALL 3D Components
- **Deleted**: `client/src/components/three/HookahLayers.tsx` (abstract glass orb with GSAP)
- **Deleted**: `client/src/components/three/` directory (empty after removal)
- **Uninstalled**: `gsap`, `@gsap/react` from package.json
- **Verified**: No remaining references to Three.js, WebGL, canvas 3D, spheres, or orbs anywhere in codebase

### 2. Restored Original Design (from git history `86f1e78^`)

#### Hero Section — Video Background
- Restored `/кальянhhs.mp4` video background (recovered from git history)
- Centered hero with gradient text "ИСТИННЫЙ ВКУС И КРЕПОСТЬ"
- Gold "SPORT LOUNGE • КРУГЛОСУТОЧНО 24/7" subtitle
- CTA buttons: "Сделать заказ" (btn-primary) + "ИИ-Миксолог" (btn-secondary)
- Address and hours displayed below

#### Dashboard Section — Hookah Visualizer + System Widgets
- `premium_hookah.png` (static PNG) displayed in GlassCard
- **CSS Smoke** replacement: `CssSmoke` component with 18 gold-tinted particles, `smokeRise` animation with horizontal drift
- `animate-breathe-image` CSS class for subtle pulsing glow on the hookah image
- System status widgets: seating occupancy, flavor intensity bars, audio system

#### Remaining Sections (preserved from current codebase)
- MixCarousel3D collection showcase
- Advantages grid with spotlight glow on hover
- Booking CTA + VIP panel
- Promos carousel
- Contacts with Yandex map

### 3. CSS Smoke Component (`CssSmoke.tsx`)
- Pure CSS animation (no WebGL/Three.js)
- 18 gold-tinted radial gradient particles
- `smokeRise` keyframe with `--drift` CSS variable for horizontal movement
- `prefers-reduced-motion` respected via global CSS media query

### 4. Removed Obsolete CSS Keyframes
- Deleted: `liquidPulse`, `liquidShift`, `lightSweep`, `particleFloat`, `ringPulse`
- These were only used by the deleted HookahLayers glass orb
- Updated `smokeRise` to support horizontal drift via CSS variable

### 5. BookingPage Updated
- Replaced `HookahLayers` with `premium_hookah.png` + `CssSmoke`
- Same visual approach as HomePage dashboard

## Files Changed
| File | Action |
|------|--------|
| `client/src/components/three/HookahLayers.tsx` | DELETED |
| `client/src/components/CssSmoke.tsx` | NEW — CSS smoke particles |
| `client/src/pages/HomePage.tsx` | Restored video hero + dashboard layout |
| `client/src/pages/BookingPage.tsx` | Replaced HookahLayers with PNG + CSS smoke |
| `client/src/index.css` | Updated smokeRise animation, removed glass orb keyframes |
| `client/public/кальянhhs.mp4` | Restored from git history |
| `client/package.json` | Removed gsap, @gsap/react |

## Bundle Size Impact
- **Before**: ~119KB (HookahLayers with GSAP)
- **After**: ~0KB (CSS smoke is ~1KB)
- **Net reduction**: ~118KB from main bundle

## Verification
- ✅ Build succeeds with no errors
- ✅ No remaining references to Three.js, WebGL, canvas 3D, spheres, orbs
- ✅ No remaining GSAP imports
- ✅ Video background restored from git history
- ✅ `premium_hookah.png` still exists at `client/src/premium_hookah.png`
- ✅ CSS smoke animation working with `smokeRise` keyframe
- ✅ `animate-breathe-image` animation applied to hookah PNG
