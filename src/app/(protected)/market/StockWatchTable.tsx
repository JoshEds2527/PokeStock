"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { deleteStockWatchAction, updateStockWatchAction } from "@/lib/actions/stockwatch";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";
import { Modal } from "@/components/Modal";

const dateFmt = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export type StockWatchRow = {
  id: string;
  productId: string | null;
  productName: string | null;
  retailerName: string;
  url: string;
  status: string;
  lastCheckedAt: string | null; // ISO
  checkIntervalMinutes: number;
  active: boolean;
};

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    IN_STOCK: "bg-emerald-100 text-emerald-700",
    OUT_OF_STOCK: "bg-red-100 text-red-700",
    UNKNOWN: "bg-slate-100 text-slate-500",
  };
  const labels: Record<string, string> = {
    IN_STOCK: "In stock",
    OUT_OF_STOCK: "Out of stock",
    UNKNOWN: "Unknown",
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles[status] ?? styles.UNKNOWN}`}>
      {labels[status] ?? "Unknown"}
    </span>
  );
}

export function StockWatchTable({
  rows,
  products,
}: {
  rows: StockWatchRow[];
  products: { id: string; name: string }[];
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const editingRow = rows.find((r) => r.id === editingId) ?? null;

  return (
    <div className="space-y-3">
      <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-black/5 text-slate-600 text-xs uppercase">
            <tr>
              <th className="px-4 py-2 text-left">Retailer</th>
              <th className="px-4 py-2 text-left">Product</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Last checked</th>
              <th className="px-4 py-2 text-right">Every</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/10">
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                  No stock watches yet. Add one above.
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <tr key={row.id} className={row.active ? "" : "opacity-50"}>
                <td className="px-4 py-2">
                  <a
                    href={row.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-indigo-600 hover:underline"
                  >
                    {row.retailerName}
                  </a>
                  {!row.active && <div className="text-xs text-slate-400">Paused</div>}
                </td>
                <td className="px-4 py-2 text-slate-600">{row.productName ?? "—"}</td>
                <td className="px-4 py-2">
                  <StatusBadge status={row.status} />
                </td>
                <td className="px-4 py-2 text-slate-500">
                  {row.lastCheckedAt ? dateFmt.format(new Date(row.lastCheckedAt)) : "Never"}
                </td>
                <td className="px-4 py-2 text-right text-slate-500">{row.checkIntervalMinutes}m</td>
                <td className="px-4 py-2 text-right whitespace-nowrap">
                  <button
                    onClick={() => setEditingId(row.id)}
                    className="text-xs text-indigo-600 hover:text-indigo-800 mr-3"
                  >
                    Edit
                  </button>
                  <form action={deleteStockWatchAction} className="inline">
                    <input type="hidden" name="id" value={row.id} />
                    <ConfirmSubmitButton
                      confirmText={`Remove the watch on "${row.retailerName}"? This cannot be undone.`}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Delete
                    </ConfirmSubmitButton>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={!!editingRow} onClose={() => setEditingId(null)} title="Edit stock watch">
        {editingRow && (
          <EditStockWatchForm row={editingRow} products={products} onDone={() => setEditingId(null)} />
        )}
      </Modal>
    </div>
  );
}

function EditStockWatchForm({
  row,
  products,
  onDone,
}: {
  row: StockWatchRow;
  products: { id: string; name: string }[];
  onDone: () => void;
}) {
  const [state, action, pending] = useActionState(updateStockWatchAction, undefined);
  const doneRef = useRef(false);

  useEffect(() => {
    if (state?.success && !doneRef.current) {
      doneRef.current = true;
      onDone();
    }
  }, [state, onDone]);

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="id" value={row.id} />
      <label className="block text-sm">
        <span className="block text-xs font-medium text-slate-500 mb-1">Linked product</span>
        <select
          name="productId"
          defaultValue={row.productId ?? ""}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">No linked product</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
      <div className="grid grid-cols-2 gap-2">
        <label className="block text-sm">
          <span className="block text-xs font-medium text-slate-500 mb-1">Retailer</span>
          <input
            name="retailerName"
            defaultValue={row.retailerName}
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="block text-xs font-medium text-slate-500 mb-1">Check every (mins)</span>
          <input
            name="checkIntervalMinutes"
            type="number"
            min="5"
            step="1"
            defaultValue={row.checkIntervalMinutes}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
      </div>
      <label className="block text-sm">
        <span className="block text-xs font-medium text-slate-500 mb-1">Product page URL</span>
        <input
          name="url"
          type="url"
          defaultValue={row.url}
          required
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </label>
      <label className="flex items-center gap-2 text-sm text-slate-600">
        <input type="checkbox" name="active" defaultChecked={row.active} className="rounded" />
        Active
      </label>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-indigo-600 text-white text-sm font-medium py-2 disabled:opacity-60"
      >
        {pending ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}
