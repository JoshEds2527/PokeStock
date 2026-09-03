"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { ReleaseStatus } from "@prisma/client";
import type { ActionResult } from "@/lib/actions/inventory";

async function requireAccountId() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session.accountId;
}

async function isDeveloperAccount(accountId: string) {
  const account = await prisma.account.findUnique({
    where: { id: accountId },
    select: { isDeveloper: true },
  });
  return account?.isDeveloper ?? false;
}

async function trackForAccount(accountId: string, releaseId: string) {
  await prisma.trackedRelease.upsert({
    where: { accountId_releaseId: { accountId, releaseId } },
    create: { accountId, releaseId },
    update: {},
  });
}

export async function addReleaseAction(
  _prevState: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const accountId = await requireAccountId();
  if (!(await isDeveloperAccount(accountId))) {
    return { error: "Only the developer account can add releases to the shared list." };
  }

  const productName = String(formData.get("productName") || "").trim();
  const retailer = String(formData.get("retailer") || "").trim();
  const releaseDateRaw = String(formData.get("releaseDate") || "");
  const url = String(formData.get("url") || "").trim();
  const status = String(formData.get("status") || "UPCOMING") as ReleaseStatus;
  const notes = String(formData.get("notes") || "").trim();

  if (!productName) return { error: "Product name is required." };
  if (!releaseDateRaw) return { error: "Release date is required." };

  const releaseDate = new Date(releaseDateRaw);

  // Avoid cluttering the shared catalog with duplicates: if a release with
  // the same product name and date already exists, just track that one
  // instead of creating a copy.
  const candidates = await prisma.releaseEvent.findMany({ where: { releaseDate } });
  const normalized = productName.toLowerCase();
  const existing = candidates.find((r) => r.productName.trim().toLowerCase() === normalized);

  if (existing) {
    await trackForAccount(accountId, existing.id);
    revalidatePath("/releases");
    return {
      success: true,
      info: `"${existing.productName}" is already in the shared list — added it to your tracked releases instead of creating a duplicate.`,
    };
  }

  const release = await prisma.releaseEvent.create({
    data: {
      productName,
      retailer: retailer || null,
      releaseDate,
      url: url || null,
      status,
      notes: notes || null,
      createdByAccountId: accountId,
    },
  });
  await trackForAccount(accountId, release.id);

  revalidatePath("/releases");
  return { success: true };
}

export async function deleteReleaseAction(formData: FormData) {
  const accountId = await requireAccountId();
  if (!(await isDeveloperAccount(accountId))) return;
  const id = String(formData.get("id") || "");
  if (!id) return;
  await prisma.releaseEvent.delete({ where: { id } });
  revalidatePath("/releases");
}

export async function updateReleaseAction(
  _prevState: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const accountId = await requireAccountId();
  if (!(await isDeveloperAccount(accountId))) {
    return { error: "Only the developer account can edit releases." };
  }

  const id = String(formData.get("id") || "");
  const productName = String(formData.get("productName") || "").trim();
  const retailer = String(formData.get("retailer") || "").trim();
  const releaseDateRaw = String(formData.get("releaseDate") || "");
  const url = String(formData.get("url") || "").trim();
  const status = String(formData.get("status") || "UPCOMING") as ReleaseStatus;
  const notes = String(formData.get("notes") || "").trim();

  if (!id) return { error: "Missing release." };
  if (!productName) return { error: "Product name is required." };
  if (!releaseDateRaw) return { error: "Release date is required." };

  const result = await prisma.releaseEvent.updateMany({
    where: { id },
    data: {
      productName,
      retailer: retailer || null,
      releaseDate: new Date(releaseDateRaw),
      url: url || null,
      status,
      notes: notes || null,
    },
  });
  if (result.count === 0) return { error: "Release not found." };

  revalidatePath("/releases");
  return { success: true };
}

export async function updateReleaseStatusAction(formData: FormData) {
  const accountId = await requireAccountId();
  if (!(await isDeveloperAccount(accountId))) return;
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "") as ReleaseStatus;
  if (!id || !status) return;
  await prisma.releaseEvent.updateMany({ where: { id }, data: { status } });
  revalidatePath("/releases");
}

export async function trackReleaseAction(formData: FormData) {
  const accountId = await requireAccountId();
  const releaseId = String(formData.get("releaseId") || "");
  if (!releaseId) return;
  await trackForAccount(accountId, releaseId);
  revalidatePath("/releases");
}

export async function untrackReleaseAction(formData: FormData) {
  const accountId = await requireAccountId();
  const releaseId = String(formData.get("releaseId") || "");
  if (!releaseId) return;
  await prisma.trackedRelease.deleteMany({ where: { accountId, releaseId } });
  revalidatePath("/releases");
}
