"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { isValidRetailer } from "@/lib/retailers";
import { runListingWatchCheck, type ListingWatchCheckResult } from "@/lib/listingWatchChecker";
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

export type { ListingWatchCheckResult as CheckListingWatchResult };

export async function checkListingWatchAction(
  _prevState: ListingWatchCheckResult | undefined,
  formData: FormData
): Promise<ListingWatchCheckResult> {
  const accountId = await requireAccountId();
  const id = String(formData.get("id") || "");

  // Ownership check stays here (session-scoped); the actual check logic is
  // shared with the cron job via runListingWatchCheck.
  const watch = await prisma.listingWatch.findFirst({ where: { id, accountId } });
  if (!watch) return { error: "Watch not found." };

  const result = await runListingWatchCheck(watch.id);
  revalidatePath("/market");
  return result;
}
