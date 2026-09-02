import { prisma } from "@/lib/db";
import { AddProductForm } from "./AddProductForm";
import { AddPurchaseForm } from "./AddPurchaseForm";
import { deleteProductAction } from "@/lib/actions/inventory";

const gbp = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });

export default async function InventoryPage() {
  const products = await prisma.product.findMany({
    include: { purchases: true, sales: true },
    orderBy: { createdAt: "desc" },
  });

  const rows = products.map((product) => {
    const purchasedQty = product.purchases.reduce((sum, p) => sum + p.quantity, 0);
    const soldQty = product.sales.reduce((sum, s) => sum + s.quantity, 0);
    const totalCost = product.purchases.reduce((sum, p) => sum + p.quantity * p.unitCost, 0);
    const avgCost = purchasedQty > 0 ? totalCost / purchasedQty : 0;
    return {
      ...product,
      stock: purchasedQty - soldQty,
      avgCost,
    };
  });

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-slate-900">Inventory</h1>

      <div className="grid md:grid-cols-2 gap-4">
        <AddProductForm />
        <AddPurchaseForm products={products.map((p) => ({ id: p.id, name: p.name }))} />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-2">Product</th>
              <th className="text-right px-4 py-2">In stock</th>
              <th className="text-right px-4 py-2">Avg cost</th>
              <th className="text-right px-4 py-2">MSRP</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  No products yet. Add one above.
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-2">
                  <div className="font-medium text-slate-800">{row.name}</div>
                  <div className="text-xs text-slate-400">
                    {row.setName ?? row.category.replace(/_/g, " ")}
                  </div>
                </td>
                <td className="px-4 py-2 text-right">{row.stock}</td>
                <td className="px-4 py-2 text-right">{gbp.format(row.avgCost)}</td>
                <td className="px-4 py-2 text-right">
                  {row.msrp != null ? gbp.format(row.msrp) : "—"}
                </td>
                <td className="px-4 py-2 text-right">
                  <form action={deleteProductAction}>
                    <input type="hidden" name="id" value={row.id} />
                    <button className="text-xs text-red-500 hover:text-red-700">
                      Delete
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
