import { prisma } from "@/lib/db";
import { AddSaleForm } from "./AddSaleForm";
import { deleteSaleAction } from "@/lib/actions/sales";

const gbp = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });
const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short" });

export default async function SalesPage() {
  const [products, sales] = await Promise.all([
    prisma.product.findMany({ orderBy: { name: "asc" } }),
    prisma.sale.findMany({
      include: { product: true },
      orderBy: { saleDate: "desc" },
      take: 100,
    }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-slate-900">Sales</h1>

      <AddSaleForm products={products.map((p) => ({ id: p.id, name: p.name }))} />

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-2">Date</th>
              <th className="text-left px-4 py-2">Product</th>
              <th className="text-left px-4 py-2">Platform</th>
              <th className="text-right px-4 py-2">Net</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sales.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  No sales logged yet.
                </td>
              </tr>
            )}
            {sales.map((s) => (
              <tr key={s.id}>
                <td className="px-4 py-2 text-slate-500">{dateFmt.format(s.saleDate)}</td>
                <td className="px-4 py-2">
                  {s.quantity}x {s.product.name}
                </td>
                <td className="px-4 py-2 text-slate-500">{s.platform.replace(/_/g, " ")}</td>
                <td className="px-4 py-2 text-right font-medium">
                  {gbp.format(s.quantity * s.unitSalePrice - s.fees - s.shippingCost)}
                </td>
                <td className="px-4 py-2 text-right">
                  <form action={deleteSaleAction}>
                    <input type="hidden" name="id" value={s.id} />
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
