# Global Market Globe

A public, read-only website that visualizes global stock-market index data on an interactive 3D
globe. No accounts, no trading, no investment advice — see [`docs/ADR-001-architecture.md`](docs/ADR-001-architecture.md)
for the architecture decision record behind this build.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS v4 · Three.js /
React Three Fiber / Drei · Zod · SWR · Vitest · Playwright · pnpm

## Local development

Requires Node 20+ and pnpm.

```bash
pnpm install
```

Copy the environment template and leave the default mock provider for local development:

```bash
cp .env.example .env.local
```

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). The homepage shows the globe running against
`MockMarketDataProvider` — all data is clearly labeled `MOCK`/`Demo data` and is never real.

### Environment variables

| Variable | Purpose | Default |
|---|---|---|
| `APP_ENV` | `development` \| `test` \| `production` | `development` |
| `MARKET_DATA_PROVIDER` | `mock` or `indstocks` | `mock` |
| `INDSTOCKS_API_KEY` / `INDSTOCKS_ACCESS_TOKEN` | Server-side only. Required when `MARKET_DATA_PROVIDER=indstocks` | unset |
| `NEXT_PUBLIC_APP_NAME` | Public app name | `Global Market Globe` |

`MARKET_DATA_PROVIDER=indstocks` without credentials does not fall back to mock data — affected
markets report `UNAVAILABLE` instead. See `src/lib/providers/indstocks-market-data-provider.ts`
for the current state of that integration (it is a skeleton pending confirmed INDstocks API
documentation).

## Testing

Unit/integration tests (Vitest):

```bash
pnpm exec vitest run
```

Watch mode:

```bash
pnpm exec vitest
```

End-to-end tests (Playwright — installs browsers on first run):

```bash
pnpm exec playwright install --with-deps chromium
pnpm exec playwright test
```

Lint and format check:

```bash
pnpm lint
pnpm exec prettier --check .
```

## Project structure

```
src/
  app/                 Routes: / (globe), /about, /api/markets, /api/markets/[id], /api/health
  components/          UI: globe/ (R3F), markets/ (tooltip, panel, summary), layout/
  features/markets/    Framework-agnostic domain logic: types, Zod schema, registry,
                        market-status service, freshness service, formatting utils
  lib/                 providers/ (provider interface + mock + INDstocks skeleton),
                        cache/, config/, errors/, logging/, rate-limit/
  hooks/                Client data-fetching and interaction hooks (SWR-based)
  types/                Shared API response types
tests/
  unit/                 Vitest unit tests for features/ and lib/
  e2e/                   Playwright end-to-end tests
```

`features/markets/*` and `lib/providers/*` intentionally have no dependency on Next.js or React,
so they can move into a separate backend service later without a rewrite — see the ADR's
Migration path.

## Deployment

### Vercel (recommended for Phase 1)

Push to a Git repository and import it in Vercel. Set the environment variables above in the
Vercel project settings.

`APP_ENV` (not Next's own `NODE_ENV`, which Vercel always sets to `production`) is what decides
whether the strict "never serve mock data" guard is active:

- **Sharing a demo/preview with `MARKET_DATA_PROVIDER=mock`:** leave `APP_ENV` unset (or
  `development`). The deploy gets a public Vercel URL and works immediately — all data is clearly
  labeled `MOCK`/`Demo data` in the UI and API responses.
- **A real launch:** set `MARKET_DATA_PROVIDER=indstocks` and `APP_ENV=production`. With
  `APP_ENV=production`, the app refuses to start with `MARKET_DATA_PROVIDER=mock` — it must be a
  real, credentialed provider.

### Docker (any Node 20+ host)

```bash
docker build -t global-market-globe .
docker run -p 3000:3000 \
  -e MARKET_DATA_PROVIDER=indstocks \
  -e INDSTOCKS_API_KEY=... \
  -e INDSTOCKS_ACCESS_TOKEN=... \
  global-market-globe
```

The image uses Next's standalone output and runs as a non-root user. There is no database or
Redis dependency in Phase 1 — see the ADR for when to introduce them.

## Data disclaimer

Market data shown on this site is for informational purposes only and is not investment advice.
Mock/demo data is clearly labeled and is never shown in production. See [`/about`](src/app/about/page.tsx)
for an explanation of market-status and data-freshness states.
