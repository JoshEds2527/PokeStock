import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { runListingWatchCheck } from "@/lib/listingWatchChecker";

// Sitemap fetches (especially John Lewis's 49-file product index) can take a
// while; give this more room than the default before Vercel kills it.
export const maxDuration = 60;

// Meant to be hit periodically by a scheduler (Vercel Cron once deployed --
// see vercel.json and the README). Runs every active ListingWatch across
// every account and emails on anything genuinely new.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  const providedViaHeader = authHeader?.replace(/^Bearer\s+/i, "");
  const providedViaQuery = request.nextUrl.searchParams.get("secret");
  const provided = providedViaHeader || providedViaQuery;

  if (!secret || provided !== secret) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const watches = await prisma.listingWatch.findMany({ where: { active: true } });

  // Sequential on purpose: several of these sitemaps are tens of MB, and
  // running them all concurrently risks spiking memory on top of the time
  // limit above.
  const results = [];
  for (const watch of watches) {
    const result = await runListingWatchCheck(watch.id);
    results.push({ id: watch.id, keyword: watch.keyword, retailer: watch.retailer, ...result });
  }

  return Response.json({ checked: results.length, results });
}
