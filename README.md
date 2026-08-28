# ParcelFlow Frontend

Web client for the [ParcelFlow API](https://github.com/ALPHAMAN-0/ParcelFlowApi) — parcel delivery
management with three roles, a strictly linear status flow, and an append-only audit trail.

A static single-page app: Vite 6, React 19, TypeScript, Tailwind CSS 4, React Router 7,
TanStack Query 5. No backend of its own — it talks to the API over HTTPS with a Bearer token.

- **Live API:** `https://parcelflowapi.onrender.com`
- **Deploys to:** Vercel (static `dist/`)

## Contents

- [Quick start](#quick-start)
- [Environment](#environment)
- [Deploying to Vercel](#deploying-to-vercel)
- [Connecting to the Render backend](#connecting-to-the-render-backend)
- [Demo accounts](#demo-accounts)
- [What each role can do](#what-each-role-can-do)
- [Project structure](#project-structure)
- [Notes on a few decisions](#notes-on-a-few-decisions)
- [Troubleshooting](#troubleshooting)

## Quick start

```bash
npm install
cp .env.example .env.local   # already points at the deployed API
npm run dev                  # http://localhost:5173
```

| Command | |
|---|---|
| `npm run dev` | Dev server with HMR |
| `npm run build` | Typecheck (`tsc -b`) then build to `dist/` |
| `npm run preview` | Serve the built `dist/` on :4173 |
| `npm run typecheck` | Types only |

To develop against a local API instead, set `VITE_API_BASE_URL=http://localhost:3000` in
`.env.local` and restart the dev server.

## Environment

One variable:

```
VITE_API_BASE_URL=/api
```

`/api` is **same-origin**: `vercel.json` rewrites `/api/*` to the Render service, and
`vite.config.ts` mirrors that for local dev. Requests therefore leave the browser as
`your-site.vercel.app/api/health`, never as `parcelflowapi.onrender.com/health`.

That indirection is not cosmetic. A direct cross-origin call to `onrender.com` is blocked outright
by some ad-blocker filter lists and by corporate `URLBlocklist` policies — free-hosting domains get
blanket-blocked because they are abused. The browser reports `net::ERR_BLOCKED_BY_CLIENT`, the
request never leaves the machine, and **every** API call fails: login included, not just the health
dot. A first-party path cannot be singled out that way. This was a real failure, not a hypothetical.

A direct URL still works if you prefer it:

```
VITE_API_BASE_URL=https://parcelflowapi.onrender.com
```

Leaving the variable unset falls back to `/api`.

**Vite inlines `VITE_*` at build time, not run time** — the value is baked into the JS bundle.
Changing it on Vercel therefore needs a **redeploy**; saving the variable alone does nothing.

The footer of every page shows the API host it resolved, with a live health dot. That is the
quickest way to confirm a deployment picked up the right value.

## Deploying to Vercel

This repo is the project root, so no "Root Directory" override is needed.

1. **Vercel → Add New → Project**, import `ALPHAMAN-0/parcelFlow_Frontend`.
2. Vercel detects Vite. Confirm the defaults:
   - Framework preset: **Vite**
   - Build command: `npm run build`
   - Output directory: `dist`
   - Install command: `npm install`
3. Under **Environment Variables**, add — for Production, Preview *and* Development:

   | Key | Value |
   |---|---|
   | `VITE_API_BASE_URL` | `/api` |

4. **Deploy.**

`vercel.json` is committed and handles the two things a static SPA needs:

- a rewrite so deep links like `/parcels/PF-YUH5F-P6VFX` reach `index.html` instead of 404ing —
  without it, every URL except `/` breaks on refresh;
- cache headers: `index.html` revalidates every time, `/assets/*` (content-hashed) is immutable
  for a year.

## Connecting to the Render backend

Nothing has to change on the API side. The wiring lives entirely in `vercel.json`:

```json
{ "source": "/api/:path*", "destination": "https://parcelflowapi.onrender.com/:path*" }
```

Vercel proxies the request at its edge, forwarding method, body and headers — verified with a
`POST /api/auth/login` (200, token returned) and an authenticated `GET /api/admin/stats` (200).
Because the browser only ever talks to its own origin, **CORS does not apply at all** and no
preflight is sent.

If you switch to a direct cross-origin URL instead, it also works unchanged: `ParcelFlowApi`
uses bare `app.use(cors())`, so it answers `Access-Control-Allow-Origin: *`, and auth is an
`Authorization: Bearer` header rather than a cookie (the client sends `credentials: 'omit'`, since a
wildcard origin forbids credentialed requests).

### Known trade-off: shared rate limiting

The proxy has one real cost, measured rather than assumed. The API keys its rate limiter on
`cf-connecting-ip`, which Cloudflare sets to whoever connects *directly*. Behind the proxy that is
Vercel's edge, not the visitor — so all visitors share one bucket:

| Limit | Per visitor (direct) | Shared (proxied) |
|---|---|---|
| Login | 10 / 15 min | 10 / 15 min **total** |
| Tracking lookup | 60 / min | 60 / min **total** |

Confirmed by probing: spoofing `x-forwarded-for` does not move the bucket (`r=57 → r=56 → r=55`,
one continuous counter), and `cf-connecting-ip` cannot be spoofed from outside — Cloudflare answers
403. Fixing this properly would mean changing the API's `keyGenerator`, which is out of scope for
this repo.

Fine for a demo. If you need per-visitor limits back, the clean fix is a **custom domain** for the
API (`api.yourdomain.com` → Render): blocklists targeting `onrender.com` stop matching *and*
requests go direct, so the real client IP is preserved. Then set `VITE_API_BASE_URL` to it.

### Cold starts

Render's free tier spins a service down after roughly 15 minutes idle. The next request waits
30–60 seconds while it boots. The client handles this rather than failing:

- normal request timeout is 15s;
- on a network-level failure or a 502/503 it retries **once** with a 70s timeout;
- while that retry is in flight, an amber banner explains the wait.

Retries are deliberately limited to GETs and network failures. A `POST /parcels` is never retried —
that would risk creating two parcels — and a 409 or 422 is a real answer, not a blip.

### If you redeploy the API to a different URL

Change `VITE_API_BASE_URL` in Vercel, then **redeploy** (Deployments → ⋯ → Redeploy). Update
`.env.example` and `.env.local` for local work.

### Render service settings the API expects

For reference — nothing here is managed by this repo:

| Setting | Value |
|---|---|
| Build command | `npm install && npx prisma generate && npx prisma migrate deploy` |
| Start command | `npm start` |
| Node version | 22 (the API reads `.env` via `process.loadEnvFile()`) |
| Env vars | `NODE_ENV=production`, `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `BCRYPT_ROUNDS`, optionally `REDIS_URL`, `SEED_*` |

`PORT` is injected by Render and read by `server.js`. Do not set it manually.

## Demo accounts

Seeded on the deployed database. The sign-in page fills these in on a click.

| Role | Email | Password |
|---|---|---|
| Admin | `admin@parcelflow.dev` | `admin123` |
| Delivery staff | `rahim.staff@parcelflow.dev` | `staff123` |
| Delivery staff | `karim.staff@parcelflow.dev` | `staff123` |
| Customer | `ayesha.customer@parcelflow.dev` | `customer123` |
| Customer | `tanvir.customer@parcelflow.dev` | `customer123` |

> These are published on the public landing page, **including the admin**, so anyone who opens the
> site can administer the demo database. That is usually what you want for a portfolio demo. To
> lock it down, edit `DEMO_ACCOUNTS` in `src/routes/pages/demoAccounts.ts` — drop the admin row, or
> empty the array to hide the panel entirely.

## What each role can do

| | Customer | Delivery staff | Admin |
|---|---|---|---|
| Sees | own parcels | assigned parcels | everything |
| Create a parcel | ✅ | — | ✅ |
| Advance status | — | ✅ own only | ✅ |
| Assign a courier | — | — | ✅ |
| Statistics, users | — | — | ✅ |

The status flow is strictly linear and `DELIVERED` is terminal:

```
PENDING → PICKED_UP → IN_TRANSIT → OUT_FOR_DELIVERY → DELIVERED
```

Because there is at most one legal next status from any state, the UI offers a single
"Mark <next>" button rather than a status picker — a dropdown of five would be four guaranteed
409s. `DELIVERED` gets a confirmation dialog, since it cannot be undone.

The route guards here are for navigation, not security. The API re-checks the role on every
request and scopes every query in SQL, so bypassing the client gets you a 403 or an empty list.
A parcel outside your scope returns **404, not 403** — a 403 would confirm it exists — and the UI
phrases it as "not found, or not visible to your account".

## Project structure

```
src/
  lib/        apiClient.ts   the only module that knows HTTP or the response envelope
              ApiError.ts    typed errors carrying code + details + requestId
              errorMessages.ts  every API error code → copy a user can act on
              config.ts  format.ts  storage.ts  queryKeys.ts  cn.ts
  domain/     parcelStatus.ts   mirrors the API's transition table
              trackingCode.ts   mirrors the API's code format + alphabet
  types/      api.ts       transcribed from the API's Prisma selects
  api/        auth.ts  parcels.ts  admin.ts  health.ts
  hooks/      useAuth.tsx  useParcels.ts  useAdmin.ts  useToast.tsx
              useTheme.tsx  useApiHealth.ts  useDebounced.ts
  components/ layout/  ui/  parcels/  admin/
  routes/     guards.tsx  pages/
```

`src/domain/` deliberately duplicates two small API modules. Each file names its counterpart in a
header comment. The API remains the authority — it re-validates everything — but the copy lets the
UI offer only legal actions and reject a malformed tracking code without spending a request.

## Notes on a few decisions

**Empty query params are dropped, not sent.** Every API schema is a Zod `strictObject`, so
`GET /parcels?status=` is a hard `422` rather than "no status filter". `buildQueryString()` in
`apiClient.ts` omits `undefined`, `null` and `''`, which is what keeps an unset filter from
breaking the page. Same reason `?search=` is omitted when the box is empty.

**Detail pages are keyed by tracking code, not id.** `GET /parcels/:trackingCode` is the API's
catch-all for any single-segment GET, so `GET /parcels/<uuid>` returns a 422, not a parcel. That one
request also returns the full history, so the detail page needs exactly one call.

**A 401 does not always mean the session died.** `INVALID_CREDENTIALS` is a 401 too, but it means a
wrong password on the login form. The client only ends the session for `TOKEN_MISSING`,
`TOKEN_EXPIRED`, `TOKEN_INVALID` and `USER_NOT_FOUND` — otherwise a mistyped password would bounce
the user off the page they were trying to use.

**Password minimum is 1, not 8.** The API's README says 8, but `auth.schemas.js` is `min(1)`.
Gating at 8 in the client would lock out the seeded demo logins. The max of 72 is real: bcrypt
ignores anything past 72 bytes, so two different long passwords could unlock one account.

**Counts come from `meta.total`.** The customer and staff dashboards issue five
`GET /parcels?limit=1&status=X` reads and read `meta.total` from each. Five small requests, but
exact — and `/parcels` is not rate limited, unlike the tracking endpoint (60/min).

**No charts library.** The statistics bars are ~40 lines of CSS and SVG. A charting dependency
would have added tens of kilobytes to draw five rows whose lengths are one division each.

**Session is `localStorage` + revalidation.** The token and a cached user paint the app instantly
on reload; `GET /auth/me` then confirms it. The API re-reads the user from the database on every
request, so a role change an admin made while the tab was closed applies immediately. A network
failure during that check keeps the cached session rather than signing the user out over a blip.

## Troubleshooting

| Symptom | Cause |
|---|---|
| `net::ERR_BLOCKED_BY_CLIENT` on every API call | An ad blocker or a corporate `URLBlocklist` is blocking the request client-side. Confirm at `chrome://policy`. Fixed by the `/api` proxy — make sure `VITE_API_BASE_URL` is `/api` and you have redeployed. |
| Footer shows the wrong host on a deployed build | `VITE_API_BASE_URL` changed but the build did not. **Redeploy** — saving the variable alone is not enough, Vite inlines it at build time. |
| First request after idle takes ~a minute | Render free-tier cold start. The amber banner is expected; it resolves itself. |
| Refreshing `/parcels/PF-…` 404s | The SPA rewrite in `vercel.json` is not being applied. Confirm the file is committed and the output directory is `dist`. |
| `/api/...` returns Vercel's 404 page | The `/api/:path*` rewrite is missing or listed *after* the SPA fallback. The first matching rewrite wins, so it must come first. |
| "Too many sign-in attempts" | The API allows 10 logins per 15 minutes per IP. Wait it out. |
| Every filter returns a validation error | Something is serialising empty params. Filters must be omitted when blank, not sent as `''`. |
