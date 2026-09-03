"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import type { ActionResult } from "@/lib/actions/inventory";

async function requireAccountId() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session.accountId;
}

function parseUrl(raw: string): string | null {
  const trimmed = raw.trim();
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

function parseCheckInterval(raw: string): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 5) return 30;
  return Math.round(n);
}

export async function addStockWatchAction(
  _prevState: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const accountId = await requireAccountId();

  const productId = String(formData.get("productId") || "").trim();
  const retailerName = String(formData.get("retailerName") || "").trim();
  const urlRaw = String(formData.get("url") || "");
  const checkIntervalMinutes = parseCheckInterval(String(formData.get("checkIntervalMinutes") || ""));

  if (!retailerName) return { error: "Retailer name is required." };
  const url = parseUrl(urlRaw);
  if (!url) return { error: "Enter a valid product page URL (starting with http:// or https://)." };

  if (productId) {
    const product = await prisma.product.findFirst({ where: { id: productId, accountId } });
    if (!product) return { error: "Product not found." };
  }

  await prisma.stockWatch.create({
    data: {
      accountId,
      productId: productId || null,
      retailerName,
      url,
      checkIntervalMinutes,
    },
  });

  revalidatePath("/market");
  return { success: true };
}

export async function updateStockWatchAction(
  _prevState: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const accountId = await requireAccountId();

  const id = String(formData.get("id") || "");
  const productId = String(formData.get("productId") || "").trim();
  const retailerName = String(formData.get("retailerName") || "").trim();
  const urlRaw = String(formData.get("url") || "");
  const checkIntervalMinutes = parseCheckInterval(String(formData.get("checkIntervalMinutes") || ""));
  const active = formData.get("active") === "on";

  if (!id) return { error: "Missing watch." };
  if (!retailerName) return { error: "Retailer name is required." };
  const url = parseUrl(urlRaw);
  if (!url) return { error: "Enter a valid product page URL (starting with http:// or https://)." };

  if (productId) {
    const product = await prisma.product.findFirst({ where: { id: productId, accountId } });
    if (!product) return { error: "Product not found." };
  }

  const result = await prisma.stockWatch.updateMany({
    where: { id, accountId },
    data: {
      productId: productId || null,
      retailerName,
      url,
      checkIntervalMinutes,
      active,
    },
  });
  if (result.count === 0) return { error: "Watch not found." };

  revalidatePath("/market");
  return { success: true };
}

export async function deleteStockWatchAction(formData: FormData) {
  const accountId = await requireAccountId();
  const id = String(formData.get("id") || "");
  if (!id) return;
  await prisma.stockWatch.deleteMany({ where: { id, accountId } });
  revalidatePath("/market");
}
