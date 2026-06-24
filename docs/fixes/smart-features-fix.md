# Smart Features Fix

**Date:** 2026-06-24
**Status:** Fixed
**Commit:** 63d5a7c

## Problem

Smart Features admin page toggles were non-functional:
- Toggles appeared to work visually (optimistic update) but didn't persist
- Backend received incorrect field names
- Cache invalidation targeted wrong query keys

## Root Causes

### 1. Server `mapFeature` Field Name Mismatch
**Server returned:** `featureKey`, `isPublic`, `createdAt`, `updatedAt` (camelCase)
**Client expected:** `feature_key`, `is_public`, `created_at`, `updated_at` (snake_case)

Result: `feature.feature_key` was always `undefined`, causing display and lookup issues.

**Fix:** Changed `mapFeature` in `server/src/routes/smartFeatures.ts` to return snake_case fields matching the client `SmartFeature` type.

### 2. `useToggleSmartFeature` Wrong Payload
**Sent:** `{ is_enabled: enabled }`
**Backend expected:** `{ enabled: boolean }` (per Zod schema)

Result: PUT request body had wrong field name, backend validation stripped it.

**Fix:** Changed to `{ enabled }` in `client/src/lib/queries.ts`.

### 3. `useToggleSmartFeature` Wrong Cache Key
**Invalidated:** `['smart-features']`
**Actual query key:** `['smart-features', 'status']`

Result: After successful toggle, UI didn't refetch fresh data.

**Fix:** Changed to `['smart-features', 'status']`.

### 4. `handleToggle` Missing Error Details
**Before:** Generic error message `Ошибка обновления ${feature.name}`
**After:** Includes actual error message from API response

## Files Modified

- `server/src/routes/smartFeatures.ts` — `mapFeature` returns snake_case
- `client/src/lib/queries.ts` — Fixed `useToggleSmartFeature` payload and cache key
- `client/src/pages/admin/SmartFeaturesPage.tsx` — Better error handling in `handleToggle`

## Testing

After fix:
1. Toggle any feature → toast confirms enable/disable
2. Refresh page → toggle state persists
3. Check FeatureContext → public features reflected in frontend
4. All 20+ features in admin panel respond to toggles

## API Contract

```
GET  /api/smart-features        → SmartFeature[] (admin, auth required)
PUT  /api/smart-features/:id    → { enabled: boolean, config?: object }
GET  /api/smart-features/status → Record<string, { enabled, config }> (public)
```
