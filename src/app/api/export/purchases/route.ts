import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { toCsv, csvResponse } from "@/lib/csv";

export async function GET() {
  const session = await getSession();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const purchases = await prisma.purchase.findMany({
    where: { accountId: session.accountId },
    include: { product: true },
    orderBy: { purchaseDate: "desc" },
  });

  const rows = purchases.map((p) => [
    p.purchaseDate.toISOString().slice(0, 10),
    p.product.name,
    p.quantity,
    p.unitCost.toFixed(2),
    (p.quantity * p.unitCost).toFixed(2),
    p.retailer ?? "",
    p.notes ?? "",
  ]);

  const csv = toCsv(
    ["Date", "Product", "Quantity", "Unit cost", "Total", "Retailer", "Notes"],
    rows
  );

  return csvResponse(`pokestock-purchases-${new Date().toISOString().slice(0, 10)}.csv`, csv);
}
