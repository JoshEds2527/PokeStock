"use client";

import { useActionState, useRef, useEffect } from "react";
import { addStockWatchAction } from "@/lib/actions/stockwatch";

export function AddStockWatchForm({ products }: { products: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState(addStockWatchAction, undefined);
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
      <h2 className="text-sm font-semibold text-slate-700">Add a stock watch</h2>
      <select
        name="productId"
        defaultValue=""
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
      >
        <option value="">No linked product (optional)</option>
        {products.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      <div className="grid grid-cols-2 gap-2">
        <input
          name="retailerName"
          placeholder="Retailer (e.g. Smyths)"
          required
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          name="checkIntervalMinutes"
          type="number"
          min="5"
          step="1"
          defaultValue={30}
          placeholder="Check every (mins)"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <input
        name="url"
        type="url"
        placeholder="Product page URL"
        required
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-indigo-600 text-white text-sm font-medium py-2 disabled:opacity-60"
      >
        {pending ? "Adding..." : "Add watch"}
      </button>
      <p className="text-xs text-slate-400">
        This just tracks the page for now — automatic checking is coming in a later step.
      </p>
    </form>
  );
}
