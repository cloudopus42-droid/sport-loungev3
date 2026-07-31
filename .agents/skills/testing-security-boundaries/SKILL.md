---
name: testing-security-boundaries
description: Test SPORT LOUNGE backend CORS, Socket.IO JWT authorization, registration roles, and per-user order authorization end-to-end.
---

# Security boundary runtime testing

## Devin Secrets Needed

For full database-backed testing:
- `JWT_SECRET`
- `SUPABASE_URL`
- `SUPABASE_KEY`
- `SUPABASE_ANON_KEY`

No secrets are needed for CORS and Socket.IO handshake testing when `NODE_ENV=test`; the repo supplies non-production test defaults.

## Setup notes

- Install backend dependencies with `npm ci` in `server/`.
- The normal `server/src/server.ts` startup runs migrations and database connectivity checks before listening. It therefore needs real Supabase credentials even when testing routes that do not query the database.
- For isolated CORS/socket runtime tests, create a temporary harness that imports `app` from `server/src/app.ts`, creates an HTTP server, calls `initSocket(server)`, and listens on a non-default port. Remove the harness after testing.
- On Node 20, Supabase Realtime needs the repository's `ws` polyfill; use the committed dependency rather than changing Node globals in the harness.

## High-signal assertions

1. Send `Origin: http://localhost:5173` to `/api/health`; confirm the exact origin is returned in `Access-Control-Allow-Origin`.
2. Send an unconfigured origin to `/api/health`; confirm the response has no `Access-Control-Allow-Origin` header.
3. Connect an anonymous Socket.IO client and emit `user:active` with forged `role: admin` / `isAdmin: true`; trigger an admin-room broadcast and confirm the client receives nothing.
4. Connect with a valid admin JWT; confirm the same admin-room broadcast is received.
5. Connect with an invalid JWT; confirm `connect_error` is `Unauthorized`.
6. With a real seeded DB, register using an admin-looking email and verify the stored/API role is `user`.
7. With two seeded users and one order, verify a normal user cannot list all orders or access another user's order, while an admin can.

## Evidence and cleanup

- Capture exact response headers and Socket.IO event results.
- Never print JWT secrets or Supabase keys.
- Remove temporary harnesses and verify `git status --short` is clean before finishing.
