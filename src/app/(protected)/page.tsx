import { getDashboardStats } from "@/lib/stats";
import { StatCard } from "@/components/StatCard";
import { FinanceChart } from "@/components/charts/FinanceChart";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

const gbp = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const stats = await getDashboardStats(session.accountId);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total spent" value={gbp.format(stats.totalSpent)} />
        <StatCard label="Net revenue" value={gbp.format(stats.netRevenue)} />
        <StatCard
          label="Profit"
          value={gbp.format(stats.profit)}
          tone={stats.profit >= 0 ? "positive" : "negative"}
        />
        <StatCard label="Units in stock" value={String(stats.totalUnitsInStock)} />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4">
        <h2 className="text-sm font-semibold text-slate-700 mb-2">
          Spend vs revenue over time
        </h2>
        <FinanceChart data={stats.series} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Recent purchases</h2>
          {stats.recentPurchases.length === 0 && (
            <p className="text-sm text-slate-400">No purchases logged yet.</p>
          )}
          <ul className="space-y-2">
            {stats.recentPurchases.map((p) => (
              <li key={p.id} className="flex justify-between text-sm">
                <span className="text-slate-700">
                  {p.quantity}x {p.product.name}
                </span>
                <span className="text-slate-500">
                  {gbp.format(p.quantity * p.unitCost)}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Recent sales</h2>
          {stats.recentSales.length === 0 && (
            <p className="text-sm text-slate-400">No sales logged yet.</p>
          )}
          <ul className="space-y-2">
            {stats.recentSales.map((s) => (
              <li key={s.id} className="flex justify-between text-sm">
                <span className="text-slate-700">
                  {s.quantity}x {s.product.name}
                </span>
                <span className="text-slate-500">
                  {gbp.format(s.quantity * s.unitSalePrice - s.fees - s.shippingCost)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
