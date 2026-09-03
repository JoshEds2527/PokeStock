import { prisma } from "@/lib/db";
import { AddSaleForm } from "./AddSaleForm";
import { SalesTable, type SaleRow } from "./SalesTable";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function SalesPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const accountId = session.accountId;

  const [products, sales] = await Promise.all([
    prisma.product.findMany({ where: { accountId }, orderBy: { name: "asc" } }),
    prisma.sale.findMany({
      where: { accountId },
      include: { product: true },
      orderBy: { saleDate: "desc" },
      take: 300,
    }),
  ]);

  const rows: SaleRow[] = sales.map((s) => ({
    id: s.id,
    productId: s.productId,
    productName: s.product.name,
    quantity: s.quantity,
    unitSalePrice: s.unitSalePrice,
    platform: s.platform,
    fees: s.fees,
    shippingCost: s.shippingCost,
    saleDate: s.saleDate.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-white drop-shadow">Sales</h1>

      <AddSaleForm products={products.map((p) => ({ id: p.id, name: p.name }))} />

      <SalesTable rows={rows} />
    </div>
  );
}
