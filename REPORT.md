# SPORT LOUNGE — Full Project Report

## Overview
Premium hookah lounge web application with React/TypeScript frontend, Express/Node.js backend, and Supabase (PostgreSQL) database. Features a smart feature toggle system, auto tobacco restock, admin dashboard with real-time KPIs, and glassmorphism UI design.

## Architecture
- **Client**: React 19 + TypeScript + Vite + Tailwind CSS + framer-motion + Three.js (R3F)
- **Server**: Express.js + TypeScript + Zod validation + Supabase SDK + Telegram bot
- **Database**: Supabase (PostgreSQL) with Row-Level Security — 30 tables
- **Deployment**: GitHub Pages (client) via GitHub Actions
- **Mobile**: Capacitor + Tauri wrappers

## Directory Structure
```
client/                       # React frontend
  src/
    pages/                    # 23 page components (11 public + 12 admin)
      admin/                  # 12 admin dashboard pages
    layouts/                  # MainLayout + AdminLayout
    components/
      ui/                     # 13 UI components (GlassCard, LiquidGlass, etc.)
      icons/                  # 23 animated SVG icons with spring hover/tap
    contexts/                 # AuthContext, FeatureContext, SocketContext
    lib/                      # api.ts, supabase.ts, socket.ts, urls.ts
    config/                   # seats.ts
    types/                    # TypeScript interfaces
    hooks/                    # Custom React hooks
server/                       # Express backend
  src/
    routes/                   # 22 route files (auth, bookings, menu, etc.)
    middleware/               # auth, rateLimiter, upload, errorMonitor, isAdmin, requestLogger, errorHandler
    config/                   # env.ts, supabase.ts
    schemas/                  # 10 Zod schema files
    services/                 # errorMonitor, telegram, orderScheduler, supportBot
    socket/                   # Socket.io real-time
supabase/
  migrations/                 # v1-v6 SQL migrations (30 tables)
```

## Key Features

1. **Smart Features System** — 13 toggleable features across 4 categories (guest, marketing, system, ai)
2. **Auto Tobacco Restock** — Per-flavor thresholds, automatic restock_requests on consumption
3. **Admin Dashboard** — Live booking queue, taste analytics, real-time KPIs, hookah status progression
4. **Navigation** — Glassmorphism sticky header, mobile bottom bar, collapsible admin sidebar with tooltips
5. **Custom SVG Icons** — 23 animated Nocturnal Noir icons with spring hover/tap via framer-motion
6. **Admin Logging** — `admin_logs` table with dedicated admin-only log viewer page
7. **Error Monitoring** — In-memory buffer + Telegram alerts for critical errors
8. **Rate Limiting** — In-memory rate limiter on auth endpoints (5–10 req/min)
9. **AbortController** — All API calls cancellable via signal, prevents memory leaks
10. **Liquid Glass** — Reusable glassmorphism components with 5 visual variants
11. **Knowledge Graph** — Interactive node/edge graph for lounge topics
12. **Membership System** — Loyalty tiers, achievements, and reward tracking
13. **3D Smoke Effect** — Three.js particle system via @react-three/fiber

## Security
- JWT auth with httpOnly-compatible token flow
- Zod validation on ALL 10 schema files
- Rate limiting on sensitive endpoints (auth, bookings)
- Auth middleware on all protected admin routes
- Error monitor catches and logs without leaking stack traces to clients
- All SVG icons use `currentColor` (design system safe)
- CORS configured for production domain

## Performance
- Build: 0 errors, 0 warnings (Vite + tsc)
- Chunks: 37 total, ~900 KB gzipped
- Lazy loading: All 12 admin pages are code-split with React.lazy
- Memory: All useEffects cleaned up, AbortController on every fetch, socket cleanup on unmount
- Image optimization: Static assets served through Vite

## Environment Variables Required
```
SUPABASE_URL=
SUPABASE_KEY=
SUPABASE_ANON_KEY=
JWT_SECRET=                  (min 32 chars)
TELEGRAM_TOKEN=              (optional — error alerts)
TELEGRAM_CHAT_ID=            (optional)
```

## Deployment
Push to `main` triggers GitHub Actions to build the client and deploy to GitHub Pages:
- **URL**: `https://cloudopus42-droid.github.io/sport-loungev3/`

## Database Tables (30)
`users`, `bookings`, `posts`, `post_likes`, `post_comments`, `mixes`, `promos`, `showcases`, `invitations`, `invitation_participants`, `stories`, `tobacco_transactions`, `hookah_replacements`, `knowledge_nodes`, `knowledge_edges`, `memberships`, `users_membership`, `loyalty_transactions`, `achievements`, `achievement_unlocks`, `favorite_tables`, `favorite_flavors`, `notifications`, `activity_logs`, `analytics_events`, `reviews`, `review_replies`, `promo_redemptions`, `restock_requests`, `admin_logs`
