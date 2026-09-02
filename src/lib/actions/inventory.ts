"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { ProductCategory } from "@prisma/client";

async function requireUserId() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session.userId;
}

export type ActionResult = { error?: string; success?: boolean };

export async function addProductAction(
  _prevState: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  await requireUserId();

  const name = String(formData.get("name") || "").trim();
  const setName = String(formData.get("setName") || "").trim();
  const category = String(formData.get("category") || "OTHER") as ProductCategory;
  const msrpRaw = String(formData.get("msrp") || "").trim();

  if (!name) return { error: "Product name is required." };

  await prisma.product.create({
    data: {
      name,
      setName: setName || null,
      category,
      msrp: msrpRaw ? Number(msrpRaw) : null,
    },
  });

  revalidatePath("/inventory");
  return { success: true };
}

export async function addPurchaseAction(
  _prevState: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const userId = await requireUserId();

  const productId = String(formData.get("productId") || "");
  const quantity = Number(formData.get("quantity") || 0);
  const unitCost = Number(formData.get("unitCost") || 0);
  const retailer = String(formData.get("retailer") || "").trim();
  const purchaseDateRaw = String(formData.get("purchaseDate") || "");
  const notes = String(formData.get("notes") || "").trim();

  if (!productId) return { error: "Choose a product." };
  if (!quantity || quantity <= 0) return { error: "Quantity must be greater than 0." };
  if (unitCost < 0 || Number.isNaN(unitCost)) return { error: "Enter a valid unit cost." };

  await prisma.purchase.create({
    data: {
      productId,
      quantity,
      unitCost,
      retailer: retailer || null,
      purchaseDate: purchaseDateRaw ? new Date(purchaseDateRaw) : new Date(),
      notes: notes || null,
      createdById: userId,
    },
  });

  revalidatePath("/inventory");
  revalidatePath("/");
  return { success: true };
}

export async function deleteProductAction(formData: FormData) {
  await requireUserId();
  const id = String(formData.get("id") || "");
  if (!id) return;
  await prisma.product.delete({ where: { id } });
  revalidatePath("/inventory");
}

export async function deletePurchaseAction(formData: FormData) {
  await requireUserId();
  const id = String(formData.get("id") || "");
  if (!id) return;
  await prisma.purchase.delete({ where: { id } });
  revalidatePath("/inventory");
  revalidatePath("/");
}
