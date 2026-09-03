"use client";

import { useActionState } from "react";
import { checkListingWatchAction, deleteListingWatchAction } from "@/lib/actions/listingwatch";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";

const dateFmt = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export type ListingWatchRow = {
  id: string;
  keyword: string;
  retailer: string;
  retailerLabel: string;
  lastCheckedAt: string | null; // ISO
};

export function ListingWatchTable({ rows }: { rows: ListingWatchRow[] }) {
  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-black/5 text-slate-600 text-xs uppercase">
          <tr>
            <th className="px-4 py-2 text-left">Keyword</th>
            <th className="px-4 py-2 text-left">Retailer</th>
            <th className="px-4 py-2 text-left">Last checked</th>
            <th className="px-4 py-2"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black/10">
          {rows.length === 0 && (
            <tr>
              <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                No listing watches yet. Add one above.
              </td>
            </tr>
          )}
          {rows.map((row) => (
            <ListingWatchRow key={row.id} row={row} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ListingWatchRow({ row }: { row: ListingWatchRow }) {
  const [state, action, pending] = useActionState(checkListingWatchAction, undefined);

  return (
    <tr>
      <td className="px-4 py-2 align-top">
        <div className="font-medium text-slate-800">{row.keyword}</div>
        {state?.error && <div className="text-xs text-red-500 mt-1">{state.error}</div>}
        {state?.isFirstCheck && (
          <div className="text-xs text-slate-400 mt-1">
            Baseline set ({state.baselineCount} existing match{state.baselineCount === 1 ? "" : "es"}) --
            you'll be emailed when something new shows up.
          </div>
        )}
        {state?.newUrls && state.newUrls.length > 0 && !state.isFirstCheck && (
          <ul className="mt-1 space-y-0.5">
            {state.newUrls.map((url) => (
              <li key={url}>
                <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-600 hover:underline">
                  New: {url}
                </a>
              </li>
            ))}
          </ul>
        )}
        {state?.newUrls && state.newUrls.length === 0 && !state.isFirstCheck && !state.error && (
          <div className="text-xs text-slate-400 mt-1">No new listings.</div>
        )}
      </td>
      <td className="px-4 py-2 align-top text-slate-600">{row.retailerLabel}</td>
      <td className="px-4 py-2 align-top text-slate-500">
        {row.lastCheckedAt ? dateFmt.format(new Date(row.lastCheckedAt)) : "Never"}
      </td>
      <td className="px-4 py-2 align-top text-right whitespace-nowrap">
        <form action={action} className="inline">
          <input type="hidden" name="id" value={row.id} />
          <button type="submit" disabled={pending} className="text-xs text-indigo-600 hover:text-indigo-800 mr-3 disabled:opacity-60">
            {pending ? "Checking..." : "Check now"}
          </button>
        </form>
        <form action={deleteListingWatchAction} className="inline">
          <input type="hidden" name="id" value={row.id} />
          <ConfirmSubmitButton
            confirmText={`Remove the watch for "${row.keyword}" on ${row.retailerLabel}?`}
            className="text-xs text-red-500 hover:text-red-700"
          >
            Delete
          </ConfirmSubmitButton>
        </form>
      </td>
    </tr>
  );
}
