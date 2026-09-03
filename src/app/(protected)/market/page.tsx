import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AddStockWatchForm } from "./AddStockWatchForm";
import { StockWatchTable, type StockWatchRow } from "./StockWatchTable";
import { EbayPriceLookup } from "./EbayPriceLookup";
import { isEbayConfigured } from "@/lib/ebay";
import { listRetailers } from "@/lib/retailers";
import { AddListingWatchForm } from "./AddListingWatchForm";
import { ListingWatchTable, type ListingWatchRow } from "./ListingWatchTable";

export default async function MarketPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [products, stockWatches, listingWatches] = await Promise.all([
    prisma.product.findMany({
      where: { accountId: session.accountId },
      orderBy: { name: "asc" },
    }),
    prisma.stockWatch.findMany({
      where: { accountId: session.accountId },
      include: { product: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.listingWatch.findMany({
      where: { accountId: session.accountId },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const stockWatchRows: StockWatchRow[] = stockWatches.map((w) => ({
    id: w.id,
    productId: w.productId,
    productName: w.product?.name ?? null,
    retailerName: w.retailerName,
    url: w.url,
    status: w.status,
    lastCheckedAt: w.lastCheckedAt ? w.lastCheckedAt.toISOString() : null,
    checkIntervalMinutes: w.checkIntervalMinutes,
    active: w.active,
  }));

  const retailers = listRetailers();
  const retailerLabels = Object.fromEntries(retailers.map((r) => [r.id, r.label]));
  const listingWatchRows: ListingWatchRow[] = listingWatches.map((w) => ({
    id: w.id,
    keyword: w.keyword,
    retailer: w.retailer,
    retailerLabel: retailerLabels[w.retailer] ?? w.retailer,
    lastCheckedAt: w.lastCheckedAt ? w.lastCheckedAt.toISOString() : null,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-white drop-shadow">Market data</h1>

      <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 p-4 space-y-2">
        <p className="text-sm text-slate-600">
          {isEbayConfigured()
            ? "Live eBay active-listing prices are connected. Sold-listing history still needs separate eBay approval (see README) -- for now, use the manual \"eBay sold\" link for sold prices."
            : "Live eBay pricing is connected in code but not switched on yet -- add EBAY_CLIENT_ID and EBAY_CLIENT_SECRET once the developer account is approved. Manual lookup links work in the meantime."}
        </p>
      </div>

      <p className="text-xs text-white">
        Argos and Smyths have official back-in-stock notify forms -- those links take you
        there. Very and Pokémon Center are a manual search fallback.
      </p>

      <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 divide-y divide-black/10">
        {products.length === 0 && (
          <p className="px-4 py-6 text-center text-sm text-slate-400">
            Add products in Inventory to get quick lookup links here.
          </p>
        )}
        {products.map((p) => {
          const q = encodeURIComponent(p.name);
          const slug = encodeURIComponent(
            p.name
              .trim()
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/(^-|-$)/g, "")
          );
          const links = [
            { label: "eBay sold", href: `https://www.ebay.co.uk/sch/i.html?_nkw=${q}&LH_Sold=1&LH_Complete=1` },
            { label: "Vinted", href: `https://www.vinted.co.uk/catalog?search_text=${q}` },
            {
              label: "Argos",
              href: `https://www.argos.co.uk/search/${slug}/`,
              title: "Find the product, then use Argos's own 'email me when back in stock' button",
            },
            {
              label: "Smyths",
              href: `https://www.smythstoys.com/uk/en-gb/search?text=${q}`,
              title: "Find the product, then use Smyths's own stock-availability notify form",
            },
            { label: "Very", href: `https://www.very.co.uk/search/${slug}` },
            {
              label: "Pokémon Center",
              href: "https://www.pokemoncenter.com/en-gb",
              title: "No confirmed direct search link -- opens the UK storefront to search from",
            },
          ];
          return (
            <div key={p.id} className="px-4 py-3 space-y-2">
              <span className="text-sm font-medium text-slate-800">{p.name}</span>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                {links.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={link.title}
                    className="text-center text-xs font-medium rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
              <EbayPriceLookup productId={p.id} />
            </div>
          );
        })}
      </div>

      <div className="space-y-3">
        <div>
          <h2 className="text-lg font-bold text-white drop-shadow">Stock watches</h2>
          <p className="text-sm text-white">
            Track a retailer's product page here. Automatic checking and back-in-stock alerts
            are coming in a later step — for now this just keeps a list, and you can jump
            straight to the page with the retailer link.
          </p>
        </div>
        <AddStockWatchForm products={products.map((p) => ({ id: p.id, name: p.name }))} />
        <StockWatchTable
          rows={stockWatchRows}
          products={products.map((p) => ({ id: p.id, name: p.name }))}
        />
      </div>

      <div className="space-y-3">
        <div>
          <h2 className="text-lg font-bold text-white drop-shadow">New listing alerts</h2>
          <p className="text-sm text-white">
            Watches a retailer's product sitemap for pages matching a keyword -- catches a
            product going live before it's even purchasable, without needing to get past any
            bot protection. Only works on retailers whose sitemap is publicly accessible:{" "}
            {retailers.map((r) => r.label).join(", ")}. Argos, Very, Smyths, and Pokémon Center
            block this the same way they block everything else, so they aren't offered here.
          </p>
        </div>
        <AddListingWatchForm retailers={retailers} />
        <ListingWatchTable rows={listingWatchRows} />
      </div>
    </div>
  );
}
