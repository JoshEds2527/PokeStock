"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { ProductCategory } from "@prisma/client";

async function requireAccountId() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session.accountId;
}

export type ActionResult = { error?: string; success?: boolean };

export async function addProductAction(
  _prevState: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const accountId = await requireAccountId();

  const name = String(formData.get("name") || "").trim();
  const setName = String(formData.get("setName") || "").trim();
  const category = String(formData.get("category") || "OTHER") as ProductCategory;
  const msrpRaw = String(formData.get("msrp") || "").trim();

  if (!name) return { error: "Product name is required." };

  await prisma.product.create({
    data: {
      accountId,
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
  const accountId = await requireAccountId();

  const productId = String(formData.get("productId") || "");
  const quantity = Number(formData.get("quantity") || 0);
  const unitCost = Number(formData.get("unitCost") || 0);
  const retailer = String(formData.get("retailer") || "").trim();
  const purchaseDateRaw = String(formData.get("purchaseDate") || "");
  const notes = String(formData.get("notes") || "").trim();

  if (!productId) return { error: "Choose a product." };
  if (!quantity || quantity <= 0) return { error: "Quantity must be greater than 0." };
  if (unitCost < 0 || Number.isNaN(unitCost)) return { error: "Enter a valid unit cost." };

  const product = await prisma.product.findFirst({ where: { id: productId, accountId } });
  if (!product) return { error: "Product not found." };

  await prisma.purchase.create({
    data: {
      accountId,
      productId,
      quantity,
      unitCost,
      retailer: retailer || null,
      purchaseDate: purchaseDateRaw ? new Date(purchaseDateRaw) : new Date(),
      notes: notes || null,
    },
  });

  revalidatePath("/inventory");
  revalidatePath("/");
  return { success: true };
}

export async function updateProductAction(
  _prevState: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const accountId = await requireAccountId();

  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim();
  const setName = String(formData.get("setName") || "").trim();
  const category = String(formData.get("category") || "OTHER") as ProductCategory;
  const msrpRaw = String(formData.get("msrp") || "").trim();

  if (!id) return { error: "Missing product." };
  if (!name) return { error: "Product name is required." };

  const result = await prisma.product.updateMany({
    where: { id, accountId },
    data: {
      name,
      setName: setName || null,
      category,
      msrp: msrpRaw ? Number(msrpRaw) : null,
    },
  });
  if (result.count === 0) return { error: "Product not found." };

  revalidatePath("/inventory");
  revalidatePath("/");
  return { success: true };
}

export async function updatePurchaseAction(
  _prevState: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const accountId = await requireAccountId();

  const id = String(formData.get("id") || "");
  const quantity = Number(formData.get("quantity") || 0);
  const unitCost = Number(formData.get("unitCost") || 0);
  const retailer = String(formData.get("retailer") || "").trim();
  const purchaseDateRaw = String(formData.get("purchaseDate") || "");
  const notes = String(formData.get("notes") || "").trim();

  if (!id) return { error: "Missing purchase." };
  if (!quantity || quantity <= 0) return { error: "Quantity must be greater than 0." };
  if (unitCost < 0 || Number.isNaN(unitCost)) return { error: "Enter a valid unit cost." };

  const result = await prisma.purchase.updateMany({
    where: { id, accountId },
    data: {
      quantity,
      unitCost,
      retailer: retailer || null,
      purchaseDate: purchaseDateRaw ? new Date(purchaseDateRaw) : new Date(),
      notes: notes || null,
    },
  });
  if (result.count === 0) return { error: "Purchase not found." };

  revalidatePath("/inventory");
  revalidatePath("/");
  return { success: true };
}

export async function deleteProductAction(formData: FormData) {
  const accountId = await requireAccountId();
  const id = String(formData.get("id") || "");
  if (!id) return;
  await prisma.product.deleteMany({ where: { id, accountId } });
  revalidatePath("/inventory");
}

export async function deletePurchaseAction(formData: FormData) {
  const accountId = await requireAccountId();
  const id = String(formData.get("id") || "");
  if (!id) return;
  await prisma.purchase.deleteMany({ where: { id, accountId } });
  revalidatePath("/inventory");
  revalidatePath("/");
}
