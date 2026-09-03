import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { createNotification } from "@/lib/notifications";

// Scoped endpoint for the weekly release-research cloud routine (see
// README's "Automated release research" section) to submit newly-found
// Pokemon TCG release dates. Deliberately narrow: this can only create
// ReleaseEvent rows and a summary notification, not touch anything else --
// the routine is handed this endpoint's CRON_SECRET, not raw database
// credentials, so a compromised or misbehaving routine has a small blast
// radius. Same dedup rule as the in-app "add release" action: same
// case-insensitive product name + same exact date is treated as a
// duplicate rather than creating a copy.
export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  const providedViaHeader = authHeader?.replace(/^Bearer\s+/i, "");
  const providedViaQuery = request.nextUrl.searchParams.get("secret");
  const provided = providedViaHeader || providedViaQuery;

  if (!secret || provided !== secret) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  type IncomingRelease = {
    productName?: unknown;
    retailer?: unknown;
    releaseDate?: unknown;
    url?: unknown;
    notes?: unknown;
  };

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!Array.isArray(body)) {
    return Response.json({ error: "Body must be a JSON array of releases." }, { status: 400 });
  }
  if (body.length === 0) {
    return Response.json({ created: 0, skipped: 0, createdNames: [] });
  }
  if (body.length > 50) {
    return Response.json({ error: "Too many releases in one request (max 50)." }, { status: 400 });
  }

  const developer = await prisma.account.findFirst({ where: { isDeveloper: true } });
  if (!developer) {
    return Response.json({ error: "No developer account found to attribute releases to." }, { status: 500 });
  }

  let created = 0;
  let skipped = 0;
  let invalid = 0;
  const createdNames: string[] = [];

  for (const raw of body as IncomingRelease[]) {
    const productName = typeof raw.productName === "string" ? raw.productName.trim() : "";
    const releaseDateRaw = typeof raw.releaseDate === "string" ? raw.releaseDate.trim() : "";
    const retailer = typeof raw.retailer === "string" ? raw.retailer.trim() : "";
    const url = typeof raw.url === "string" ? raw.url.trim() : "";
    const notes = typeof raw.notes === "string" ? raw.notes.trim() : "";

    if (!productName || !releaseDateRaw) {
      invalid++;
      continue;
    }

    const releaseDate = new Date(releaseDateRaw);
    if (Number.isNaN(releaseDate.getTime())) {
      invalid++;
      continue;
    }

    const candidates = await prisma.releaseEvent.findMany({ where: { releaseDate } });
    const normalized = productName.toLowerCase();
    const existing = candidates.find((c) => c.productName.trim().toLowerCase() === normalized);
    if (existing) {
      skipped++;
      continue;
    }

    const release = await prisma.releaseEvent.create({
      data: {
        productName,
        retailer: retailer || null,
        releaseDate,
        url: url || null,
        notes: notes || null,
        status: "UPCOMING",
        createdByAccountId: developer.id,
      },
    });
    await prisma.trackedRelease.upsert({
      where: { accountId_releaseId: { accountId: developer.id, releaseId: release.id } },
      create: { accountId: developer.id, releaseId: release.id },
      update: {},
    });

    created++;
    createdNames.push(productName);
  }

  if (created > 0) {
    await createNotification(
      developer.id,
      `Weekly release check: added ${created} new release${created === 1 ? "" : "s"}`,
      "/releases"
    );
  }

  return Response.json({ created, skipped, invalid, createdNames });
}
