# parcelFlow_Frontend

## Commands (from package.json "scripts")
- Dev server: `npm run dev`
- Build: `npm run build` (`tsc -b && vite build`)
- Preview build: `npm run preview` (`vite preview --port 4173`)
- Lint: `npm run lint` (`eslint .`)
- Typecheck: `npm run typecheck` (`tsc -b --noEmit`)

No test script is defined in package.json.

## Rules observed
- `VITE_*` env vars are inlined at **build time**, not runtime (README.md, "Environment"). Changing
  `VITE_API_BASE_URL` on Vercel requires a redeploy — saving the variable alone does nothing.
- `vercel.json` must keep the `/api/:path*` proxy rewrite listed **before** the SPA fallback rewrite
  — the first matching rewrite wins (README.md, "Deploying to Vercel").
- `vercel.json` is validated against a strict schema that rejects unknown keys — no `"comment"`
  fields inside rewrites (README.md).
- `/parcels/new` must stay declared before `/parcels/:trackingCode` in src/App.tsx, or the literal
  path gets captured by the dynamic segment (comment in src/App.tsx).

## Read first
- README.md — env, deploy, backend-connection and troubleshooting notes
- src/App.tsx — route table and guard usage
- src/main.tsx — provider tree the whole app runs inside

Architecture: see ARCHITECTURE.md — read before structural changes
