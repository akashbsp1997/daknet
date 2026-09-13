# FieldGuard

A single React Native (Expo) app that opens into a different layout depending
on who logs in: **addressee**, **sender**, **last-mile operative**, or
**admin/supervisor**. One codebase, one login screen, one build — the backend
tells the app which role an account is, and the root navigator swaps in the
matching set of screens.

This is a fresh build, independent of `postman`/`postman-api` (Vite PWA + Express) —
it targets its own backend (Node/Express + Supabase, not yet built) rather than
reusing DakNet's Postgres/Drizzle stack.

## How role-switching works

- `src/auth/AuthContext.tsx` holds the logged-in user (`{ id, name, phone, role }`),
  persisted in `AsyncStorage` so a restart doesn't force a re-login.
- `src/navigation/RootNavigator.tsx` picks the whole navigation stack from
  `user.role` — not logged in → `AuthStack` (just Login); logged in → one of
  `OperativeNavigator` / `AdminNavigator` / `SenderNavigator` / `AddresseeNavigator`.
- `LoginScreen` never decides the role or navigates anywhere itself — it just
  calls `setSession()` once OTP verification returns `{ token, user }`, and
  `RootNavigator` re-renders into the right layout automatically.

## Layout

```
src/
  auth/          AuthContext — session state + role, persisted locally
  types/roles.ts UserRole + AuthUser
  navigation/
    RootNavigator.tsx      Picks a stack by role
    AuthStack.tsx           Login only
    OperativeNavigator.tsx  Dashboard, DeliveryForm, RouteOptimization
    AdminNavigator.tsx      AdminHome, TamperAlerts
    SenderNavigator.tsx     SenderDashboard, CreateShipment, ShipmentDetail
    AddresseeNavigator.tsx  AddresseeHome, ParcelDetail, ReportIssue
  screens/
    LoginScreen.tsx
    operative/     Last-mile delivery capture (camera, signature, GPS, offline)
    admin/         Fraud-alert review, admin overview
    sender/        Book a shipment, track sent shipments, view proof of delivery
    addressee/     See incoming parcels, confirm receipt, report a problem
  components/    PhotoCapture, SignaturePad, DeliveryMapView, RouteList, LogoutButton
  api/           axios client + per-role calls (auth, delivery, tamper, route, sender, addressee)
  utils/         fraudScoring.ts (tamper-detection algorithm), locationUtils.ts,
                 offlineSync.ts (SQLite-backed local store + sync queue — operative only)
  database/      schema.ts (on-device SQLite DDL), supabaseSchema.sql (backend DDL)
```

## Who sees what

| Role | Home screen | Can do |
| --- | --- | --- |
| Operative (last-mile) | Today's Deliveries | Capture a delivery (photo, signature, GPS) offline-first, optimize today's route |
| Admin/supervisor | Admin | Review flagged/disputed deliveries, mark verified-safe or fraudulent |
| Sender | My Shipments | Book a new shipment, track status, view proof of delivery once it arrives |
| Addressee | My Parcels | See what's incoming, confirm receipt, report a problem (feeds admin's fraud queue) |

## Status

**Working today, no backend required:**
- All four role layouts and the role-based root navigator
- `fraudScoring.ts` — the tamper-detection algorithm (photo size variance,
  implausible delivery timing, GPS drift from the expected address, recipient
  identity mismatch, damaged/tampered condition → a 0–100 score)
- Offline-first capture for operatives: every delivery is written to on-device
  SQLite immediately (`utils/offlineSync.ts`), queued for sync, and retried on
  app start / pull-to-refresh

**Needs a backend to do anything (stubbed against a not-yet-built API):**
- OTP login + role resolution (`api/authApi.ts`)
- Delivery sync, server-side tamper re-check, flagged-delivery review
  (`api/deliveryApi.ts`, `api/tamperApi.ts`)
- Booking/tracking shipments as a sender (`api/senderApi.ts`)
- Viewing/confirming/reporting parcels as an addressee (`api/addresseeApi.ts`)
- Route optimization via a distance-matrix service (`api/routeApi.ts`)
- Admin analytics/export

Building that backend (Express API + Supabase schema — `src/database/supabaseSchema.sql`
is the intended DDL, including the `app_users` table that carries the role —
plus UIDAI/DigiLocker verification and Google Distance Matrix integration) is
the next unit of work.

## Setup

```bash
cd apps/fieldguard
pnpm install
cp .env.example .env   # set EXPO_PUBLIC_FIELDGUARD_API_URL once a backend exists
pnpm start
```

Requires Expo Go (or a dev build) on a physical device/emulator for camera,
location, and SQLite to work — the web target won't exercise those paths.
