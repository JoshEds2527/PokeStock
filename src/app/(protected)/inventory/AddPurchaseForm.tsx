"use client";

import { useActionState, useRef, useEffect } from "react";
import { addPurchaseAction } from "@/lib/actions/inventory";

export function AddPurchaseForm({ products }: { products: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState(addPurchaseAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state]);

  return (
    <form
      ref={formRef}
      action={action}
      className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3"
    >
      <h2 className="text-sm font-semibold text-slate-700">Log purchase (stock in)</h2>
      <select
        name="productId"
        required
        defaultValue=""
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
      >
        <option value="" disabled>
          Select product...
        </option>
        {products.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      <div className="grid grid-cols-2 gap-2">
        <input
          name="quantity"
          type="number"
          min="1"
          placeholder="Quantity"
          required
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          name="unitCost"
          type="number"
          step="0.01"
          min="0"
          placeholder="Unit cost £"
          required
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input
          name="retailer"
          placeholder="Retailer"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          name="purchaseDate"
          type="date"
          defaultValue={new Date().toISOString().slice(0, 10)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending || products.length === 0}
        className="w-full rounded-lg bg-indigo-600 text-white text-sm font-medium py-2 disabled:opacity-60"
      >
        {products.length === 0
          ? "Add a product first"
          : pending
            ? "Logging..."
            : "Log purchase"}
      </button>
    </form>
  );
}
