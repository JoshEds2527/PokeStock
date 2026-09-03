"use client";

import { useActionState, useRef, useEffect } from "react";
import { addSaleAction } from "@/lib/actions/sales";

const platforms = ["EBAY", "VINTED", "FACEBOOK", "DEPOP", "IN_PERSON", "OTHER"];

export function AddSaleForm({ products }: { products: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState(addSaleAction, undefined);
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
      <h2 className="text-sm font-semibold text-slate-700">Log sale</h2>
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
          name="unitSalePrice"
          type="number"
          step="0.01"
          min="0"
          placeholder="Sale price £ (each)"
          required
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <select
          name="platform"
          defaultValue="EBAY"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          {platforms.map((p) => (
            <option key={p} value={p}>
              {p.replace(/_/g, " ")}
            </option>
          ))}
        </select>
        <input
          name="fees"
          type="number"
          step="0.01"
          min="0"
          placeholder="Fees £"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          name="shippingCost"
          type="number"
          step="0.01"
          min="0"
          placeholder="Postage £"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <input
        name="saleDate"
        type="date"
        defaultValue={new Date().toISOString().slice(0, 10)}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending || products.length === 0}
        className="w-full rounded-lg bg-indigo-600 text-white text-sm font-medium py-2 disabled:opacity-60"
      >
        {products.length === 0
          ? "Add a product in Inventory first"
          : pending
            ? "Logging..."
            : "Log sale"}
      </button>
    </form>
  );
}
