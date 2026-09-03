"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { findMatchingListings, isValidRetailer, type RetailerId } from "@/lib/retailers";
import type { ActionResult } from "@/lib/actions/inventory";

async function requireAccountId() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session.accountId;
}

export async function addListingWatchAction(
  _prevState: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const accountId = await requireAccountId();

  const keyword = String(formData.get("keyword") || "").trim();
  const retailer = String(formData.get("retailer") || "");

  if (!keyword) return { error: "Enter a keyword to match against product pages." };
  if (!isValidRetailer(retailer)) return { error: "Choose a retailer." };

  await prisma.listingWatch.create({ data: { accountId, keyword, retailer } });

  revalidatePath("/market");
  return { success: true };
}

export async function deleteListingWatchAction(formData: FormData) {
  const accountId = await requireAccountId();
  const id = String(formData.get("id") || "");
  if (!id) return;
  await prisma.listingWatch.deleteMany({ where: { id, accountId } });
  revalidatePath("/market");
}

export type CheckListingWatchResult = {
  error?: string;
  newUrls?: string[];
  isFirstCheck?: boolean;
  baselineCount?: number;
};

export async function checkListingWatchAction(
  _prevState: CheckListingWatchResult | undefined,
  formData: FormData
): Promise<CheckListingWatchResult> {
  const accountId = await requireAccountId();
  const id = String(formData.get("id") || "");

  const watch = await prisma.listingWatch.findFirst({ where: { id, accountId } });
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
      const account = await prisma.account.findUnique({ where: { id: accountId } });
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
  revalidatePath("/market");

  return {
    newUrls: isFirstCheck ? [] : newUrls,
    isFirstCheck,
    baselineCount: isFirstCheck ? newUrls.length : undefined,
  };
}
