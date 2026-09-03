# PokéStock

A stock, sales, and finance tracker for Pokémon reselling. Multi-tenant: anyone
can register their own account, and each account's data is completely isolated
from every other account.

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
- **Releases** — a shared catalog of upcoming product releases (visible to every account, deduplicated by product name + date), with a personal "tracked releases" list layered on top so each account only follows what it cares about. Only the account that added a release can edit or delete it from the shared catalog; any account can track/untrack it.
- **Market** (placeholder) — quick manual links to eBay sold listings and Vinted search per product. Live automated market data and stock-alert monitoring are phase 2 (see below).

Every list supports sorting and filtering, every entry can be edited in place, and every delete requires confirmation.

Built with Next.js 16 (App Router, Server Actions), Prisma + SQLite (dev) / PostgreSQL (production), Tailwind CSS, Recharts.

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

## Local development

```bash
npm install
npx prisma migrate dev   # creates/updates the local SQLite database
npm run dev
```

Open http://localhost:3000. The app is mobile-first — resize your browser or open dev tools' device toolbar to preview it as a phone.

### Creating an account

Use the public `/register` page, or create/reset one directly against the database (useful for local setup):

```bash
npm run create-account -- "Name" "email@example.com" "password"
```

Re-running with the same email updates that account's name/password rather than creating a duplicate.

## Environment variables (`.env`)

- `DATABASE_URL` — SQLite file path locally (`file:./dev.db`); a PostgreSQL connection string in production.
- `AUTH_SECRET` — random secret used to sign session cookies. A value has already been generated for you; keep it out of git (it already is, via `.gitignore`) and don't reuse it elsewhere.

## Deploying so you can use it from your phones

This app needs a real, persistent database in production — SQLite (a local file) doesn't survive on Vercel's serverless hosting. The path below uses free tiers throughout.

1. **Push this project to a GitHub repo** (private is fine).
2. **Create a Postgres database** — [Neon](https://neon.tech) or [Supabase](https://supabase.com) both have free tiers that work well with Prisma. Copy the connection string they give you.
3. **Switch Prisma to Postgres:**
   - In `prisma/schema.prisma`, change:
     ```prisma
     datasource db {
       provider = "sqlite"
       url      = env("DATABASE_URL")
     }
     ```
     to:
     ```prisma
     datasource db {
       provider = "postgresql"
       url      = env("DATABASE_URL")
     }
     ```
   - Delete the `prisma/migrations` folder (it currently contains SQLite-flavoured SQL) and run `npx prisma migrate dev --name init` once locally with your **Postgres** connection string in `.env`, to generate fresh Postgres migrations. Commit the new `prisma/migrations` folder.
4. **Import the project on [vercel.com](https://vercel.com)** (Add New → Project → your GitHub repo).
5. **Set environment variables in Vercel** (Project Settings → Environment Variables):
   - `DATABASE_URL` — your Postgres connection string.
   - `AUTH_SECRET` — generate a new one for production, e.g. run `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` and paste the result.
6. **Deploy.** Vercel runs `npm install` (which runs `prisma generate` via the `postinstall` script) and `npm run build` automatically.
7. **Register your account** at the deployed URL's `/register` page (or run `npm run create-account` locally with your production `DATABASE_URL` temporarily set in `.env`).
8. Open the Vercel URL on your phones and add it to your home screen (Safari/Chrome → Share → Add to Home Screen) — it behaves like an app.

## Phase 2 (not built yet)

- **eBay UK sold-listing prices** via eBay's official Browse API (needs a free eBay developer account + API keys).
- **Automated stock/price monitoring** for retailer and marketplace pages. Note: Vinted and most UK retailers (Smyths, Argos, Pokémon Center, etc.) have no public API, so this means scraping their pages, which usually breaches their Terms of Service and can get blocked. Worth deciding site-by-site whether it's worth the risk/fragility versus checking manually.

## Future: monetization (not built yet)

The account model above is the prerequisite for this. To charge for access later:
add a plan/subscription field to `Account`, gate specific routes or features
based on it, and integrate Stripe Checkout + webhooks to manage the billing
lifecycle (trials, upgrades, cancellations, failed payments).
