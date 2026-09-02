"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { SalePlatform } from "@prisma/client";
import type { ActionResult } from "@/lib/actions/inventory";

async function requireUserId() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session.userId;
}

export async function addSaleAction(
  _prevState: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const userId = await requireUserId();

  const productId = String(formData.get("productId") || "");
  const quantity = Number(formData.get("quantity") || 0);
  const unitSalePrice = Number(formData.get("unitSalePrice") || 0);
  const platform = String(formData.get("platform") || "OTHER") as SalePlatform;
  const fees = Number(formData.get("fees") || 0);
  const shippingCost = Number(formData.get("shippingCost") || 0);
  const saleDateRaw = String(formData.get("saleDate") || "");
  const notes = String(formData.get("notes") || "").trim();

  if (!productId) return { error: "Choose a product." };
  if (!quantity || quantity <= 0) return { error: "Quantity must be greater than 0." };
  if (unitSalePrice < 0 || Number.isNaN(unitSalePrice))
    return { error: "Enter a valid sale price." };

  await prisma.sale.create({
    data: {
      productId,
      quantity,
      unitSalePrice,
      platform,
      fees: Number.isNaN(fees) ? 0 : fees,
      shippingCost: Number.isNaN(shippingCost) ? 0 : shippingCost,
      saleDate: saleDateRaw ? new Date(saleDateRaw) : new Date(),
      notes: notes || null,
      createdById: userId,
    },
  });

  revalidatePath("/sales");
  revalidatePath("/");
  return { success: true };
}

export async function updateSaleAction(
  _prevState: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  await requireUserId();

  const id = String(formData.get("id") || "");
  const quantity = Number(formData.get("quantity") || 0);
  const unitSalePrice = Number(formData.get("unitSalePrice") || 0);
  const platform = String(formData.get("platform") || "OTHER") as SalePlatform;
  const fees = Number(formData.get("fees") || 0);
  const shippingCost = Number(formData.get("shippingCost") || 0);
  const saleDateRaw = String(formData.get("saleDate") || "");
  const notes = String(formData.get("notes") || "").trim();

  if (!id) return { error: "Missing sale." };
  if (!quantity || quantity <= 0) return { error: "Quantity must be greater than 0." };
  if (unitSalePrice < 0 || Number.isNaN(unitSalePrice))
    return { error: "Enter a valid sale price." };

  await prisma.sale.update({
    where: { id },
    data: {
      quantity,
      unitSalePrice,
      platform,
      fees: Number.isNaN(fees) ? 0 : fees,
      shippingCost: Number.isNaN(shippingCost) ? 0 : shippingCost,
      saleDate: saleDateRaw ? new Date(saleDateRaw) : new Date(),
      notes: notes || null,
    },
  });

  revalidatePath("/sales");
  revalidatePath("/");
  return { success: true };
}

export async function deleteSaleAction(formData: FormData) {
  await requireUserId();
  const id = String(formData.get("id") || "");
  if (!id) return;
  await prisma.sale.delete({ where: { id } });
  revalidatePath("/sales");
  revalidatePath("/");
}
