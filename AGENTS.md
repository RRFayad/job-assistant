# Project Guidelines

## Scope and Workflow

- Prefer simple, understandable architecture over abstractions introduced for
  hypothetical future needs.
- Do not expand the starter-kit scope or make unrelated changes.
- Do not create branches, stage files, or commit unless explicitly requested.
- Inspect the existing implementation before changing code. Preserve established
  naming, structure, and patterns when they are already clear.
- Before building a UI feature, check whether it was already prototyped on a
  `prototype/*` branch. The prototype is this project's design definition for
  now (no formal design system exists yet) — match its visual details (layout,
  spacing, colors, copy, interaction patterns), not a fresh default styling
  pass against shadcn/ui defaults. If no prototype exists for the feature,
  say so before implementing, since styling may need a dedicated pass.

## Git

- Commit messages follow Conventional Commits: a type (`feat`, `fix`,
  `refactor`, `test`, `docs`, `chore`, `ci`) and an optional scope, such as
  `test(backend): add a Docker-Postgres integration test harness`.
- PR descriptions are objective: what changed and why, grouped by area; how
  it was verified; the issues it closes (`Closes #n`).

## Code Style

These apply to every workspace.

- Write functions as TypeScript arrow functions, not function declarations.
- Name fixed module-level constants (lists, lookup tables) in
  `UPPER_SNAKE_CASE`. Objects built from environment variables or config stay
  `camelCase`.
- Names carry the what; comments carry only what the code can't say: the why
  or a non-obvious constraint.
- Divide a file with several groups into sections with
  `// ---------- Section ----------` dividers.

## Architecture Boundaries

- The repository is an npm workspaces monorepo: the Next.js app in
  `frontend/` (`@app/frontend`), the Fastify API in `backend/`
  (`@app/backend`), and the shared package in `packages/shared/`
  (`@app/shared`).
- The Next.js app (`frontend/`) uses a Next.js version with breaking changes
  from common training data. Read `frontend/AGENTS.md` and the guides in
  `node_modules/next/dist/docs/` before writing Next.js code.
- Next.js owns UI, Clerk authentication, Clerk and Stripe webhooks, billing,
  and SaaS/account concerns.
- `backend/` (Fastify, TypeScript) owns product/domain APIs and product
  logic — AI, RAG, agents, streaming, real persistence, and `.docx` export
  (`src/profile/docx-export/`, see ADR-0009 and ADR-0010 — originally a
  Python sidecar, ported to TypeScript once that no longer needed a
  Python-only library).
- PostgreSQL is the shared application database. Supabase, when used, is only
  the database host. Do not introduce Supabase Auth or the Supabase SDK. The
  local Postgres + pgvector container in `docker-compose.yml` is only for
  `backend/`'s tests (`app_test`); day-to-day dev still talks to Supabase.
- Drizzle owns the schema and migrations in `packages/shared/src/db/`,
  imported as `@app/shared/db/schema` by both the Next.js app and
  `backend/`.
- `backend/` must derive identity from the verified Clerk JWT (via
  `@clerk/fastify`). Never trust a browser-supplied user ID for
  authenticated identity.

## Frontend Conventions

- The Next.js app lives in `frontend/` (its own npm workspace, `@app/frontend`)
  — not at the repo root.
- Prefer Server Components. Add client components only when client-side
  behavior is necessary.
- Keep Next.js to `backend/` calls under `frontend/src/lib/backend/`.
- Application-owned Tailwind styles belong in a local `styles` object and must
  be wrapped with `tw()` so Prettier sorts the classes.
- Use `cn()` only for runtime conditional class merging.
- Do not refactor copied shadcn/ui components in `frontend/src/components/ui/`
  or Velora components in `frontend/src/components/velora/` into the
  application styling pattern.
- Keep marketing components in `frontend/src/components/marketing/`,
  subscribed-app components in `frontend/src/components/subscribed/`, and
  theme components in `frontend/src/components/theme/`.

## Authentication and Billing

- Clerk webhooks synchronize `users` in PostgreSQL.
- Stripe webhooks synchronize the current subscription state in
  `subscriptions`; authorization reads local subscription state rather than
  querying Stripe on every request.
- Server-side Next.js pages use the subscription helpers in
  `frontend/src/lib/subscription/`. `backend/` routes use
  `requireSubscriptionPlan(...)` preHandler hooks.
- Keep Stripe SDK use, customer creation, Checkout Session creation, and
  Customer Portal Session creation server-only.
- `BILLING_ENABLED=true` in both `frontend/.env.local` and `backend/.env` is
  required by the dev tooling (`scripts/dev-stripe.mjs`) — always `true` here,
  since billing is not optional in this product (unlike the generic starter
  kit, which supports disabling it).
- Local Stripe webhooks come from the Stripe CLI, started by `npm run dev`
  through `scripts/dev-stripe.mjs`. It uses this project's own
  `STRIPE_SECRET_KEY`, never the machine-wide `stripe login`, and syncs
  `STRIPE_WEBHOOK_SECRET` in `frontend/.env.local` automatically. Never
  create a dashboard webhook destination pointing at a tunnel URL — that's
  for production only. When the Stripe webhook route handles a new event
  type, add it to the `stripe:listen` script's `--events` list too.

## Backend Conventions

- `frontend/`, `backend/`, and `packages/shared/` are npm workspaces (see root
  `package.json`'s `workspaces`). `@app/shared` holds the Drizzle schema
  (`db/schema.ts`), the Zod API-contract schemas (`schemas/`, one file per
  feature, barreled through `schemas/index.ts`, shared by `backend/` and the
  frontend instead of each side keeping its own copy), domain constants, and
  small cross-cutting utils — add a new shared type or schema there, not
  inline in `backend/` or `frontend/src/`. Types inferred from a schema live
  next to it (row types in `db/schema.ts`, API types in their `schemas/`
  file); `types.ts` holds shared types that don't belong to a schema file.
- Install packages from the repo root into a workspace, e.g.
  `npm install <package> -w @app/backend`. A stray
  `backend/package-lock.json` or `backend/node_modules/` means something ran
  outside the workspace.
- Place product routes in `backend/src/<domain>/<domain>.route.ts` (the
  Fastify route + Zod request/response schema, via
  `fastify-type-provider-zod`) and `<domain>.controller.ts` (the handler);
  keep authentication and subscription preHandlers under `backend/src/auth/`.
- Auth hooks run in `preHandler`, after `clerkPlugin` has read the token
  there; an `onRequest` hook sees no session yet.
- Fastify treats `/path` and `/path/` as different routes — call routes
  without a trailing slash.
- `backend/src/create-app.ts` builds the app (plugins, hooks, route scopes)
  without starting it; `backend/src/main.ts` only calls `.listen()`. Vercel
  deploys the esbuild bundle from `npm run build` (`backend/server.js`),
  which inlines `@app/shared` since Node can't load its TypeScript source
  from `node_modules`. Vercel picks its entrypoint by file name, so never add
  `backend/src/app`, `backend/src/index`, or `backend/src/server` — Vercel
  would run one of those unbundled instead.
- Start the Fastify backend from the repo root with
  `npm run dev -w @app/backend`, or run everything together via the root
  `npm run dev` (frontend, backend, and the Stripe/Clerk webhook tunnels).
- CORS accepts only `FRONTEND_URL`; keep it aligned with the Next.js app URL.
- Tests sit next to their feature (`backend/src/<feature>/<feature>.test.ts`)
  and use the harness in `backend/src/testing/`: `startApi()` runs the real
  app on a free port, `api.as(clerkId)` calls it over HTTP with axios, and
  `createUser`/`createSubscription` seed rows. Clerk is the only mock. They
  run against `app_test` on the local Docker Postgres (created and migrated
  automatically, truncated before each test), so Docker must be running.
  `TEST_DATABASE_URL` overrides it. Billing is off in tests by default; turn
  it on per test with `vi.stubEnv("BILLING_ENABLED", "true")`.
- The root `package.json`'s `overrides` pins `@fastify/static` (used by
  Swagger UI) to `10.1.3`. Newer versions `require()` the ESM-only
  `content-disposition` v3, which Vercel's runtime loader rejects
  (`ERR_REQUIRE_ESM`, every route returns 500). Before removing the pin, run
  the bundle with `node --no-experimental-require-module server.js` to
  confirm it still starts.

## Validation

Run relevant checks after changes:

```bash
# All workspaces — or run each piece individually:
# npm run lint / prettier --check . / npm run typecheck --workspaces --if-present / npm test
npm run check
```

`backend/`'s tests (`npm test -w @app/backend`) start the real Fastify app
and hit it over HTTP against a real database — they need a local Postgres
running first: `docker compose up -d` (also runs automatically before
`npm test`/`npm run check`, via the root `pretest` script). Requires Docker
installed locally.

`.prettierignore` skips files that aren't ours (vendored agent skills,
Drizzle migration snapshots, copied shadcn/ui and Velora components).

## Agent skills

### Issue tracker

Issues live in GitHub Issues on `RRFayad/job-assistant`, via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Domain docs

Single-context layout: `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
