# SaaS Starter Kit

A reusable full-stack foundation for subscription SaaS products, including
Python-first AI applications.

## Video Demo

[Watch the Video Walkthrough](https://www.loom.com/share/b9e6a7a19a3e42b686d7ca6208469023)

## What Is Included

- Clerk authentication and user lifecycle synchronization
- PostgreSQL persistence with Drizzle ORM and versioned migrations
- Stripe Checkout, Customer Portal, and subscription webhooks
- Server-side subscription authorization in Next.js and FastAPI
- A FastAPI backend protected by Clerk JWTs
- A responsive landing page, pricing flow, authenticated app shell, billing,
  and account pages
- A protected dashboard request that demonstrates the Next.js to FastAPI
  boundary end to end

## Architecture

### Stack

| Area            | Technology                                     |
| --------------- | ---------------------------------------------- |
| Web application | Next.js App Router, React, TypeScript          |
| Styling         | Tailwind CSS, shadcn/ui, Velora UI             |
| Authentication  | Clerk                                          |
| Database        | PostgreSQL, Drizzle ORM, postgres.js           |
| Billing         | Stripe Checkout, Customer Portal, and webhooks |
| Product backend | FastAPI, SQLAlchemy, Python managed with uv    |

Supabase is optional PostgreSQL hosting. Any PostgreSQL provider works; this
starter does not use Supabase Auth, Storage, or the Supabase SDK.

### Responsibilities

```text
Next.js
  - UI and application shell
  - Clerk authentication
  - Application user lifecycle and Clerk user synchronization
  - Clerk and Stripe webhooks
  - Stripe Checkout and Customer Portal
  - Payments, subscriptions, and server-side subscription page guards

FastAPI
  - Product and domain APIs
  - Clerk JWT validation
  - Read-only application user and subscription lookup for API authorization
  - Future Python/AI logic

PostgreSQL
  - Application users
  - Current subscription state
```

Next.js is the **SaaS service layer**: it owns user synchronization, billing,
subscription state, and account-facing behavior. FastAPI is the **product
layer**: it does not create, update, or delete users or payments. It reads the
existing user and subscription records only after validating a Clerk token, so
it can authorize product API requests.

### Identity and API Flow

```text
Browser
  -> Next.js Server Component / Server Action
  -> Clerk session token
  -> FastAPI Authorization header
  -> Clerk JWKS validation
  -> PostgreSQL user lookup by clerk_id
  -> Subscription-plan authorization
  -> Protected FastAPI response
  -> Next.js renders the result
```

The browser never supplies a trusted user ID to FastAPI. FastAPI derives the
Clerk user ID from the verified token and reads the application user itself.

### Billing Flow

```text
User selects a plan
  -> Next.js Server Action validates the plan
  -> Stripe Checkout
  -> Stripe subscription webhook
  -> PostgreSQL subscriptions table
  -> Next.js and FastAPI authorize from local subscription state
```

Stripe is the billing source of truth. PostgreSQL stores current subscription
state for authorization, and webhook timestamps prevent delayed events from
overwriting newer data.

### Database Ownership

Drizzle owns the PostgreSQL schema and migrations in `src/lib/db/`.
SQLAlchemy models in `backend/db/models.py` map to that same schema so FastAPI
can query it. Do not use SQLAlchemy `create_all()` for this project.

The starter includes:

- `users`: application identity linked to Clerk through `clerk_id`
- `subscriptions`: one current Stripe subscription per user

## UI and Styling

shadcn/ui provides base primitives in `src/components/ui/`; Velora UI provides
marketing primitives in `src/components/velora/`. Keep copied components close
to their upstream source.

Application-owned components place static Tailwind classes in named `styles`
entries to keep JSX readable:

```tsx
const styles = {
  card: tw("rounded-xl border bg-card p-6 shadow-sm"),
};

export const Example = () => <section className={styles.card} />;
```

`tw()` lets the Tailwind Prettier plugin sort classes in those strings. Use
`cn()` only for runtime conditional merging.

For Tailwind autocomplete inside `tw()`, install the official Tailwind CSS
IntelliSense VS Code extension. This repository's `.vscode/settings.json`
configures the extension for the wrapper automatically.

### Theme and Design Tokens

Theme values live in `src/app/globals.css`. This project uses Tailwind v4 CSS
tokens, so there is no `tailwind.config.ts` to edit.

1. `@theme inline` exposes CSS variables as Tailwind utilities.
2. `:root` defines the light theme.
3. `.dark` overrides the same variables for dark mode.

To change the default visual identity, update the matching light and dark
values for `--primary`, `--primary-foreground`, `--brand`, and the
`--brand-from`, `--brand-via`, and `--brand-to` gradient tokens. Keep text and
background pairs readable in both themes.

Use semantic Tailwind utilities in application components instead of raw color
palettes:

```tsx
const styles = {
  card: tw("border-border bg-card text-card-foreground"),
  description: tw("text-muted-foreground"),
  action: tw("bg-primary text-primary-foreground"),
};
```

`background` and `foreground` define the application canvas; `card`, `muted`,
`accent`, `border`, `input`, and `ring` support the shadcn/ui primitives.
`brand-*` is for the marketing gradient, and `sidebar-*` controls the
authenticated app sidebar. The `ThemeProvider` adds or removes the `.dark`
class on the document root; `ThemeToggle` changes it. Change
`defaultTheme="dark"` in `src/app/layout.tsx` if the clone should open in light
mode instead.

## Project Structure

```text
src/
  actions/                 Next.js Server Actions, including Stripe actions
  app/
    (account)/             Clerk and checkout-related routes
    (marketing)/           Public marketing routes
    (subscribed)/          Plan-protected application routes
    api/webhooks/          Clerk and Stripe webhook endpoints
  components/
    marketing/             Landing page header, footer, pricing, and sections
    subscribed/            Authenticated application components
    theme/                 Theme provider and toggle
    ui/                    shadcn/ui primitives
    velora/                Velora UI primitives
  lib/
    backend/               Typed Next.js to FastAPI client functions
    db/                    Drizzle client, schema, and migrations
    stripe/                Stripe SDK and webhook handling
    subscription/          Next.js subscription authorization helpers
    user/                  Application user queries

backend/
  auth/                    Clerk JWT and plan authorization dependencies
  db/                      SQLAlchemy connection and schema mappings
  routers/                 Product/domain API routes
  main.py                  FastAPI application and CORS setup
```

## Use This Starter

### 1. Clone and Install Dependencies

```bash
git clone <your-fork-or-template-url> my-saas
cd my-saas
npm install
```

The backend uses `uv` and Python `3.14`:

```bash
cd backend
uv sync
cd ..
```

Prerequisites: Node.js, npm, uv, and Python 3.14.

### 2. Create a PostgreSQL Database

Create a PostgreSQL database and copy its connection URL. Supabase, another
provider, or local PostgreSQL all work. Next.js and FastAPI use the same URL.

### 3. Create a Clerk Application

Create a Clerk application, enable the required sign-in methods, and copy its
keys. FastAPI also needs the Clerk JWKS URL:

```text
https://<your-clerk-instance>/.well-known/jwks.json
```

Add a Clerk webhook:

```text
https://<your-public-app-url>/api/webhooks/clerk
```

Subscribe it to:

```text
user.created
user.updated
user.deleted
```

Copy its signing secret.

### 4. Configure Stripe

Create recurring Stripe Prices for one or more starter plans:

```text
basic
premium
all_in
```

Add the Price IDs below. The UI shows only configured plans; at least one is
required. Enable Stripe Customer Portal for billing management.

Add a Stripe webhook:

```text
https://<your-public-app-url>/api/webhooks/stripe
```

Subscribe it to:

```text
customer.subscription.created
customer.subscription.updated
customer.subscription.paused
customer.subscription.resumed
customer.subscription.deleted
```

Copy its signing secret.

### 5. Configure Environment Variables

Create `.env.local` in the repository root:

```env
# Public application URLs
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://127.0.0.1:8000
NEXT_PUBLIC_GITHUB_URL=

# PostgreSQL
DATABASE_URL=postgresql://...

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
CLERK_WEBHOOK_SIGNING_SECRET=whsec_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/workspace/overview
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/workspace/overview

# Stripe
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_BASIC_PRICE_ID=price_...
STRIPE_PREMIUM_PRICE_ID=price_...
STRIPE_ALL_IN_PRICE_ID=price_...
# Optional: automatically apply a Stripe Coupon to Checkout demos
STRIPE_DEMO_COUPON_ID=
```

`NEXT_PUBLIC_GITHUB_URL` is optional. The current starter uses Stripe-hosted
Checkout, so it does not require `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
`STRIPE_DEMO_COUPON_ID` is also optional; set it to a Stripe Coupon ID only
when a demo should apply that discount automatically.

Create `backend/.env`:

```env
# SQLAlchemy with Psycopg 3 requires the explicit driver prefix.
DATABASE_URL="postgresql+psycopg://..."
FRONTEND_URL=http://localhost:3000
CLERK_JWKS_URL=https://<your-clerk-instance>/.well-known/jwks.json
```

Both `DATABASE_URL` values must point to the same PostgreSQL database, and both
`FRONTEND_URL` values must match. The Next.js project uses `postgresql://...`;
the FastAPI project must use `postgresql+psycopg://...`, which explicitly tells
SQLAlchemy to use Psycopg 3.

### 6. Apply the Database Migrations

Run this from the repository root:

```bash
npx drizzle-kit migrate
```

After changing `src/lib/db/schema.ts`, generate, inspect, and apply a migration:

```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

Commit generated migrations with the schema change.

### 7. Start the Application

Start FastAPI from the backend directory:

```bash
cd backend
uv run uvicorn main:app --reload --env-file .env
```

In a second terminal, start Next.js:

```bash
npm run dev
```

The services are available at:

```text
Next.js: http://localhost:3000
FastAPI: http://127.0.0.1:8000
FastAPI health check: http://127.0.0.1:8000/healthy
```

### 8. Configure Local Webhook Forwarding

Clerk and Stripe need a public HTTPS URL. For local development, expose
`http://localhost:3000` through a tunnel and update both webhook URLs.

Alternatively, the Stripe CLI can forward Stripe events locally:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Use the printed signing secret as `STRIPE_WEBHOOK_SECRET` while it runs.

### 9. Verify the Full Flow

1. Open `http://localhost:3000` and choose a configured plan.
2. Sign up or sign in through Clerk.
3. Complete Stripe Checkout using test mode.
4. Confirm the Stripe webhook creates or updates a subscription row.
5. Confirm `/workspace/overview` loads the protected FastAPI-backed sample data.
6. Open Billing and confirm that **Manage billing** opens Stripe Customer Portal.
7. Delete a Clerk user and confirm its local user and Stripe customer are
   removed.

## Authorization Model

The `(subscribed)` layout protects app pages in Next.js. FastAPI product routes
apply the same locally synchronized subscription state independently.

For a new product page, use the Next.js helper when the page itself needs a
plan requirement:

```tsx
await requireCurrentUserSubscriptionPlan(SubscriptionPlan.Basic);
```

For a new FastAPI router, apply the corresponding dependency:

```python
app.include_router(
    product.router,
    dependencies=[Depends(require_subscription_plan(SubscriptionPlan.BASIC))],
)
```

Do not trust a browser-supplied user ID for an authenticated API request.

## Development Checks

```bash
# Next.js
npm run lint
npx tsc --noEmit

# FastAPI
uv run --project backend black --check backend
uv run --project backend isort --check-only backend
```

## Production Checklist

### PostgreSQL / Supabase

- Keep `DATABASE_URL` server-only. Never expose it with a `NEXT_PUBLIC_`
  prefix or connect to PostgreSQL from the browser.
- If using Supabase, configure Database Network Restrictions to allow only the
  deployed services' known egress IP ranges. This limits direct Postgres and
  pooler connections before database authentication.
- Supabase browser API origin settings are not relevant here: this starter does
  not use Supabase APIs or the Supabase client SDK.

### Clerk

- Create and activate a Clerk Production instance for the production domain.
- Replace development keys with the production instance's `pk_live_` and
  `sk_live_` keys in the deployment environment, then redeploy.
- Configure the production domain, OAuth callback URLs, redirect URLs, and
  production Clerk webhook endpoint.
- Update `CLERK_JWKS_URL` and `CLERK_WEBHOOK_SIGNING_SECRET` with values from
  the production instance.

## Extending a Clone

Keep SaaS concerns in Next.js and add product/domain features to FastAPI. An AI
product can add ingestion, retrieval, conversations, agents, and streaming
under `backend/` while reusing the starter's SaaS foundation.

### Add a Product API Feature

1. Create a FastAPI router in `backend/routers/` with the product endpoint.
2. Include the router in `backend/main.py` with the appropriate
   `require_subscription_plan(...)` dependency. Keep `/healthy` public.
3. Create a typed server-side fetch function in `src/lib/backend/` that calls
   the new endpoint through `fetchBackendData`.
4. Call that function from a subscribed page or component. FastAPI obtains the
   authenticated user from the Clerk JWT; do not pass a trusted user ID from
   the browser.

### Add Product Routes

Use `src/lib/routes.ts` for shared static destinations. For a dynamic product
route, add a route function that accepts the ID and create the matching Next.js
folder, for example `workspace/items/[itemId]/page.tsx`. Use the route function
for sidebar and navigation links so a path change has one source of truth.

### Change Subscription Plans

To configure an existing plan, create its recurring Stripe Price, set the
matching `STRIPE_*_PRICE_ID`, and update its display copy in
`src/lib/stripe/config.ts`.

To add a new plan, update all of the following together:

1. `SubscriptionPlan` in `src/types/database.ts` and the Drizzle enum in
   `src/lib/db/schema.ts`, then generate and apply a migration.
2. The matching SQLAlchemy `SubscriptionPlan` enum and plan levels in
   `backend/db/models.py` and `backend/auth/subscription.py`.
3. The Stripe Price ID and pricing copy in `src/lib/stripe/config.ts`.
4. The recurring Price in Stripe.

Do not remove or rename an already-issued plan value without first planning a
database and Stripe migration for existing subscriptions.
