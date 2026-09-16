# MetroFlow AI — Frontend

Operations dashboard for MetroFlow: live train tracking, real-time crowd monitoring, AI-driven demand/delay predictions, alerts, scheduling, and passenger check-in/out — built with Next.js (App Router) and React.

---

## 1. Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4 |
| State (server data) | Redux Toolkit Query (`createApi` with a custom axios base query) |
| State (client/UI) | React Context (`AuthProvider`, `LiveSocketProvider`) + local component state |
| Charts | Recharts |
| Forms | react-hook-form |
| Animation | Framer Motion |
| Auth | Supabase (`@supabase/ssr`, `@supabase/supabase-js`) |
| HTTP | Axios (single shared instance with interceptors) |
| Realtime | Native WebSocket client wrapped in a React provider |

## 2. Architecture overview

```
┌───────────────────────────────────────────────────────────────┐
│                      Next.js App Router                        │
│                                                                  │
│  app/(auth)/     login, signup, forgot-password, reset-password│
│  app/(dashboard)/  dashboard, live-trains, crowd-monitor,       │
│                     ai-prediction, alerts, analytics,           │
│                     checkin-checkout, enquiries, notifications, │
│                     profile, reports, stations, users,          │
│                     system-status, system-logs, train-scheduling│
│                                                                  │
│  providers/                                                     │
│    AuthProvider        — Supabase session + role, or mock auth │
│    LiveSocketProvider  — one shared WebSocket connection,       │
│                           pub/sub to any component via events   │
│                                                                  │
│  store/apiSlice.ts (RTK Query) ─┐                               │
│  hooks/useApiData.ts ───────────┼──► lib/axios.ts ──► Backend   │
│  lib/api/*.ts (per-domain calls)┘         (REST /api/v1/*)     │
│                                                                  │
│  LiveSocketProvider ────────────────────► Backend               │
│                                            (WebSocket /ws/monitor)│
└───────────────────────────────────────────────────────────────┘
```

The app talks to the backend two ways at once:
1. **REST** for on-demand reads/writes (RTK Query + a thin `lib/api/*.ts` wrapper per domain — auth, trains, stations, crowd, schedules, predictions, analytics, alerts, enquiries, notifications, users, meta, chatbot).
2. **WebSocket** (`/ws/monitor`) for push updates — live train positions, crowd-level changes, new alerts/notifications — so pages like Live Trains and Crowd Monitor update without polling.

## 3. Real-time data flow (how "live" pages actually update)

1. `LiveSocketProvider` (`providers/LiveSocketProvider.tsx`) opens **one** WebSocket connection for the whole app, resolved from `NEXT_PUBLIC_API_URL` (swapping `http→ws`/`https→wss`), or falling back to `window.location` if that env var isn't set.
2. Auth for the socket is sent via the `Sec-WebSocket-Protocol` header (not a `?token=` query param) — this keeps the access token out of server logs, proxy logs, and browser history. The token is re-resolved on every (re)connect, so a token refresh or a login/logout during the session is picked up automatically.
3. Any component calls `useLiveSocket()` / subscribes through the provider's `subscribe(event, listener)` to react to specific event types (`crowd_update`, `train_position`, `alert`, `notification`, …) without each component managing its own socket.
4. On reconnect, the provider immediately requests a state resync so a page never shows stale data after a dropped connection — it doesn't wait for the next tick.
5. `hooks/useApiData.ts` bridges live socket events into RTK Query's cache (`invalidateApiData`), so a live push can invalidate/refresh the same cached data a REST call would have fetched — the UI doesn't hold two separate copies of the same state.

## 4. Authentication flow

- `AuthProvider` wraps the app, holds the current Supabase session + resolved role, and gates the `(dashboard)` route group.
- Every outgoing request (`lib/axios.ts` interceptor) attaches the current Supabase access token as `Authorization: Bearer <token>` automatically — no manual header-setting anywhere else in the codebase.
- **Dev-only mock auth** (`lib/auth/mock.ts`): when `NEXT_PUBLIC_AUTH_DISABLED=true`, a mock email (stored in a cookie) is sent as the bearer token instead of a real Supabase session — useful for local development without a Supabase project. This is inert against a properly configured backend: the backend only honors it if *its own* `AUTH_DISABLED` **and** `DEBUG` are both true, so a stray frontend flag can never bypass real auth in production.
- Profile fetch has its own retry/backoff loop (`AuthProvider`) that distinguishes "session actually rejected" (log the user out) from "auth service momentarily unreachable" (retry, don't log out) — so a flaky network blip during login doesn't kick a valid user back to the login page.

## 5. Pages (route groups)

| Group | Routes | Purpose |
|---|---|---|
| `(auth)` | `/login`, `/signup`, `/forgot-password`, `/reset-password` | Unauthenticated flows via Supabase |
| `(dashboard)` | `/dashboard` | KPI overview, activity timeline, AI insights |
| | `/live-trains` | Real-time train positions on a map, live list |
| | `/crowd-monitor` | Station heatmap, density gradient, per-station drill-down |
| | `/ai-prediction` | Crowd/delay/frequency predictions + model performance/feature-importance cards |
| | `/checkin-checkout` | Passenger check-in/check-out |
| | `/train-scheduling` | Schedule management, delay/frequency adjustments |
| | `/alerts` | Alert feed, acknowledgement/resolution |
| | `/analytics` | Operational summary, traffic reports, passenger-flow overview |
| | `/enquiries` | Enquiry inbox + stats |
| | `/notifications` | Notification center (read/unread, bin) |
| | `/stations`, `/users`, `/reports`, `/profile` | Admin/reference data & reports |
| | `/system-status`, `/system-logs` | Live backend health, scheduler/simulator status, log viewer |

## 6. Project layout

```
src/
  app/
    (auth)/            Login, signup, password flows
    (dashboard)/        One folder per dashboard page (page.tsx + local components)
  components/
    dashboard/          KPIs, maps, model-performance cards, feature-importance charts
    layout/             Shell, nav, headers
    auth/ users/ profile/ operations/ chatbot/ home/ icons/ ui/
  providers/            AuthProvider, LiveSocketProvider, StateProvider
  store/                Redux store + RTK Query apiSlice
  hooks/                useApiData, useLiveSocket, useStations, useRoutePrefetch, ...
  lib/
    api/                One file per backend domain (trains.ts, crowd.ts, predictions.ts, ...)
    auth/               Supabase client + dev mock auth
    supabase/           Supabase client factory
    axios.ts            Shared axios instance + interceptors
```

## 7. Environment variables

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase project (auth) |
| `NEXT_PUBLIC_API_URL` | Backend base URL — also used to derive the WebSocket URL |
| `NEXT_PUBLIC_AUTH_DISABLED` | Dev-only mock-auth toggle (see §4) |
| `NEXT_PUBLIC_TRAIN_TRACK_INTERVAL_SECONDS` | Client-side fallback poll interval for train tracking |

## 8. Local development

```bash
npm install
cp .env.example .env.local     # fill in Supabase + backend URL
npm run dev                    # http://localhost:3000
```

Requires the backend running (see the backend README) at the URL set in `NEXT_PUBLIC_API_URL`.

Production build:
```bash
npm run build
npm run start
```
