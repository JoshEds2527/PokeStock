import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { runStockWatchCheck } from "@/lib/stockWatchChecker";

// Product-page fetches can be slow (some sites are heavy); give this more
// room than the default before Vercel kills it, same as listing-watches.
export const maxDuration = 60;

// Meant to be hit periodically by Vercel Cron (see vercel.json and the
// README). Runs every active StockWatch across every account and emails on
// anything that just transitioned into stock.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  const providedViaHeader = authHeader?.replace(/^Bearer\s+/i, "");
  const providedViaQuery = request.nextUrl.searchParams.get("secret");
  const provided = providedViaHeader || providedViaQuery;

  if (!secret || provided !== secret) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const watches = await prisma.stockWatch.findMany({ where: { active: true } });

  // Sequential on purpose, matching listing-watches -- keeps this predictable
  // within the time limit above rather than risking a burst of concurrent
  // fetches against sites we don't control.
  const results = [];
  for (const watch of watches) {
    const result = await runStockWatchCheck(watch.id);
    results.push({ id: watch.id, retailerName: watch.retailerName, ...result });
  }

  return Response.json({ checked: results.length, results });
}
