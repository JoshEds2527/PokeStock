"use client";

import { useActionState, useRef, useEffect } from "react";
import { addProductAction } from "@/lib/actions/inventory";

const categories = [
  "BOOSTER_BOX",
  "ELITE_TRAINER_BOX",
  "BOOSTER_BUNDLE",
  "BOOSTER_PACK",
  "TIN",
  "SINGLE_CARD",
  "COLLECTION_BOX",
  "OTHER",
];

export function AddProductForm() {
  const [state, action, pending] = useActionState(addProductAction, undefined);
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
      <h2 className="text-sm font-semibold text-slate-700">Add product</h2>
      <input
        name="name"
        placeholder="e.g. Scarlet & Violet Booster Box"
        required
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
      <div className="grid grid-cols-2 gap-2">
        <select
          name="category"
          defaultValue="OTHER"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c.replace(/_/g, " ")}
            </option>
          ))}
        </select>
        <input
          name="msrp"
          type="number"
          step="0.01"
          min="0"
          placeholder="MSRP £"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <input
        name="setName"
        placeholder="Set (optional)"
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-slate-900 text-white text-sm font-medium py-2 disabled:opacity-60"
      >
        {pending ? "Adding..." : "Add product"}
      </button>
    </form>
  );
}
