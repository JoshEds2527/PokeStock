"use client";

import { useActionState } from "react";
import { fetchEbayPricesAction } from "@/lib/actions/market";

const gbp = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });

export function EbayPriceLookup({ productId }: { productId: string }) {
  const [state, action, pending] = useActionState(fetchEbayPricesAction, undefined);

  return (
    <div className="text-sm">
      <form action={action}>
        <input type="hidden" name="productId" value={productId} />
        <button type="submit" disabled={pending} className="text-indigo-600 hover:underline disabled:opacity-60">
          {pending ? "Fetching..." : "Fetch eBay prices"}
        </button>
      </form>

      {state?.error && <p className="text-xs text-slate-400 mt-1">{state.error}</p>}

      {state?.listings && (
        <ul className="mt-2 space-y-1">
          {state.listings.length === 0 && (
            <li className="text-xs text-slate-400">No active listings found.</li>
          )}
          {state.listings.slice(0, 5).map((listing, i) => (
            <li key={i} className="text-xs">
              <a href={listing.url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                {gbp.format(listing.price)}
              </a>{" "}
              <span className="text-slate-900">
                {listing.title.length > 50 ? `${listing.title.slice(0, 50)}...` : listing.title}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
