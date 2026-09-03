import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function MarketPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const products = await prisma.product.findMany({
    where: { accountId: session.accountId },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-white drop-shadow">Market data</h1>

      <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 p-4 space-y-2">
        <p className="text-sm text-slate-600">
          Live eBay UK sold-listing prices and automated stock-alert monitoring are planned
          for phase 2. For now, here are quick manual lookup links for your products.
        </p>
      </div>

      <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 divide-y divide-black/10">
        {products.length === 0 && (
          <p className="px-4 py-6 text-center text-sm text-slate-400">
            Add products in Inventory to get quick lookup links here.
          </p>
        )}
        {products.map((p) => {
          const q = encodeURIComponent(p.name);
          return (
            <div key={p.id} className="px-4 py-3 flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-slate-800">{p.name}</span>
              <div className="flex gap-3 text-sm">
                <a
                  className="text-indigo-600 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                  href={`https://www.ebay.co.uk/sch/i.html?_nkw=${q}&LH_Sold=1&LH_Complete=1`}
                >
                  eBay sold
                </a>
                <a
                  className="text-indigo-600 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                  href={`https://www.vinted.co.uk/catalog?search_text=${q}`}
                >
                  Vinted
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
