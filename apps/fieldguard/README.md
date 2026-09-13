# FieldGuard

A standalone React Native (Expo) app for delivery tamper/fraud detection: photo +
signature proof of delivery, offline-first capture, route optimization, and an
admin dashboard for reviewing flagged deliveries.

This is a fresh build, independent of `postman`/`postman-api` (Vite PWA + Express) —
it targets its own backend (Node/Express + Supabase, not yet built) rather than
reusing DakNet's Postgres/Drizzle stack.

## Layout

```
src/
  screens/       Login, delivery capture, dashboard, tamper alerts, route view, admin
  components/    PhotoCapture, SignaturePad, DeliveryMapView, RouteList
  api/           axios client + per-domain calls (delivery, tamper, route, auth)
  utils/         fraudScoring.ts (tamper-detection algorithm), locationUtils.ts,
                 offlineSync.ts (SQLite-backed local store + sync queue)
  database/      schema.ts (on-device SQLite DDL), supabaseSchema.sql (backend DDL)
  navigation/    React Navigation stack
```

## Status

**Working today, no backend required:**
- Full screen/navigation structure
- `fraudScoring.ts` — the tamper-detection algorithm (photo size variance,
  implausible delivery timing, GPS drift from the expected address, recipient
  identity mismatch, damaged/tampered condition flag → a 0–100 score)
- Offline-first capture: every delivery is written to on-device SQLite
  immediately (`utils/offlineSync.ts`) via `saveDeliveryLocally`, queued for
  sync, and retried with `flushSyncQueue` on app start / pull-to-refresh

**Needs a backend to do anything (stubbed against a not-yet-built API):**
- OTP login (`api/authApi.ts`)
- Delivery sync, server-side tamper re-check, flagged-delivery review
  (`api/deliveryApi.ts`, `api/tamperApi.ts`)
- Route optimization via a distance-matrix service (`api/routeApi.ts`)
- Admin analytics/export

Building that backend (Express API + Supabase schema — `src/database/supabaseSchema.sql`
is the intended DDL — plus UIDAI/DigiLocker verification and Google Distance
Matrix integration) is the next unit of work.

## Setup

```bash
cd apps/fieldguard
pnpm install
cp .env.example .env   # set EXPO_PUBLIC_FIELDGUARD_API_URL once a backend exists
pnpm start
```

Requires Expo Go (or a dev build) on a physical device/emulator for camera,
location, and SQLite to work — the web target won't exercise those paths.
