<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

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
  logic — AI, RAG, agents, streaming, and real persistence, as those get
  built.
- `docx-service/` is a narrow Python sidecar with exactly one job: Profile
  JSON in, a `.docx` export out. It exists because `python-docx`'s
  template-cloning OOXML manipulation (see ADR-0009) has no equivalent
  Node library — it is not a place for new product logic, persistence, or
  auth of its own. `backend/` calls it server-to-server with a shared
  `X-Internal-Api-Key` header; it has no other access control.
- PostgreSQL is the shared application database. Supabase, when used, is only
  the database host. Do not introduce Supabase Auth or the Supabase SDK.
- Drizzle owns the schema and migrations in `packages/shared/src/db/`,
  imported as `@app/shared/db/schema` by both the Next.js app and
  `backend/`. `docx-service/` has no database access at all.
- `backend/` must derive identity from the verified Clerk JWT (via
  `@clerk/fastify`). Never trust a browser-supplied user ID for
  authenticated identity.

## Frontend Conventions

- Use TypeScript arrow functions, not function declarations.
- Prefer Server Components. Add client components only when client-side
  behavior is necessary.
- Keep Next.js to `backend/` calls under `src/lib/backend/`.
- Application-owned Tailwind styles belong in a local `styles` object and must
  be wrapped with `tw()` so Prettier sorts the classes.
- Use `cn()` only for runtime conditional class merging.
- Do not refactor copied shadcn/ui components in `src/components/ui/` or Velora
  components in `src/components/velora/` into the application styling pattern.
- Keep marketing components in `src/components/marketing/`, subscribed-app
  components in `src/components/subscribed/`, and theme components in
  `src/components/theme/`.

## Authentication and Billing

- Clerk webhooks synchronize `users` in PostgreSQL.
- Stripe webhooks synchronize the current subscription state in
  `subscriptions`; authorization reads local subscription state rather than
  querying Stripe on every request.
- Server-side Next.js pages use the subscription helpers in
  `src/lib/subscription/`. `backend/` routes use
  `requireSubscriptionPlan(...)` preHandler hooks.
- Keep Stripe SDK use, customer creation, Checkout Session creation, and
  Customer Portal Session creation server-only.

## Backend Conventions

- `backend/`, `packages/shared/`, and the root Next.js app are npm workspaces
  (see root `package.json`'s `workspaces`). `@app/shared` holds the Drizzle
  schema (`db/schema.ts`), the Zod API-contract schemas (`schemas.ts`,
  shared by `backend/` and the frontend instead of each side keeping its own
  copy), domain constants, and small cross-cutting utils — add a new shared
  type or schema there, not inline in `backend/` or `src/`.
- Place product routes in `backend/src/<domain>/<domain>.route.ts` (the
  Fastify route + Zod request/response schema, via
  `fastify-type-provider-zod`) and `<domain>.controller.ts` (the handler);
  keep authentication and subscription preHandlers under `backend/src/auth/`.
- Start the Fastify backend from the repo root with
  `npm run dev -w @app/backend`, or run both it and Next.js together via the
  root `npm run dev`.
- CORS accepts only `FRONTEND_URL`; keep it aligned with the Next.js app URL.
- `docx-service/` is a separate Python project (its own `pyproject.toml`,
  managed with `uv`), not an npm workspace member. Start it from
  `docx-service/` with `uv run uvicorn main:app --reload --env-file .env`.
  Format its Python with Black and sort imports with isort. Keep it to
  exactly its one job (see Architecture Boundaries) — a new product
  endpoint belongs in `backend/`, not here.

## Validation

Run relevant checks after changes:

```bash
# Next.js + backend (npm workspaces) — or run each piece individually:
# npm run lint / npx tsc --noEmit / npm run typecheck --workspaces --if-present / npm test
npm run check
npx prettier --check <changed-files>

# docx-service (the Python sidecar)
uv run --project docx-service black --check docx-service
uv run --project docx-service isort --check-only docx-service
npx --yes pyright docx-service  # docx-service/pyrightconfig.json — production code should be clean
```

## Agent skills

### Issue tracker

Issues live in GitHub Issues on `RRFayad/job-assistant`, via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Domain docs

Single-context layout: `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
