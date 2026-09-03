import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { toCsv, csvResponse } from "@/lib/csv";

export async function GET() {
  const session = await getSession();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const sales = await prisma.sale.findMany({
    where: { accountId: session.accountId },
    include: { product: true },
    orderBy: { saleDate: "desc" },
  });

  const rows = sales.map((s) => {
    const gross = s.quantity * s.unitSalePrice;
    const net = gross - s.fees - s.shippingCost;
    return [
      s.saleDate.toISOString().slice(0, 10),
      s.product.name,
      s.quantity,
      s.unitSalePrice.toFixed(2),
      s.platform,
      s.fees.toFixed(2),
      s.shippingCost.toFixed(2),
      net.toFixed(2),
      s.notes ?? "",
    ];
  });

  const csv = toCsv(
    ["Date", "Product", "Quantity", "Unit sale price", "Platform", "Fees", "Shipping", "Net", "Notes"],
    rows
  );

  return csvResponse(`pokestock-sales-${new Date().toISOString().slice(0, 10)}.csv`, csv);
}
