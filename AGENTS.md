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

## Architecture Boundaries

- Next.js owns UI, Clerk authentication, Clerk and Stripe webhooks, billing,
  and SaaS/account concerns.
- `backend/` (Fastify, TypeScript) owns product/domain APIs and product
  logic — AI, RAG, agents, streaming, real persistence, and `.docx` export
  (`src/profile/docx-export/`, see ADR-0009 and ADR-0010 — originally a
  Python sidecar, ported to TypeScript once that no longer needed a
  Python-only library).
- PostgreSQL is the shared application database. Supabase, when used, is only
  the database host. Do not introduce Supabase Auth or the Supabase SDK.
- Drizzle owns the schema and migrations in `packages/shared/src/db/`,
  imported as `@app/shared/db/schema` by both the Next.js app and
  `backend/`.
- `backend/` must derive identity from the verified Clerk JWT (via
  `@clerk/fastify`). Never trust a browser-supplied user ID for
  authenticated identity.

## Frontend Conventions

- The Next.js app lives in `frontend/` (its own npm workspace, `@app/frontend`)
  — not at the repo root.
- Use TypeScript arrow functions, not function declarations.
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

## Backend Conventions

- `frontend/`, `backend/`, and `packages/shared/` are npm workspaces (see root
  `package.json`'s `workspaces`). `@app/shared` holds the Drizzle schema
  (`db/schema.ts`), the Zod API-contract schemas (`schemas/`, one file per
  feature, barreled through `schemas/index.ts`, shared by `backend/` and the
  frontend instead of each side keeping its own copy), domain constants, and
  small cross-cutting utils — add a new shared type or schema there, not
  inline in `backend/` or `frontend/src/`.
- Place product routes in `backend/src/<domain>/<domain>.route.ts` (the
  Fastify route + Zod request/response schema, via
  `fastify-type-provider-zod`) and `<domain>.controller.ts` (the handler);
  keep authentication and subscription preHandlers under `backend/src/auth/`.
- Start the Fastify backend from the repo root with
  `npm run dev -w @app/backend`, or run everything together via the root
  `npm run dev` (frontend, backend, and the Stripe/Clerk webhook tunnels).
- CORS accepts only `FRONTEND_URL`; keep it aligned with the Next.js app URL.

## Validation

Run relevant checks after changes:

```bash
# Next.js + backend (npm workspaces) — or run each piece individually:
# npm run lint / npx tsc --noEmit / npm run typecheck --workspaces --if-present / npm test
npm run check
npx prettier --check <changed-files>
```

## Agent skills

### Issue tracker

Issues live in GitHub Issues on `RRFayad/job-assistant`, via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Domain docs

Single-context layout: `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
