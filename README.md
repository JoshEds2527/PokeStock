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
- **Inventory** — add products, log purchases ("stock in"), see current stock, average cost, and total spent per product. Full purchase history with edit/delete, and a CSV export of the full history.
- **Sales** — log sales with platform (eBay/Vinted/Facebook/Depop/in person), fees, and postage. Sortable, filterable, editable, and exportable to CSV.
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
- `EBAY_CLIENT_ID` / `EBAY_CLIENT_SECRET` (optional, phase 2) — from an eBay Developer account application. Not set yet — Josh's eBay developer account is pending approval. Until both are set, the Market page's "Fetch eBay prices" button shows a friendly "not connected yet" message instead of erroring; see [Phase 2](#phase-2-in-progress) below.
- `EBAY_ENV` (optional, phase 2) — `sandbox` (default) or `production`. Use `production` once real API keys are in.

## Deploying so you can use it from your phones

**Live URL:** https://poke-stock-git-master-app-track.vercel.app/ — this is
Vercel's "updates automatically" branch URL for `master`; every future push
to `master` redeploys and this same link stays current. Deployed via Vercel
project name `PokeStock` (GitHub account `app-track`).

Progress so far:

- [x] **Code pushed to GitHub** — https://github.com/JoshEds2527/PokeStock
- [x] **Postgres database created** — Neon, region eu-west-2 (London); see [Database (Neon Postgres)](#database-neon-postgres) above.
- [x] **Prisma switched to Postgres** — schema, migrations, and the developer account all already live in that database.
- [x] **Build script updated** — `npm run build` now runs `prisma migrate deploy` before `next build`, so every future deploy automatically applies any new migrations to the production database with no manual step.
- [x] **Imported the project on Vercel**
- [x] **Set environment variables in Vercel** — `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, `CRON_SECRET` (production-only values, generated fresh — not the local `.env` ones).
- [x] **Deployed and verified** — logged in with the developer account, dashboard and Admin page both confirmed working against the live Neon database.
- [ ] **Add to home screen on both phones**

Remaining step:

1. Open the live URL above on both phones and add it to the home screen (Safari/Chrome → Share/menu → Add to Home Screen) — it behaves like an app.

### Notes for future deploys / troubleshooting

- **Deployment Protection**: Vercel enables "Vercel Authentication" on new
  projects by default, which blocks anyone not logged into Vercel from
  loading the site (redirects to a Vercel login page instead of the app).
  Already **disabled** for this project under Settings → Deployment
  Protection — if a fresh clone/project ever shows a Vercel login page
  instead of PokéStock, check that setting first.
- **Pasting secrets into Vercel's env var fields**: a plain paste corrupted
  a generated secret once (an em-dash appeared in place of a character,
  which Prisma/Node reject as invalid). If a build ever fails with a
  "non-ASCII character" or "scheme is not recognized in database URL"
  error, the fix is to regenerate the value with
  `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
  (hex output has no slashes/plus signs, so it survives copy-paste more
  reliably than base64) and re-paste carefully, ideally via a plain text
  editor as an intermediate step rather than pasting directly between apps.

## Phase 2 (in progress)

### eBay sold-listing prices

- [ ] Create a free eBay Developer account and an application (gives Client ID/Secret). **Status: pending eBay's approval** (Josh applied 2026-09-03).
- [ ] **Decision needed:** eBay's Browse API only covers *active* listings, not sold ones. Actual sold-price history needs the Marketplace Insights API, which requires separate eBay approval (not automatically granted to new developer accounts). Researching whether that approval is realistic while waiting on the account.
- [x] Server-side OAuth (client-credentials flow) to fetch and cache an eBay access token — `src/lib/ebay.ts`.
- [x] Function to query eBay for a product name and parse out price results — `searchActiveListings()` in `src/lib/ebay.ts` (active listings only, per the decision above; `searchSoldListings()` is a deliberate stub until Marketplace Insights approval is confirmed).
- [x] Store results in the existing `MarketListing` table — see `fetchEbayPricesAction` in `src/lib/actions/market.ts`.
- [x] `/market` page: "Fetch eBay prices" button per product (`EbayPriceLookup.tsx`). Shows a friendly "not connected yet" message until `EBAY_CLIENT_ID`/`EBAY_CLIENT_SECRET` are set (can't be tested end-to-end until the developer account is approved).
- [ ] Cache/rate-limit lookups so we don't burn through eBay's API call limits — not yet needed since it isn't live; revisit once real keys are in and we see actual usage.

### Automated stock/back-end monitoring

Build this as a generic, per-retailer checker (not hardcoded to one site), so
new retailers can be added later without a rewrite. **When work starts on
this item: ask Josh which retailers to set up first** — don't assume a list.
Then set each one up individually.

- [x] Build the `StockWatch` UI — add/edit/delete a watch (retailer, product page URL, optional linked product, check interval, active toggle) on the Market page. No checking logic yet — it's just a managed list for now.
- [x] Ask Josh for the retailer list. **Chosen retailers:** Smyths, Argos, Very UK, John Lewis, Pokémon Center, Savvi, Hamleys, Chaos Cards.
- [ ] Per retailer above: check for an official stock API/RSS feed; where there isn't one, decide case-by-case whether scraping is worth the ToS/fragility risk versus checking manually. Research in progress.
- [ ] Build a generic checker job (one retailer "adapter" per site) that visits each watched URL/endpoint and updates `StockWatch.status`.
- [ ] "Back in stock" email, reusing the existing email system.
- [ ] Vercel Cron job to run the stock checker periodically (same pattern as the existing release-reminder cron).

### Wrap-up

- [ ] Document the new eBay app keys / any new environment variables in this README.

## Future: monetization (not built yet)

The account model above is the prerequisite for this. To charge for access later:
add a plan/subscription field to `Account`, gate specific routes or features
based on it, and integrate Stripe Checkout + webhooks to manage the billing
lifecycle (trials, upgrades, cancellations, failed payments).
