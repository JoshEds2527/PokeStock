"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { ReleaseStatus } from "@prisma/client";
import type { ActionResult } from "@/lib/actions/inventory";

async function requireUserId() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session.userId;
}

export async function addReleaseAction(
  _prevState: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  await requireUserId();

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
  await requireUserId();
  const id = String(formData.get("id") || "");
  if (!id) return;
  await prisma.releaseEvent.delete({ where: { id } });
  revalidatePath("/releases");
}

export async function updateReleaseStatusAction(formData: FormData) {
  await requireUserId();
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "") as ReleaseStatus;
  if (!id || !status) return;
  await prisma.releaseEvent.update({ where: { id }, data: { status } });
  revalidatePath("/releases");
}
