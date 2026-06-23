# Admin Navigation Adaptive Fixes

## Problem

### 1. Missing "Back to site" button
Admin panel had no way to return to the main site without changing the URL manually.

**Fix:** Added a "На сайт" link (`House` icon) in:
- Desktop sidebar — bottom nav section after all admin links, separated by border
- Mobile header — next to the hamburger menu button as an icon-only link

### 2. Sidebar disappears on wide screens (lg+)
**Root cause:** `sidebarOpen` defaulted to `false`, and the sidebar `motion.aside` used `animate.x: sidebarOpen ? 0 : -280` on all screen sizes — translating the entire sidebar off-screen even on desktop where it's `position: static`.

**Fix:**
- `sidebarOpen` initial state now reads `window.innerWidth >= 1024`
- `isDesktop` is a reactive state variable (not a stale closure) derived from a `matchMedia('(min-width: 1024px)')` listener
- The sidebar `animate.x` is conditionally applied: `...(isDesktop ? {} : { x: sidebarOpen ? 0 : -280 })` — desktop sidebar stays in-flow and never gets translated off-screen
- A `useEffect` with `matchMedia` listener syncs both `sidebarOpen` and `isDesktop` on resize across the `lg` breakpoint

### 3. Responsive breakpoints audit
**No `md:` breakpoints used** — the app switches at `lg` (1024px) exclusively. All `hidden lg:*` / `* lg:hidden` pairs are complementary with no conflicts.

**Minor fix:** `MainLayout.tsx` `pb-16` → `pb-20` to provide safe clearance for the mobile bottom nav bar (fixed at `bottom-4`, ~60px total footprint).

## Files Changed
- `client/src/layouts/AdminLayout.tsx` — sidebar visibility, responsive state, "На сайт" button
- `client/src/layouts/MainLayout.tsx` — `pb-16` → `pb-20`
