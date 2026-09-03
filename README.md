# PokéStock

A stock, sales, and finance tracker for Pokémon reselling. Multi-tenant: anyone
can register their own account, and each account's data is completely isolated
from every other account.

**Repository:** https://github.com/JoshEds2527/PokeStock

## What's here (phase 1)

- **Accounts** — public registration (`/register`) plus login. Each account is
  one email/password pair that owns an isolated set of data — see
  [Accounts and sharing](#accounts-and-sharing) below for how two people share one.
  The login/register screen randomly features one of the original 151 Pokémon
  (split-screen artwork panel, same colour wash behind both halves); whichever
  one shows at login becomes that session's small logo badge in the app header.
  **Note:** this uses real Nintendo/Game Freak/Creatures character artwork
  (hotlinked from PokeAPI's public sprite mirror) — fine for personal use, but
  replace it with licensed or original art before ever selling access to this app.
- **Dashboard** — total spent, net revenue, profit, units in stock, and a spend-vs-revenue-vs-profit chart over time.
- **Inventory** — add products, log purchases ("stock in"), see current stock, average cost, and total spent per product. Full purchase history with edit/delete.
- **Sales** — log sales with platform (eBay/Vinted/Facebook/Depop/in person), fees, and postage. Sortable, filterable, editable.
- **Releases** — a shared catalog of upcoming product releases (visible to every account, deduplicated by product name + date), with a personal "tracked releases" list layered on top so each account only follows what it cares about. Only the **developer account** can add, edit, or delete entries in the shared catalog; every other account can only track/untrack.
- **Admin** (`/admin`, developer account only) — lists every registered account (joined date, last login, product/sale counts) with a delete action, for removing inactive or unwanted accounts.
- **Market** (placeholder) — quick manual links to eBay sold listings and Vinted search per product. Live automated market data and stock-alert monitoring are phase 2 (see below).
- **Password reset** (`/forgot-password`, `/reset-password`) — email a single-use, 1-hour link. See [Password reset & email](#password-reset--email) below for how it sends (or doesn't) email locally.
- **Release notifications** — anyone tracking a release gets emailed when its status changes (e.g. UPCOMING → DELAYED), and a daily job emails trackers when a release is landing within 48 hours. See [Release notifications & the reminder cron](#release-notifications--the-reminder-cron) below.
- **Rate limiting** — login, registration, and password-reset requests are all limited (5 per 15 minutes, tracked in the database so it holds up across serverless instances) to blunt brute-forcing and spam.
- **PWA basics** — a real app icon and manifest, so "Add to Home Screen" gets a proper name and icon instead of a generic bookmark.
- **Terms of Service and Privacy Policy** (`/terms`, `/privacy`) — plain-English drafts, linked from registration and every auth screen.
- **Account settings** (`/settings`) — change your own email or password from inside the app, both requiring your current password to confirm. Rate-limited like login. If two people share one account's login, changing the password there affects both of you.

Every list supports sorting and filtering, every entry can be edited in place, and every delete requires confirmation.

Built with Next.js 16 (App Router, Server Actions), Prisma + PostgreSQL (Neon), Tailwind CSS, Recharts.

## Accounts and sharing

There's no separate "team" concept — an **Account** *is* the login. If you want
two people to see the same shared data (e.g. you and a reselling partner), just
share that account's email and password: sessions are independent per device,
so you can both be logged in with the same credentials at the same time from
different phones, and you'll both see and edit the same shared inventory/sales/
releases. To keep a second person's data separate instead, have them register
their own account — it starts completely empty and stays walled off from yours.

Every database query and mutation is scoped to the logged-in account's id, and
every edit/delete action re-checks that the record actually belongs to that
account before touching it — so one account can never read or modify another
account's data, even by guessing IDs.

### The developer account

One account (currently `PsyJands@gmail.com`) has `isDeveloper: true` on its
`Account` row. That flag is the source of truth for two things, both
re-checked against the database on every request rather than trusted from a
cached session cookie:

- **Managing the shared release catalog** (`/releases`) — adding, editing, or
  deleting entries. Every other account can still track/untrack releases,
  just not change the shared list itself.
- **The `/admin` page** — lists every registered account with join date,
  last login, and product/sale counts, and can delete an account (and all
  its data) for good. The nav only shows the "Admin" link for this account;
  the page itself re-checks `isDeveloper` and redirects anyone else away.

To grant or revoke it, update the `isDeveloper` column on that `Account` row
directly in the database — there's no UI for it (deliberately: it's not
something you'd want a compromised session to be able to grant itself).

## Local development

```bash
npm install
npx prisma migrate dev   # applies any pending migrations to the database in .env
npm run dev
```

Open http://localhost:3000. The app is mobile-first — resize your browser or open dev tools' device toolbar to preview it as a phone.

Local dev and production currently point at the **same** Neon Postgres
database (see [Database](#database-neon-postgres) below) — there's only one
environment right now, which is fine for a 2-person app. If that ever feels
risky while testing new features, Neon supports branching a database for a
free, isolated copy to develop against; not set up yet, but easy to add later.

### Creating an account

Use the public `/register` page, or create/reset one directly against the database (useful for local setup):

```bash
npm run create-account -- "Name" "email@example.com" "password"
```

Re-running with the same email updates that account's name/password rather than creating a duplicate. Once you're logged in, you don't need this script for day-to-day changes — use `/settings` instead.

## Database (Neon Postgres)

The database is hosted on [Neon](https://neon.tech), project region **eu-west-2
(London)** — chosen for the lowest latency from the UK. Only the "Postgres
database" product was enabled for this project (not Neon's Object storage,
Functions, AI gateway, or Neon Auth add-ons — this app doesn't use any of
those).

Neon gives you two connection strings for the same database, and this project
uses both (see `prisma/schema.prisma`'s `datasource` block):

- **`DATABASE_URL`** — the **pooled** connection (hostname contains `-pooler`).
  Used by the running app, since serverless functions open lots of short-lived
  connections and pooling keeps that from exhausting Postgres's connection limit.
- **`DIRECT_URL`** — the **direct**, non-pooled connection (same hostname,
  minus `-pooler`). Used only by Prisma Migrate, since schema migrations need
  a direct connection.

If you ever need to rotate credentials or grab these again: Neon dashboard →
your project → **Connect** (or **Connection Details**) → copy the pooled
string for `DATABASE_URL`, and toggle off "pooled connection" (or strip
`-pooler` from the hostname yourself) for `DIRECT_URL`.

The developer account (`PsyJands@gmail.com` — see
[The developer account](#the-developer-account) above) already exists in this
database, created via `npm run create-account`, so there's nothing to
register once this is deployed — just log in.

## Password reset & email

Forgot-password emails are sent through [Resend](https://resend.com)'s HTTP API
via plain `fetch` — no SDK to install. Without `RESEND_API_KEY` set, the email
is instead logged to the server console (masked recipient address, full link),
which is enough to develop and test the flow locally without sending anything.

To make it actually send in production:

1. Sign up for Resend (free tier is plenty for this) and create an API key.
2. Set `RESEND_API_KEY` in your environment.
3. Verify a sending domain in Resend and set `EMAIL_FROM` to an address on it
   (e.g. `PokéStock <noreply@yourdomain.com>`). Until you do, Resend's shared
   `onboarding@resend.dev` sender only delivers to *your own* Resend account
   email — fine for just you, not for other people's accounts requesting resets.

Every reset email/log line shows a **masked** version of the address
(`p******s@g***l.com`) rather than the real one, both in the server log and on
the reset-password page itself, so a leaked log line or shared screenshot
doesn't expose the full address.

## Release notifications & the reminder cron

Two kinds of email go out to accounts tracking a release, both through the
same Resend setup as password reset (console-logged locally without
`RESEND_API_KEY`):

- **Status changes** — the moment the developer account changes a release's
  status, everyone tracking it is emailed immediately (from the same server
  action that made the change).
- **"Releasing soon"** — a daily check (`GET /api/cron/release-reminders`)
  emails trackers of any `UPCOMING` release landing within 48 hours, once per
  release (tracked via `remindedAt` on `ReleaseEvent`, so it won't repeat).

That endpoint isn't triggered by anything on its own — it needs a scheduler
to call it. `vercel.json` already declares a Vercel Cron job that hits it
daily at 08:00 UTC once this is deployed on Vercel. To secure it:

1. Set a `CRON_SECRET` environment variable (any long random string).
2. Vercel Cron automatically sends `Authorization: Bearer <CRON_SECRET>` on
   the requests it triggers, which the route checks against your env var.
3. To test it yourself outside of the schedule, hit
   `/api/cron/release-reminders?secret=<CRON_SECRET>` directly.

Without `CRON_SECRET` set, the endpoint refuses every request (fails closed)
rather than running unauthenticated.

## Environment variables (`.env`)

- `DATABASE_URL` — Neon's **pooled** Postgres connection string; see [Database (Neon Postgres)](#database-neon-postgres) above.
- `DIRECT_URL` — Neon's **direct** (non-pooled) connection string, used only for running migrations; see [Database (Neon Postgres)](#database-neon-postgres) above.
- `AUTH_SECRET` — random secret used to sign session cookies. A value has already been generated for you; keep it out of git (it already is, via `.gitignore`) and don't reuse it elsewhere. Vercel should get its **own**, separately generated value — see the deploy steps below.
- `RESEND_API_KEY` (optional) — enables real password-reset and release-notification emails; see [Password reset & email](#password-reset--email) above.
- `EMAIL_FROM` (optional) — the "from" address for those emails once you've verified a domain with Resend.
- `CRON_SECRET` (needed for the reminder job) — see [Release notifications & the reminder cron](#release-notifications--the-reminder-cron) above. The value currently in local `.env` is a dev-only placeholder — Vercel needs its own real random value.

## Deploying so you can use it from your phones

Progress so far:

- [x] **Code pushed to GitHub** — https://github.com/JoshEds2527/PokeStock
- [x] **Postgres database created** — Neon, region eu-west-2 (London); see [Database (Neon Postgres)](#database-neon-postgres) above.
- [x] **Prisma switched to Postgres** — schema, migrations, and the developer account all already live in that database.
- [x] **Build script updated** — `npm run build` now runs `prisma migrate deploy` before `next build`, so every future deploy automatically applies any new migrations to the production database with no manual step.
- [ ] **Import the project on Vercel**
- [ ] **Set environment variables in Vercel**
- [ ] **Deploy and verify**
- [ ] **Add to home screen on both phones**

Remaining steps:

1. **Import the project on [vercel.com](https://vercel.com)** (Add New → Project → pick the `PokeStock` GitHub repo).
2. **Set environment variables in Vercel** (Project Settings → Environment Variables) — same names as [above](#environment-variables-env):
   - `DATABASE_URL` and `DIRECT_URL` — the same Neon values from local `.env`.
   - `AUTH_SECRET` — a **new**, separately generated value (don't reuse the local dev one) — run `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` and paste the result.
   - `CRON_SECRET` — a **new** long random string (same command as above works) — the local `.env` value is a dev-only placeholder, not safe to reuse.
   - `RESEND_API_KEY` and `EMAIL_FROM` (optional) — only if you want password-reset/notification emails to actually send rather than log to the console.
3. **Deploy.** Vercel runs `npm install` (which runs `prisma generate` via the `postinstall` script) and `npm run build` (which now runs migrations first) automatically.
4. **Log in** at the deployed URL with the existing developer account — no need to register, it's already in the database.
5. Open the Vercel URL on your phones and add it to your home screen (Safari/Chrome → Share → Add to Home Screen) — it behaves like an app.

## Phase 2 (not built yet)

- **eBay UK sold-listing prices** via eBay's official Browse API (needs a free eBay developer account + API keys).
- **Automated stock/price monitoring** for retailer and marketplace pages. Note: Vinted and most UK retailers (Smyths, Argos, Pokémon Center, etc.) have no public API, so this means scraping their pages, which usually breaches their Terms of Service and can get blocked. Worth deciding site-by-site whether it's worth the risk/fragility versus checking manually.

## Future: monetization (not built yet)

The account model above is the prerequisite for this. To charge for access later:
add a plan/subscription field to `Account`, gate specific routes or features
based on it, and integrate Stripe Checkout + webhooks to manage the billing
lifecycle (trials, upgrades, cancellations, failed payments).
