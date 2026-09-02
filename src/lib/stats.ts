import { prisma } from "@/lib/db";
import { format } from "date-fns";

export async function getDashboardStats() {
  const [purchases, sales] = await Promise.all([
    prisma.purchase.findMany({ include: { product: true } }),
    prisma.sale.findMany({ include: { product: true } }),
  ]);

  const totalSpent = purchases.reduce((sum, p) => sum + p.quantity * p.unitCost, 0);
  const grossRevenue = sales.reduce((sum, s) => sum + s.quantity * s.unitSalePrice, 0);
  const totalFees = sales.reduce((sum, s) => sum + s.fees + s.shippingCost, 0);
  const netRevenue = grossRevenue - totalFees;

  // Average cost per product, for cost-of-goods-sold estimation.
  const costByProduct = new Map<string, { totalQty: number; totalCost: number }>();
  for (const p of purchases) {
    const entry = costByProduct.get(p.productId) ?? { totalQty: 0, totalCost: 0 };
    entry.totalQty += p.quantity;
    entry.totalCost += p.quantity * p.unitCost;
    costByProduct.set(p.productId, entry);
  }

  let cogs = 0;
  for (const s of sales) {
    const entry = costByProduct.get(s.productId);
    const avgCost = entry && entry.totalQty > 0 ? entry.totalCost / entry.totalQty : 0;
    cogs += s.quantity * avgCost;
  }

  const profit = netRevenue - cogs;

  // Current stock per product = purchased - sold.
  const qtyByProduct = new Map<string, number>();
  for (const p of purchases) {
    qtyByProduct.set(p.productId, (qtyByProduct.get(p.productId) ?? 0) + p.quantity);
  }
  for (const s of sales) {
    qtyByProduct.set(s.productId, (qtyByProduct.get(s.productId) ?? 0) - s.quantity);
  }
  const totalUnitsInStock = [...qtyByProduct.values()].reduce(
    (sum, qty) => sum + Math.max(qty, 0),
    0
  );

  // Monthly series for the chart: cumulative spend vs cumulative revenue.
  type MonthBucket = { spend: number; revenue: number };
  const buckets = new Map<string, MonthBucket>();

  for (const p of purchases) {
    const key = format(p.purchaseDate, "yyyy-MM");
    const b = buckets.get(key) ?? { spend: 0, revenue: 0 };
    b.spend += p.quantity * p.unitCost;
    buckets.set(key, b);
  }
  for (const s of sales) {
    const key = format(s.saleDate, "yyyy-MM");
    const b = buckets.get(key) ?? { spend: 0, revenue: 0 };
    b.revenue += s.quantity * s.unitSalePrice - s.fees - s.shippingCost;
    buckets.set(key, b);
  }

  const sortedKeys = [...buckets.keys()].sort();
  let cumSpend = 0;
  let cumRevenue = 0;
  const series = sortedKeys.map((key) => {
    const b = buckets.get(key)!;
    cumSpend += b.spend;
    cumRevenue += b.revenue;
    return {
      month: key,
      spend: Math.round(b.spend * 100) / 100,
      revenue: Math.round(b.revenue * 100) / 100,
      cumulativeSpend: Math.round(cumSpend * 100) / 100,
      cumulativeRevenue: Math.round(cumRevenue * 100) / 100,
      cumulativeProfit: Math.round((cumRevenue - cumSpend) * 100) / 100,
    };
  });

  return {
    totalSpent: round2(totalSpent),
    grossRevenue: round2(grossRevenue),
    netRevenue: round2(netRevenue),
    totalFees: round2(totalFees),
    profit: round2(profit),
    totalUnitsInStock,
    series,
    recentSales: sales
      .sort((a, b) => b.saleDate.getTime() - a.saleDate.getTime())
      .slice(0, 5),
    recentPurchases: purchases
      .sort((a, b) => b.purchaseDate.getTime() - a.purchaseDate.getTime())
      .slice(0, 5),
  };
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
