"use client";

import { useActionState, useRef, useEffect } from "react";
import { addReleaseAction } from "@/lib/actions/releases";

export function AddReleaseForm() {
  const [state, action, pending] = useActionState(addReleaseAction, undefined);
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
      <h2 className="text-sm font-semibold text-slate-700">Add upcoming release</h2>
      <input
        name="productName"
        placeholder="Product name"
        required
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          name="retailer"
          placeholder="Retailer (e.g. Smyths)"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          name="releaseDate"
          type="date"
          required
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <input
        name="url"
        type="url"
        placeholder="https:// link (optional)"
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
      <input
        name="notes"
        placeholder="Notes (optional)"
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-slate-900 text-white text-sm font-medium py-2 disabled:opacity-60"
      >
        {pending ? "Adding..." : "Add release"}
      </button>
    </form>
  );
}
