import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { findMatchingListings, isValidRetailer, type RetailerId } from "@/lib/retailers";

export type ListingWatchCheckResult = {
  error?: string;
  newUrls?: string[];
  isFirstCheck?: boolean;
  baselineCount?: number;
};

// Runs one ListingWatch's check: fetch the retailer's sitemap, diff against
// previously seen URLs, email the account on anything genuinely new. Shared
// between the manual "Check now" button (src/lib/actions/listingwatch.ts)
// and the scheduled cron job (src/app/api/cron/listing-watches/route.ts) so
// the two never drift out of sync.
export async function runListingWatchCheck(watchId: string): Promise<ListingWatchCheckResult> {
  const watch = await prisma.listingWatch.findUnique({ where: { id: watchId } });
  if (!watch) return { error: "Watch not found." };
  if (!isValidRetailer(watch.retailer)) return { error: "Unknown retailer." };

  let matches: string[];
  try {
    matches = await findMatchingListings(watch.retailer as RetailerId, watch.keyword);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Check failed." };
  }

  const existing = await prisma.seenListing.findMany({
    where: { watchId: watch.id },
    select: { url: true },
  });
  const existingUrls = new Set(existing.map((e) => e.url));
  const newUrls = matches.filter((url) => !existingUrls.has(url));

  // First-ever check just establishes the baseline -- every currently
  // matching product would otherwise look "new" and trigger a flood of
  // emails for things that have been listed for ages.
  const isFirstCheck = watch.lastCheckedAt === null;

  if (newUrls.length > 0) {
    await prisma.seenListing.createMany({
      data: newUrls.map((url) => ({ watchId: watch.id, url })),
      skipDuplicates: true,
    });

    if (!isFirstCheck) {
      const account = await prisma.account.findUnique({ where: { id: watch.accountId } });
      if (account) {
        await sendEmail({
          to: account.email,
          subject: `New listing: ${watch.keyword} (${watch.retailer})`,
          text: `New product page(s) matching "${watch.keyword}" just appeared:\n\n${newUrls.join("\n")}`,
          html: `<p>New product page(s) matching <strong>${watch.keyword}</strong> just appeared:</p><ul>${newUrls
            .map((url) => `<li><a href="${url}">${url}</a></li>`)
            .join("")}</ul>`,
        });
      }
    }
  }

  await prisma.listingWatch.update({ where: { id: watch.id }, data: { lastCheckedAt: new Date() } });

  return {
    newUrls: isFirstCheck ? [] : newUrls,
    isFirstCheck,
    baselineCount: isFirstCheck ? newUrls.length : undefined,
  };
}
