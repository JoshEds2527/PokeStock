"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { currentOrigin } from "@/lib/origin";
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

// Emails everyone tracking a release when its status changes (e.g. UPCOMING
// -> DELAYED). Best-effort: failures are logged by sendEmail itself and
// don't block the status update that triggered this.
async function notifyStatusChange(releaseId: string, productName: string, status: string) {
  const trackers = await prisma.trackedRelease.findMany({
    where: { releaseId },
    include: { account: { select: { email: true } } },
  });
  if (trackers.length === 0) return;

  const origin = await currentOrigin();
  const releasesUrl = `${origin}/releases`;
  const friendlyStatus = status.charAt(0) + status.slice(1).toLowerCase();

  await Promise.all(
    trackers.map((t) =>
      sendEmail({
        to: t.account.email,
        subject: `${productName}: now ${friendlyStatus}`,
        text: `A release you're tracking on PokéStock has changed status.\n\n${productName} is now ${friendlyStatus}.\n\nView it: ${releasesUrl}`,
        html: `<p>A release you're tracking on PokéStock has changed status.</p><p><strong>${productName}</strong> is now <strong>${friendlyStatus}</strong>.</p><p><a href="${releasesUrl}">View it in PokéStock</a></p>`,
      })
    )
  );
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

  const before = await prisma.releaseEvent.findUnique({
    where: { id },
    select: { status: true },
  });
  if (!before) return { error: "Release not found." };

  await prisma.releaseEvent.update({
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

  if (before.status !== status) {
    await notifyStatusChange(id, productName, status);
  }

  revalidatePath("/releases");
  return { success: true };
}

export async function updateReleaseStatusAction(formData: FormData) {
  const accountId = await requireAccountId();
  if (!(await isDeveloperAccount(accountId))) return;
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "") as ReleaseStatus;
  if (!id || !status) return;

  const before = await prisma.releaseEvent.findUnique({
    where: { id },
    select: { status: true, productName: true },
  });
  if (!before) return;

  await prisma.releaseEvent.updateMany({ where: { id }, data: { status } });

  if (before.status !== status) {
    await notifyStatusChange(id, before.productName, status);
  }

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
