# PokéStock

A private stock, sales, and finance tracker for a two-person Pokémon reselling operation.

## What's here (phase 1)

- **Login** — shared app, separate accounts per person (`src/lib/auth.ts`, cookie-based sessions, no third-party auth service).
- **Dashboard** — total spent, net revenue, profit, units in stock, and a spend-vs-revenue-vs-profit chart over time.
- **Inventory** — add products, log purchases ("stock in"), see current stock and average cost per product.
- **Sales** — log sales with platform (eBay/Vinted/Facebook/Depop/in person), fees, and postage.
- **Releases** — track upcoming product release dates per retailer, with status (upcoming/released/delayed/cancelled).
- **Market** (placeholder) — quick manual links to eBay sold listings and Vinted search per product. Live automated market data and stock-alert monitoring are phase 2 (see below).

Built with Next.js 16 (App Router, Server Actions), Prisma + SQLite (dev) / PostgreSQL (production), Tailwind CSS, Recharts.

## Local development

```bash
npm install
npx prisma migrate dev   # creates/updates the local SQLite database
npm run dev
```

Open http://localhost:3000. The app is mobile-first — resize your browser or open dev tools' device toolbar to preview it as a phone.

### Creating accounts

There's no public sign-up page (this app is private to the two of you). Create or update an account with:

```bash
npm run create-user -- "Name" "email@example.com" "password"
```

Run it once for each of you. Re-running with the same email updates that person's name/password.

## Environment variables (`.env`)

- `DATABASE_URL` — SQLite file path locally (`file:./dev.db`); a PostgreSQL connection string in production.
- `AUTH_SECRET` — random secret used to sign session cookies. A value has already been generated for you; keep it out of git (it already is, via `.gitignore`) and don't reuse it elsewhere.

## Deploying so you can both use it from your phones

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
7. **Create your two accounts against the production database** — run locally with your production `DATABASE_URL` temporarily set in `.env`:
   ```bash
   npm run create-user -- "Josh" "you@example.com" "a-real-password"
   npm run create-user -- "Friend" "friend@example.com" "a-real-password"
   ```
8. Open the Vercel URL on your phones and add it to your home screen (Safari/Chrome → Share → Add to Home Screen) — it behaves like an app.

## Phase 2 (not built yet)

- **eBay UK sold-listing prices** via eBay's official Browse API (needs a free eBay developer account + API keys).
- **Automated stock/price monitoring** for retailer and marketplace pages. Note: Vinted and most UK retailers (Smyths, Argos, Pokémon Center, etc.) have no public API, so this means scraping their pages, which usually breaches their Terms of Service and can get blocked. Worth deciding site-by-site whether it's worth the risk/fragility versus checking manually.
