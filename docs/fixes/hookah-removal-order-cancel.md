# Hookah Imagery Removal + Order Cancellation + Stuck Orders Fix

**Date:** 2026-06-24
**Commit:** e7dcf18

## Changes Made

### 1. Hookah Imagery Removed
- Deleted `client/src/components/CssSmoke.tsx` (CSS-only smoke component)
- Deleted `client/src/premium_hookah.png` (hookah image)
- `BookingPage.tsx`: removed CssSmoke + premiumHookah imports and rendering, redesigned to single-column full-width form layout
- `HomePage.tsx`: removed hookah visualizer card (VOLUMETRIC VISUALIZER), kept system widgets (host load, smoke intensity, audio)

### 2. Order Cancellation Flow
- `server/src/routes/orders.ts`: added `'cancelled'` to allowed statuses list
- `server/src/routes/orders.ts`: added `sendStatusNotification` import from `telegram.ts` for Telegram alerts on cancel
- `client/src/pages/admin/Dashboard.tsx`: added `cancelOrder()` handler with confirmation dialog
- `client/src/pages/admin/Dashboard.tsx`: added red XCircle cancel button next to each order's status advance button

### 3. Stuck Orders Fix (Critical)
- `client/src/pages/admin/Dashboard.tsx`: changed socket listeners from `booking:created`/`booking:updated` to `order:created`/`order:updated`
- Server emits `order:created` and `order:updated` events, but admin Dashboard was listening to `booking:*` — this mismatch caused the admin panel to never receive real-time order updates

### 4. Telegram Notifications (Already Working)
- `server/src/services/telegram.ts`: retry queue with 5 attempts, exponential backoff (30s → 30min), CodeTabs proxy fallback
- `server/src/services/adminBot.ts`: inline keyboard with ❌ Отменить button (`admin_cancel:{orderId}` callback), persists admin chat IDs
- `server/src/services/ordersTelegram.ts`: sends to both ORDER_BOT_TOKEN and MANAGER_BOT_TOKEN with proxy fallback
- `server/src/services/orderScheduler.ts`: checks every 30s for delayed orders, extends + sends alarm

## Files Modified
| File | Change |
|------|--------|
| `client/src/pages/BookingPage.tsx` | Removed hookah imagery, single-column form |
| `client/src/pages/HomePage.tsx` | Removed hookah visualizer card |
| `client/src/pages/admin/Dashboard.tsx` | Fixed socket events, added cancel button |
| `server/src/routes/orders.ts` | Added 'cancelled' status, sendStatusNotification |
| `client/src/components/CssSmoke.tsx` | DELETED |
| `client/src/premium_hookah.png` | DELETED |
