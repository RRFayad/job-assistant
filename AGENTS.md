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

## Architecture Boundaries

- Next.js owns UI, Clerk authentication, Clerk and Stripe webhooks, billing,
  and SaaS/account concerns.
- FastAPI owns product/domain APIs and future Python-based product logic, such
  as AI, RAG, agents, and streaming.
- PostgreSQL is the shared application database. Supabase, when used, is only
  the database host. Do not introduce Supabase Auth or the Supabase SDK.
- Drizzle owns the schema and migrations in `src/lib/db/`. SQLAlchemy models in
  `backend/db/models.py` map to the same database. Do not use SQLAlchemy
  `create_all()`.
- FastAPI must derive identity from the verified Clerk JWT. Never trust a
  browser-supplied user ID for authenticated identity.

## Frontend Conventions

- Use TypeScript arrow functions, not function declarations.
- Prefer Server Components. Add client components only when client-side
  behavior is necessary.
- Keep Next.js to FastAPI calls under `src/lib/backend/`.
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
  `src/lib/subscription/`. FastAPI routes use
  `require_subscription_plan(...)` dependencies.
- Keep Stripe SDK use, customer creation, Checkout Session creation, and
  Customer Portal Session creation server-only.

## Backend Conventions

- Python dependencies and tooling are managed with `uv` in `backend/`.
- `backend/` is an independently deployed Vercel project root. Import backend
  modules from that root, such as `from auth.auth import ...`; do not import
  them through `backend.*` or use relative imports that escape a subpackage.
- Start FastAPI from `backend/` with
  `uv run uvicorn main:app --reload --env-file .env`.
- Format Python with Black and sort imports with isort.
- Place product API routes in `backend/routers/`; keep authentication and
  subscription dependencies under `backend/auth/`.
- CORS accepts only `FRONTEND_URL`; keep it aligned with the Next.js app URL.

## Validation

Run relevant checks after changes:

```bash
# Next.js
npm run lint
npx tsc --noEmit
npx prettier --check <changed-files>

# FastAPI
uv run --project backend black --check backend
uv run --project backend isort --check-only backend
```
