"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { isEbayConfigured, searchActiveListings, type EbayListing } from "@/lib/ebay";

async function requireAccountId() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session.accountId;
}

export type FetchEbayPricesResult = {
  error?: string;
  listings?: EbayListing[];
};

export async function fetchEbayPricesAction(
  _prevState: FetchEbayPricesResult | undefined,
  formData: FormData
): Promise<FetchEbayPricesResult> {
  const accountId = await requireAccountId();
  const productId = String(formData.get("productId") || "");

  if (!isEbayConfigured()) {
    return { error: "eBay isn't connected yet -- add EBAY_CLIENT_ID and EBAY_CLIENT_SECRET first." };
  }

  const product = await prisma.product.findFirst({ where: { id: productId, accountId } });
  if (!product) return { error: "Product not found." };

  let listings: EbayListing[];
  try {
    listings = await searchActiveListings(product.name);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "eBay lookup failed." };
  }

  if (listings.length > 0) {
    await prisma.marketListing.createMany({
      data: listings.map((listing) => ({
        accountId,
        productId,
        source: "EBAY" as const,
        title: listing.title,
        price: listing.price,
        url: listing.url,
        sold: false,
      })),
    });
    revalidatePath("/market");
  }

  return { listings };
}
