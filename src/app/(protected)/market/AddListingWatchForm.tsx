"use client";

import { useActionState, useRef, useEffect } from "react";
import { addListingWatchAction } from "@/lib/actions/listingwatch";

export function AddListingWatchForm({ retailers }: { retailers: { id: string; label: string }[] }) {
  const [state, action, pending] = useActionState(addListingWatchAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state]);

  return (
    <form
      ref={formRef}
      action={action}
      className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 p-4 space-y-3"
    >
      <h2 className="text-sm font-semibold text-slate-700">Watch for a new listing</h2>
      <div className="grid grid-cols-2 gap-2">
        <input
          name="keyword"
          placeholder="Keyword (e.g. Destined Rivals ETB)"
          required
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <select
          name="retailer"
          required
          defaultValue=""
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="" disabled>
            Select retailer...
          </option>
          {retailers.map((r) => (
            <option key={r.id} value={r.id}>
              {r.label}
            </option>
          ))}
        </select>
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-indigo-600 text-white text-sm font-medium py-2 disabled:opacity-60"
      >
        {pending ? "Adding..." : "Add watch"}
      </button>
      <p className="text-xs text-slate-400">
        Checks the retailer's product sitemap for pages matching this keyword. The first check
        just records what's already there; you'll only get emailed when something genuinely new
        shows up after that.
      </p>
    </form>
  );
}
