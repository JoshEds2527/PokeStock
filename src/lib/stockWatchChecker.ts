import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { createNotification } from "@/lib/notifications";
import { checkStockStatus } from "@/lib/stockCheck";

export type StockWatchCheckResult = {
  error?: string;
  status?: string;
  backInStock?: boolean;
};

// Runs one StockWatch's check: fetch the product page, infer in/out of
// stock status, and email + notify only on a genuine transition into stock.
// Shared between the manual "Check now" button
// (src/lib/actions/stockwatch.ts) and the scheduled cron job
// (src/app/api/cron/stock-watches/route.ts) so the two never drift apart.
export async function runStockWatchCheck(watchId: string): Promise<StockWatchCheckResult> {
  const watch = await prisma.stockWatch.findUnique({ where: { id: watchId } });
  if (!watch) return { error: "Watch not found." };

  let status: Awaited<ReturnType<typeof checkStockStatus>>;
  try {
    status = await checkStockStatus(watch.url);
  } catch (err) {
    await prisma.stockWatch.update({ where: { id: watch.id }, data: { lastCheckedAt: new Date() } });
    return { error: err instanceof Error ? err.message : "Check failed." };
  }

  // Only alert on OUT_OF_STOCK/UNKNOWN -> IN_STOCK. Not on the first-ever
  // check (which just establishes where things currently stand -- if it
  // happens to already be in stock, that's not "back in stock" news) and
  // not on staying in stock across repeated checks.
  const backInStock = watch.lastCheckedAt !== null && watch.status !== "IN_STOCK" && status === "IN_STOCK";

  await prisma.stockWatch.update({
    where: { id: watch.id },
    data: { status, lastCheckedAt: new Date() },
  });

  if (backInStock) {
    const account = await prisma.account.findUnique({ where: { id: watch.accountId } });
    if (account) {
      await sendEmail({
        to: account.email,
        subject: `Back in stock: ${watch.retailerName}`,
        text: `${watch.retailerName} now shows this as in stock:\n\n${watch.url}`,
        html: `<p><strong>${watch.retailerName}</strong> now shows this as in stock:</p><p><a href="${watch.url}">${watch.url}</a></p>`,
      });
      await createNotification(account.id, `Back in stock at ${watch.retailerName}`, "/market");
    }
  }

  return { status, backInStock };
}
