import { prisma } from "@/lib/db";
import { AddSaleForm } from "./AddSaleForm";
import { SalesTable, type SaleRow } from "./SalesTable";

export default async function SalesPage() {
  const [products, sales] = await Promise.all([
    prisma.product.findMany({ orderBy: { name: "asc" } }),
    prisma.sale.findMany({
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
      <h1 className="text-xl font-bold text-slate-900">Sales</h1>

      <AddSaleForm products={products.map((p) => ({ id: p.id, name: p.name }))} />

      <SalesTable rows={rows} />
    </div>
  );
}
