# ADR-001: Global Market Globe — Phase 1 Architecture

**Status:** Proposed
**Date:** 2026-08-14
**Deciders:** Anant Sharma

## Context

We are building a public, read-only website that visualizes global stock-market
index data on an interactive 3D globe (see Phase 1 implementation brief). Key
forces:

- No auth, public MVP — cost and deploy simplicity matter.
- 3D WebGL globe with mouse/touch rotation, zoom, hover/click markers — this is
  inherently a React-heavy client concern (React Three Fiber is the dominant,
  best-maintained WebGL abstraction for React).
- Market-data provider credentials (INDstocks) must never reach the browser —
  requires a real server boundary, not just static hosting.
- INDstocks' exact instrument coverage is unconfirmed — the provider layer
  must be swappable behind an interface, and must fail safe (`UNAVAILABLE`,
  not mock data) in production.
- Small team (effectively solo), Phase 1 scope — every extra moving part
  (separate backend service, DB, Redis, message broker) is cost this team pays
  in operational overhead before it's earned.
- Repo state: this is **not a greenfield decision**. The working directory
  already contains a scaffolded Next.js 16 (App Router) + React 19 + TypeScript
  project with `@react-three/fiber`, `@react-three/drei`, `three`, `zod`,
  `swr`, Vitest, `@playwright/test`, Tailwind v4, ESLint, Prettier, and pnpm
  already installed (see `package.json`). Re-scaffolding onto a different
  stack would mean discarding a correctly-matched setup that's already in
  place.

## Decision

Use a **single Next.js (App Router) TypeScript application** for Phase 1: one
deployable unit serving both the public UI and the backend-protected
market-data API via Route Handlers. No separate backend service, no database,
no Redis, for Phase 1.

## Architecture recommendation

| Layer | Choice | Notes |
|---|---|---|
| Language | TypeScript (strict mode) | Shared types across UI and API, no serialization boundary to hand-maintain |
| App framework | Next.js 16, App Router | Already scaffolded; Route Handlers give a real server boundary for secrets |
| UI library | React 19 | Required by React Three Fiber |
| Styling | Tailwind CSS v4 | Already scaffolded; utility-first, fast iteration |
| 3D/globe | Three.js + React Three Fiber + Drei | Declarative R3F fits React state (marker hover/click) far better than imperative Three.js or a black-box globe library (e.g. `react-globe.gl`) that fights custom marker/tooltip needs |
| Validation | Zod | Already scaffolded; validates all external provider responses at the API boundary |
| Data fetching (client) | SWR (already installed) with polling interval | Simple `useMarkets()` hook; no WS complexity needed for index-level data that updates every few seconds at most |
| Real-time transport | Polling via SWR `refreshInterval`, not WebSocket | Index snapshot data does not need sub-second push; polling is operationally simpler and works everywhere (see Alternatives) |
| Backend | Next.js Route Handlers (`src/app/api/**/route.ts`) | No separate Node service needed at this scale |
| Persistence | None (in-memory cache only) | No historical data, no accounts in Phase 1 — a DB would be unjustified complexity |
| Shared cache/rate limit | In-memory (per-instance) | Deploy as a single instance/region for Phase 1; revisit if horizontally scaled |
| Unit tests | Vitest (already installed) | |
| E2E tests | Playwright (already installed) | |
| Lint/format | ESLint + Prettier (already installed) | |
| Package manager | pnpm (already the repo's manager) | |
| Deployment | Vercel (or any Node 20+ host) | Zero-config for Next.js, generous free tier for public MVP |

## Decision rationale

- **3D UI is inherently React-based.** Hover/click-to-lock marker interactions,
  tooltips, and a detail panel all need to share state with the scene graph.
  React Three Fiber lets the globe, markers, and React UI state live in the
  same component tree instead of bridging an imperative Three.js scene to
  React by hand.
- **Frontend/backend type sharing removes a whole class of bugs.** The
  `Market`/`MarketInstrument` types, `MarketDataProvider` interface, and Zod
  schemas can be written once in `src/features/markets/` and imported by both
  Route Handlers and client components — no OpenAPI generation step, no
  hand-synced DTOs.
- **A public read-only MVP doesn't need a distributed system.** No user
  accounts, no writes, no historical persistence in Phase 1. A database or
  Redis would be solving problems this product doesn't have yet — the brief
  explicitly says not to add them without justification.
- **Secrets stay server-side for free.** Route Handlers run only on the
  server; there's no risk of a client bundle accidentally including an
  INDstocks API key, unlike a static SPA that talks to a serverless function
  only for some paths.
- **The repo is already this stack.** `package.json` shows Next 16, React 19,
  R3F/Drei/Three, Zod, SWR, Vitest, Playwright, Tailwind v4, pnpm all present.
  Choosing anything else means throwing away a correct, already-installed
  setup for no functional gain.
- **Provider architecture stays decoupled regardless of backend choice.** The
  `MarketDataProvider` interface, `MockMarketDataProvider`, and
  `IndstocksMarketDataProvider` are plain TypeScript modules with no
  dependency on Next.js — if a separate backend service becomes necessary
  later (see Migration path), this layer moves with zero interface changes.

## Alternatives

| Option | 3D/WebGL fit | Secret protection | Type sharing | Real-time | Ops complexity | Verdict |
|---|---|---|---|---|---|---|
| **Next.js App Router (single app)** — *chosen* | Native (R3F is a React lib) | Route Handlers run server-only | Full (same TS project) | Polling now, WS later if needed | Lowest — one deploy | Best fit for Phase 1 scope |
| React + Vite + separate backend (Express/Fastify) | Same (still R3F) | Good, if backend is truly separate | Needs a shared `packages/types` in a monorepo, or manual duplication | Same options available | Two services to deploy, build, and version together | Justified only once the backend needs to scale/deploy independently of the UI — premature now |
| Next.js + NestJS monorepo | Same | Good | Good, with shared package | Same | Highest for Phase 1 — Nest's DI/module ceremony buys nothing when the entire "backend" is ~3 routes and a provider interface | Overkill; revisit if the API grows into a real service with many domains |
| Next.js + Fastify (as a separate process) | Same | Good | Needs shared package like above | Slightly better raw throughput/WS ergonomics than Route Handlers | Two runtimes to operate for marginal perf gain no Phase 1 traffic level needs | Not justified until Route Handlers measurably bottleneck |
| Python FastAPI backend + separate JS frontend | Same (frontend still needs R3F) | Good | None — no shared types across language boundary, must hand-write/generate an OpenAPI client | Native async, good WS support | Two languages, two deploy pipelines, no type sharing | Only makes sense if the team's strength/existing infra is Python, or heavy numerical/quant work is added later — not indicated here |
| Go backend + separate JS frontend | Same | Good | None, same issue as FastAPI | Excellent concurrency/WS performance | Two languages, steepest learning curve for a solo/small TS-focused team | Justified only at real scale (very high concurrent WS fanout) — far beyond Phase 1 |

## Phase 1 structure

Single Next.js app, no monorepo. A monorepo (`apps/web` + `apps/api`) is not
justified in Phase 1 — see [Migration or scaling path](#migration-or-scaling-path)
for when to introduce one.

```
src/
  app/
    page.tsx
    about/
      page.tsx
    api/
      markets/
        route.ts
      markets/[marketId]/
        route.ts
      health/
        route.ts
    layout.tsx
    globals.css

  components/
    globe/
      MarketGlobe.tsx
      GlobeControls.tsx
      MarketMarker.tsx
      GlobeFallback.tsx
    markets/
      MarketTooltip.tsx
      MarketDetailPanel.tsx
      MarketSummary.tsx
      MarketStatusBadge.tsx
    layout/
      Header.tsx
      Footer.tsx

  features/
    markets/
      market-types.ts
      market-schema.ts
      market-registry.ts
      market-status.ts
      freshness.ts
      market-utils.ts

  lib/
    providers/
      market-data-provider.ts
      mock-market-data-provider.ts
      indstocks-market-data-provider.ts
      provider-factory.ts
    cache/
      market-cache.ts
    config/
      env.ts
    errors/
      api-error.ts
    logging/
      logger.ts
    rate-limit/
      rate-limiter.ts

  hooks/
    use-markets.ts
    use-market-updates.ts
    use-globe-interaction.ts

  types/
    api.ts

tests/
  unit/
  integration/
  e2e/
```

Notes:
- `features/markets/` holds framework-agnostic domain logic (types, schema,
  registry, status calculation, freshness) with zero React/Next imports —
  this is what would move unchanged into a separate `apps/api` package if
  Phase 2 needs one.
- `lib/providers/` depends only on `features/markets/market-types.ts`, never
  on Next.js request/response types, so it's portable too.
- Route Handlers in `app/api/**/route.ts` are thin: parse request → call
  provider/registry/status service → validate with Zod → return JSON.

## Runtime and data flow

```
Browser
  │  SWR polling (e.g. every 15–30s, configurable per freshness thresholds)
  ▼
GET /api/markets, /api/markets/:id, /api/health   (Next.js Route Handlers)
  │
  ├─ market-registry (config: 15 markets, static)
  ├─ market-status service (timezone + session config → OPEN/CLOSED/HOLIDAY/...)
  ├─ provider-factory → MockMarketDataProvider | IndstocksMarketDataProvider
  │      (selected by MARKET_DATA_PROVIDER env var, server-side only)
  ├─ freshness service (age vs LIVE/DELAYED/STALE thresholds)
  ├─ Zod validation of provider response
  └─ in-memory cache (short TTL, per server instance)
  │
  ▼
Normalized Market[] JSON  →  browser  →  R3F globe + markers + panels
```

- The browser **never** calls INDstocks directly and never receives
  `INDSTOCKS_API_KEY`/`INDSTOCKS_ACCESS_TOKEN` — those are read only inside
  `lib/providers/indstocks-market-data-provider.ts`, a server-only module.
- `subscribeToUpdates` on the provider interface is defined for future
  WebSocket/streaming providers but Phase 1's `MockMarketDataProvider` and
  `IndstocksMarketDataProvider` skeleton do not need to implement it — polling
  is sufficient until a licensed provider actually offers a push feed.
- All timestamps are UTC end-to-end; the UI converts to local time only at
  render.

## Deployment plan

**Phase 1: single-instance deploy, no infra beyond the app itself.**

- Deploy the Next.js app to Vercel (simplest, zero-config for this stack) or
  any Node 20+ host (Fly.io, Render, a single container) if Vercel is not
  desired.
- `Dockerfile` provided for local dev parity and for non-Vercel hosts.
- Environment variables (`MARKET_DATA_PROVIDER`, `INDSTOCKS_API_KEY`,
  `INDSTOCKS_ACCESS_TOKEN`, `NEXT_PUBLIC_APP_NAME`) set in the host's secret
  store — never committed.
- No database, no Redis, no separate cache service. In-memory cache is scoped
  to a single running instance, which is correct for Phase 1's single-instance
  deploy.
- Basic rate limiting on `/api/*` implemented in-process (token bucket per
  IP, in-memory) — sufficient at Phase 1 traffic; does not require Redis
  because there is only one instance.

**How this scales later without a rewrite:**
- If traffic requires horizontal scaling (multiple instances), the in-memory
  cache and rate limiter become per-instance-inconsistent. At that point add
  Redis for shared cache + rate limiting — this is a drop-in change behind
  the existing `lib/cache/market-cache.ts` and `lib/rate-limit/rate-limiter.ts`
  interfaces, not a rewrite.
- If a licensed provider offers real push (WebSocket) updates and fan-out to
  many browsers becomes a bottleneck for Route Handlers (which don't hold
  long-lived connections well in serverless deploys), extract a small
  real-time broadcaster service (e.g. a lightweight Node process with `ws`,
  or a managed pub/sub like Ably/Pusher) that Route Handlers and browsers both
  talk to. The provider interface doesn't change; only the transport between
  backend and browser does.
- If the API grows enough domains/complexity to want independent deploys or a
  different runtime, move `lib/providers/`, `features/markets/`, and the
  Route Handlers into `apps/api` (Fastify or NestJS) inside a pnpm workspace
  monorepo, with `apps/web` staying Next.js. Because the domain logic never
  imported Next.js-specific types, this move is mechanical.

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| INDstocks API coverage/endpoints unconfirmed | Build `IndstocksMarketDataProvider` as a skeleton with `TODO`s and a `NOT_CONFIGURED` state; never invent endpoints or symbols; ship Phase 1 fully functional on `MockMarketDataProvider` |
| Mock data accidentally shown in production | `provider-factory` reads `MARKET_DATA_PROVIDER` and fails safe: if `indstocks` is selected but unconfigured, markets return `UNAVAILABLE`, never silently falling back to mock |
| Serverless Route Handlers don't hold long-lived connections well (relevant if WS is later needed) | Phase 1 explicitly uses polling, not WebSockets, sidestepping this; documented as the Phase 2 trigger for a separate real-time service |
| In-memory rate limit/cache is per-instance | Acceptable at single-instance Phase 1 scale; documented Redis upgrade path above |
| R3F/Three.js bundle size and mobile GPU performance | Use Drei helpers for LOD-friendly primitives, cap marker draw calls, respect `prefers-reduced-motion`, test on a real mobile device before calling Phase 1 done |
| Exchange calendars (holidays) are non-trivial and error-prone | Market-status service explicitly designed to accept a holiday calendar later; Phase 1 documents in code that production calendars must be validated against a real exchange-calendar source |
| Secrets leaking into client bundle by accident | Enforce via convention: provider adapter files live only under `lib/providers/`, imported only from Route Handlers and server components, never from files with `"use client"`; add an ESLint import boundary if this becomes error-prone in practice |

## Migration or scaling path

1. **Phase 1 (this ADR):** single Next.js app, mock + INDstocks-skeleton
   providers, polling, in-memory cache/rate-limit, single-instance deploy.
2. **Phase 2 trigger — real INDstocks integration confirmed:** fill in the
   `IndstocksMarketDataProvider` TODOs once endpoint/instrument documentation
   is available. No architectural change.
3. **Phase 3 trigger — need horizontal scaling:** add Redis for shared
   cache/rate-limit; deploy multiple instances behind the host's load
   balancer. No code interface change.
4. **Phase 4 trigger — need true push updates at scale:** extract a real-time
   broadcaster service; Route Handlers and browser both connect to it instead
   of polling. `MarketDataProvider.subscribeToUpdates` interface already
   anticipates this.
5. **Phase 5 trigger — API domain grows independently of the UI, or needs a
   different runtime/team:** split into a pnpm workspace monorepo
   (`apps/web`, `apps/api`), moving `features/markets/` and `lib/providers/`
   into `apps/api` largely unchanged.
6. **Only if user accounts, watchlists, or historical charting are added:**
   introduce PostgreSQL. Not before — the brief and this ADR treat this as
   explicitly out of Phase 1 scope.

## Exact commands to initialize the project

The repository is **already scaffolded** with the recommended stack (Next 16,
React 19, R3F/Drei/Three, Zod, SWR, Vitest, Playwright, Tailwind v4, ESLint,
Prettier, pnpm). No re-init is needed. To pick up any missing pieces or verify
the environment before implementation begins:

```bash
pnpm install
```

```bash
pnpm exec playwright install --with-deps chromium
```

```bash
pnpm dev
```

```bash
pnpm lint
```

```bash
pnpm exec vitest run
```

No new dependencies are required for Phase 1 beyond what's already in
`package.json`.

## Cursor rules for implementation agents

1. **Do not create application files until this ADR is approved.** This
   document is a decision record, not a green light.
2. **This is not the Next.js you know.** Before writing any Next.js-specific
   code (Route Handlers, layouts, metadata, caching), read the relevant guide
   under `node_modules/next/dist/docs/` — this repo runs Next 16 App Router
   with Cache Components semantics that differ from older training data
   (e.g. `GET` Route Handlers are uncached by default but can be
   prerendered/cached via `use cache` + `cacheLife`, not via older
   `export const revalidate` patterns alone).
3. **Never import `lib/providers/indstocks-market-data-provider.ts` (or
   anything reading `INDSTOCKS_*` env vars) from a `"use client"` file or from
   any file under `components/` or `hooks/`.** Provider adapters are
   server-only.
4. **`features/markets/*` and `lib/providers/*` must not import from `next/*`
   or `react`.** This is what keeps them portable to a future separate
   backend without a rewrite.
5. **Never invent INDstocks endpoints, symbols, or response shapes.** If a
   detail is undocumented, add a `TODO` referencing exactly what's missing
   and return `NOT_CONFIGURED`/`UNAVAILABLE` — do not guess.
6. **All external provider responses must be validated with Zod before use.**
   Never trust a provider payload's shape.
7. **Never let `MARKET_DATA_PROVIDER=indstocks` silently fall back to mock
   data.** If credentials/config are missing in that mode, return
   `UNAVAILABLE`, not fixture data.
8. **All backend timestamps are UTC ISO 8601.** Convert to local time only in
   client components at render time.
9. **Don't add a database, Redis, or a separate backend service in Phase 1.**
   If a task seems to need one, stop and flag it against this ADR's Migration
   path instead of adding it silently.
10. **Null instrument values render as `—` or an explicit unavailable state,
    never as `0`.**
11. **Respect `prefers-reduced-motion`** in all globe animation/rotation code.
12. **Run `pnpm lint`, `pnpm exec vitest run`, and relevant Playwright specs
    before considering any implementation task done.**
