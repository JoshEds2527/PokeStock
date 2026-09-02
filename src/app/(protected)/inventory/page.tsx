import { prisma } from "@/lib/db";
import { AddProductForm } from "./AddProductForm";
import { AddPurchaseForm } from "./AddPurchaseForm";
import { InventoryTable, type InventoryRow } from "./InventoryTable";
import { PurchaseHistoryTable, type PurchaseRow } from "./PurchaseHistoryTable";

export default async function InventoryPage() {
  const products = await prisma.product.findMany({
    include: { purchases: true, sales: true },
    orderBy: { createdAt: "desc" },
  });

  const rows: InventoryRow[] = products.map((product) => {
    const purchasedQty = product.purchases.reduce((sum, p) => sum + p.quantity, 0);
    const soldQty = product.sales.reduce((sum, s) => sum + s.quantity, 0);
    const totalSpent = product.purchases.reduce((sum, p) => sum + p.quantity * p.unitCost, 0);
    const avgCost = purchasedQty > 0 ? totalSpent / purchasedQty : 0;
    return {
      id: product.id,
      name: product.name,
      setName: product.setName,
      category: product.category,
      msrp: product.msrp,
      stock: purchasedQty - soldQty,
      avgCost,
      totalSpent,
    };
  });

  const purchaseRows: PurchaseRow[] = products
    .flatMap((product) =>
      product.purchases.map((p) => ({
        id: p.id,
        productId: product.id,
        productName: product.name,
        quantity: p.quantity,
        unitCost: p.unitCost,
        retailer: p.retailer,
        purchaseDate: p.purchaseDate.toISOString(),
      }))
    )
    .sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime());

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-slate-900">Inventory</h1>

      <div className="grid md:grid-cols-2 gap-4">
        <AddProductForm />
        <AddPurchaseForm products={products.map((p) => ({ id: p.id, name: p.name }))} />
      </div>

      <InventoryTable rows={rows} />

      <PurchaseHistoryTable rows={purchaseRows} />
    </div>
  );
}
