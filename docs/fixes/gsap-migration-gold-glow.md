# Three.js to GSAP Migration + Gold Glow Restoration

**Date**: 2026-06-24  
**Commit**: `8d9d211`

## What Changed

### Phase 1: Three.js → GSAP Layers
- **Deleted**: `HookahScene.tsx` (Three.js/R3F/Drei 3D model — 403 lines)
- **Deleted**: `ThreeSmoke.tsx` (stub component)
- **Created**: `HookahLayers.tsx` — GSAP + ScrollTrigger layer-based animation
- **Uninstalled**: `three`, `@react-three/fiber`, `@react-three/drei`, `@types/three`
- **Installed**: `gsap`, `@gsap/react`

#### HookahLayers Architecture
- CSS-styled div layers (Base, Flask, Shaft, Bowl, Smoke, Particles) — no WebGL
- Z-index layering: bowl (10), smoke (15), particles (20), shaft (1), flask (2), base (0)
- `scrollMode` prop enables ScrollTrigger integration for scroll-driven bowl swaps
- Bowl swap triggers smoke overlay + particle burst animation
- Supports `hero` and `compact` sizes
- `prefers-reduced-motion` respected via GSAP

### Phase 2: Gold Glow Restoration
- **`btn-primary`**: Changed from `#343755` violet → gold gradient `#B08D57 → #C4A46B` with `box-shadow: 0 4px 20px rgba(176,141,87,0.25)`
- **`GlowButton`**: Added gold glow shadow on primary/gold variants
- **`glass-card`**: Border changed from `rgba(77,77,77,0.3)` → `rgba(176,141,87,0.12)`
- **`liquid-glass`**: Gold-tinted border with hover effect
- **`luxury-input`**: Gold border on focus with glow
- **`btn-secondary`**: Gold-tinted border
- **Added**: `.icon-frame`, `.gold-glow-sm/md/lg` CSS utilities
- **Tailwind**: `gold-glow`, `gold-glow-sm`, `gold-glow-lg` shadows

### Phase 3: Dynamic Data Wiring
- **HomePage**: Fetches `/api/stats`, `/api/advantages`, `/api/menu` with static fallbacks
- **BookingPage**: Fetches `/api/flavors` filtered by `is_active`
- **BookingPage**: Fixed flavor filter bug (`f.category` instead of `f.cat`)
- **Loyalty toggle**: Already exists as `loyalty_program` feature in SmartFeaturesPage

### BookingPage Gold Consistency
- All `#FFBF00` → `#B08D57` (26 replacements)
- All `rgba(255,191,0,` → `rgba(176,141,87,`
- Order button: gold gradient with gold glow shadow
- Header badge: gold-tinted

## Files Modified
| File | Change |
|------|--------|
| `client/src/components/three/HookahLayers.tsx` | NEW — GSAP layer animation |
| `client/src/components/three/HookahScene.tsx` | DELETED |
| `client/src/components/ThreeSmoke.tsx` | DELETED |
| `client/src/pages/HomePage.tsx` | GSAP layers + dynamic data |
| `client/src/pages/BookingPage.tsx` | GSAP layers + DB flavors + gold |
| `client/src/layouts/MainLayout.tsx` | Removed ThreeSmoke import |
| `client/src/components/ui/GlowButton.tsx` | Gold glow shadow |
| `client/src/index.css` | Gold glow utilities, glass/input/button gold |
| `client/tailwind.config.ts` | Gold glow shadows |
| `client/package.json` | gsap added, three removed |
