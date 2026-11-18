# Deploy Guide

Production stack:

| Piece         | Service                       | Vercel Root Directory |
| ------------- | ----------------------------- | --------------------- |
| Next.js app   | Vercel project 1              | `frontend`            |
| API (Fastify) | Vercel project 2              | `backend`             |
| PostgreSQL    | Supabase (database host only) | –                     |
| Auth          | Clerk                         | –                     |
| Billing       | Stripe                        | –                     |

`.docx` export runs in-process inside `backend/` (`src/profile/docx-export/`)
— no separate service to deploy for it.

---

# First Deploy

## 1. Decide First

| Decision             | Options → consequence                                                                                              |
| -------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Vercel project names | `job-assistant` + `job-assistant-api` → URLs known up front                                                        |
| Domain               | `*.vercel.app` → Clerk **development** keys (separate Clerk app) · own domain → Clerk **production** (`pk_live_…`) |

- Check each name is free on Vercel before creating anything: the URLs feed
  `FRONTEND_URL`, `BACKEND_URL`, CORS, and the webhook endpoints.

## 2. Database (Supabase)

1. Create a project → region close to the Vercel functions.
2. Project Settings → Database → copy two connection strings:
   - **Transaction pooler** (port 6543) → `DATABASE_URL` in both Vercel
     projects.
   - **Session** / direct (port 5432) → migrations only.
3. Apply the migrations from your machine:

   ```bash
   DATABASE_URL="<direct URL>" npm run db:migrate
   ```

Why: serverless functions open many short connections → the pooler shares
them; migrations need one steady session → the pooler can switch connections
between statements mid-migration.

## 3. Clerk

- A **separate** Clerk application (or the production instance), never the one
  used locally → users and webhooks don't cross.
- Copy its publishable and secret keys (step 4 and 5 env vars).
- Webhook (Configure > Webhooks > Add Endpoint):
  - URL → `https://<app>.vercel.app/api/webhooks/clerk`
  - Events → `user.created`, `user.updated`, `user.deleted`
  - Signing secret → `CLERK_WEBHOOK_SIGNING_SECRET` (step 5)

## 4. Vercel: API

New Project → import the repo:

- Root Directory → `backend`
- Framework Preset → **Fastify**
- "Include files outside the root directory in the Build Step" → on (needs
  `packages/shared`)
- Build → the backend's `npm run build` (esbuild bundle → `server.js`)

Environment variables:

| Variable                | Value                                                |
| ----------------------- | ---------------------------------------------------- |
| `DATABASE_URL`          | Supabase pooled URL (step 2)                         |
| `FRONTEND_URL`          | `https://<app>.vercel.app` (CORS; no trailing slash) |
| `CLERK_PUBLISHABLE_KEY` | Same Clerk app as the frontend                       |
| `CLERK_SECRET_KEY`      | Same Clerk app as the frontend                       |
| `BILLING_ENABLED`       | `true` (not optional in this product)                |

Check → `https://<api>.vercel.app/healthy` → `{"status":"Healthy"}`, and
`/docs` opens Swagger.

## 5. Vercel: Next.js App

New Project → import the same repo:

- Root Directory → `frontend` (the repo root fails with
  `NEXT_NO_ROUTES_MANIFEST`)
- Framework Preset → **Next.js**
- "Include files outside the root directory in the Build Step" → on

Environment variables:

| Variable                                          | Value                                     |
| ------------------------------------------------- | ----------------------------------------- |
| `FRONTEND_URL`                                    | `https://<app>.vercel.app`                |
| `BACKEND_URL`                                     | `https://<api>.vercel.app`                |
| `BILLING_ENABLED`                                 | `true`                                    |
| `DATABASE_URL`                                    | Same as the API                           |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL`                   | `/sign-in`                                |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL`                   | `/sign-up`                                |
| `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` | `/`                                       |
| `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` | `/`                                       |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`               | Clerk app from step 3                     |
| `CLERK_SECRET_KEY`                                | Clerk app from step 3                     |
| `CLERK_WEBHOOK_SIGNING_SECRET`                    | The production endpoint's secret (step 3) |
| `NEXT_PUBLIC_GITHUB_URL`                          | Optional                                  |
| Stripe variables                                  | Step 6                                    |

- Not needed in production → `CLERK_WEBHOOK_RELAY_TOKEN` (local tunnel only).
- `NEXT_PUBLIC_*` values are built into the bundle → redeploy after changing
  them.

## 6. Stripe

- Keys → live mode for real payments; a sandbox for a demo (test card
  `4242 4242 4242 4242`).
- Products and Prices → created in that same account/sandbox.
- Customer Portal → configured in that account (live mode has its own
  settings).
- Webhook (Developers > Webhooks > Add Destination):
  - URL → `https://<app>.vercel.app/api/webhooks/stripe`
  - Events → the `stripe:listen` list in the root `package.json`:
    `customer.subscription.created`, `.updated`, `.deleted`, `.paused`,
    `.resumed`
  - Signing secret → `STRIPE_WEBHOOK_SECRET` (never reuse the local one)

Frontend environment variables:

| Variable                  | Value                                      |
| ------------------------- | ------------------------------------------ |
| `STRIPE_SECRET_KEY`       | `sk_live_…` (or the sandbox's `sk_test_…`) |
| `STRIPE_WEBHOOK_SECRET`   | The production destination's secret        |
| `STRIPE_BASIC_PRICE_ID`   | At least one Price ID                      |
| `STRIPE_PREMIUM_PRICE_ID` |                                            |
| `STRIPE_ALL_IN_PRICE_ID`  |                                            |
| `STRIPE_DEMO_COUPON_ID`   | Optional; demos only                       |

## 7. Smoke Test

On the production URL:

- [ ] Sign up → a `users` row appears (Supabase → Table Editor)
- [ ] Checkout → a `subscriptions` row → the app recognizes the plan
- [ ] Create a Profile → export a `.docx` → opens correctly
- [ ] `GET /healthy` on the API returns `{"status":"Healthy"}`
- [ ] Billing → Customer Portal opens
- [ ] Sign out → sign in again

---

# Next Deploys

## Before Merging

- CI green (`npm run check`).
- **Migrations** → run on production **before** merging:

  ```bash
  DATABASE_URL="<direct URL>" npm run db:migrate
  ```

  - The old code keeps running on the new schema until the deploy finishes →
    every migration must be backward compatible.
  - Add → nullable or with a default.
  - Drop / rename → expand, then contract: add the new column → deploy code
    that uses it → drop the old one in a later release.

- **New env vars** → add them in Vercel first. Required variables throw at
  startup → every request fails.
- **New webhook events** → add them to the Clerk endpoint or the Stripe
  destination (and to `stripe:listen` for local).

## Merge

- Merge to `main` → Vercel deploys both projects.
- Rollback → Vercel **Instant Rollback**, per project. It doesn't undo
  migrations → one more reason to keep them backward compatible.

## Watch Out

| Topic             | Risk → what to do                                                                                                                                              |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Preview deploys   | Share production env vars by default → previews write to the production database; the API's CORS only accepts `FRONTEND_URL` → scope variables per environment |
| Supabase free     | The project pauses after a week of no API activity → wake it manually in the dashboard before relying on a preview                                             |
| Clerk development | "Development mode" badge and usage limits → fine for a demo, not for real users                                                                                |
| Costs             | Free tiers fit a demo; Vercel Hobby is for non-commercial use → Pro for a commercial SaaS                                                                      |
