# Lighthouse Checklist (Target ≥90)

> Generated: 2026-06-22
> Dev server was not running on port 5173. Run `npm run dev` from root, then `npx lighthouse http://localhost:5173 --view` to get actual scores.

## Performance (Target: ≥90)
- [ ] Images properly sized with `width`/`height` and lazy loading
- [ ] JavaScript minified — handled by Vite build
- [ ] CSS minified — handled by Tailwind + PostCSS
- [ ] No render-blocking resources in production build
- [ ] Proper caching headers — handled by GitHub Pages
- [ ] Code splitting verified — 12 admin pages use `React.lazy()`
- [ ] Bundle size ≤ 900 KB gzipped — 37 chunks total

## Accessibility (Target: ≥90)
- [ ] All navigations have `role="navigation"` and `aria-label`
- [ ] All images have meaningful `alt` text
- [ ] Color contrast ratio ≥ 4.5:1 for body text
- [ ] Focus indicators visible on all interactive elements
- [ ] `prefers-reduced-motion` respected in framer-motion animations
- [ ] Form inputs have associated `<label>` elements
- [ ] ARIA labels on icon-only buttons

## Best Practices (Target: ≥90)
- [ ] HTTPS enabled — enforced by GitHub Pages
- [ ] No console errors on page load
- [ ] No deprecated APIs used
- [ ] Proper error boundaries in place
- [ ] Dependencies up to date (React 19, Vite 6+)

## SEO (Target: ≥90)
- [ ] `<meta name="description">` present
- [ ] Open Graph tags (`og:title`, `og:description`, `og:image`)
- [ ] Semantic HTML (`<header>`, `<main>`, `<footer>`, `<section>`)
- [ ] Heading hierarchy (`h1` → `h2` → `h3`), single `h1` per page
- [ ] `rel="canonical"` on all pages
- [ ] `robots.txt` and `sitemap.xml` for production
