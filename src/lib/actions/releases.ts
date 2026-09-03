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

export async function addReleaseAction(
  _prevState: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const accountId = await requireAccountId();

  const productName = String(formData.get("productName") || "").trim();
  const retailer = String(formData.get("retailer") || "").trim();
  const releaseDateRaw = String(formData.get("releaseDate") || "");
  const url = String(formData.get("url") || "").trim();
  const status = String(formData.get("status") || "UPCOMING") as ReleaseStatus;
  const notes = String(formData.get("notes") || "").trim();

  if (!productName) return { error: "Product name is required." };
  if (!releaseDateRaw) return { error: "Release date is required." };

  await prisma.releaseEvent.create({
    data: {
      accountId,
      productName,
      retailer: retailer || null,
      releaseDate: new Date(releaseDateRaw),
      url: url || null,
      status,
      notes: notes || null,
    },
  });

  revalidatePath("/releases");
  return { success: true };
}

export async function deleteReleaseAction(formData: FormData) {
  const accountId = await requireAccountId();
  const id = String(formData.get("id") || "");
  if (!id) return;
  await prisma.releaseEvent.deleteMany({ where: { id, accountId } });
  revalidatePath("/releases");
}

export async function updateReleaseAction(
  _prevState: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const accountId = await requireAccountId();

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
    where: { id, accountId },
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
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "") as ReleaseStatus;
  if (!id || !status) return;
  await prisma.releaseEvent.updateMany({ where: { id, accountId }, data: { status } });
  revalidatePath("/releases");
}
