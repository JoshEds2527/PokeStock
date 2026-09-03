"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useActionState } from "react";
import { deletePurchaseAction, updatePurchaseAction } from "@/lib/actions/inventory";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";
import { Modal } from "@/components/Modal";

const gbp = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });
const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short" });

export type PurchaseRow = {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitCost: number;
  retailer: string | null;
  purchaseDate: string; // ISO
};

type SortKey = "purchaseDate" | "productName" | "total";

export function PurchaseHistoryTable({ rows }: { rows: PurchaseRow[] }) {
  const [productFilter, setProductFilter] = useState("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("purchaseDate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [editingId, setEditingId] = useState<string | null>(null);

  const productOptions = useMemo(() => {
    const names = new Set(rows.map((r) => r.productName));
    return [...names].sort();
  }, [rows]);

  const filtered = useMemo(() => {
    let result = rows;
    if (productFilter !== "ALL") {
      result = result.filter((r) => r.productName === productFilter);
    }
    const sorted = [...result].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "purchaseDate") {
        cmp = new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime();
      } else if (sortKey === "productName") {
        cmp = a.productName.localeCompare(b.productName);
      } else {
        cmp = a.quantity * a.unitCost - b.quantity * b.unitCost;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [rows, productFilter, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const editingRow = rows.find((r) => r.id === editingId) ?? null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white drop-shadow">Purchase history</h2>
        <div className="flex items-center gap-2">
          <a
            href="/api/export/purchases"
            className="text-xs rounded-lg border border-white/40 bg-white/70 px-2 py-1 text-slate-600 hover:bg-white"
          >
            Export CSV
          </a>
          <select
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value)}
            className="text-xs rounded-lg border border-slate-300 px-2 py-1"
          >
            <option value="ALL">All products</option>
            {productOptions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-black/5 text-slate-600 text-xs uppercase">
            <tr>
              <SortHeader label="Date" sortKey="purchaseDate" activeKey={sortKey} dir={sortDir} onClick={toggleSort} align="left" />
              <SortHeader label="Product" sortKey="productName" activeKey={sortKey} dir={sortDir} onClick={toggleSort} align="left" />
              <th className="px-4 py-2 text-right">Qty</th>
              <th className="px-4 py-2 text-right">Unit cost</th>
              <SortHeader label="Total" sortKey="total" activeKey={sortKey} dir={sortDir} onClick={toggleSort} />
              <th className="px-4 py-2 text-left">Retailer</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/10">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                  {rows.length === 0 ? "No purchases logged yet." : "No purchases match."}
                </td>
              </tr>
            )}
            {filtered.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-2 text-slate-500 whitespace-nowrap">
                  {dateFmt.format(new Date(row.purchaseDate))}
                </td>
                <td className="px-4 py-2">{row.productName}</td>
                <td className="px-4 py-2 text-right">{row.quantity}</td>
                <td className="px-4 py-2 text-right">{gbp.format(row.unitCost)}</td>
                <td className="px-4 py-2 text-right font-medium">
                  {gbp.format(row.quantity * row.unitCost)}
                </td>
                <td className="px-4 py-2 text-slate-500">{row.retailer ?? "—"}</td>
                <td className="px-4 py-2 text-right whitespace-nowrap">
                  <button
                    onClick={() => setEditingId(row.id)}
                    className="text-xs text-indigo-600 hover:text-indigo-800 mr-3"
                  >
                    Edit
                  </button>
                  <form action={deletePurchaseAction} className="inline">
                    <input type="hidden" name="id" value={row.id} />
                    <ConfirmSubmitButton
                      confirmText={`Delete this purchase of ${row.quantity}x ${row.productName}? This cannot be undone.`}
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

      <Modal open={!!editingRow} onClose={() => setEditingId(null)} title="Edit purchase">
        {editingRow && (
          <EditPurchaseForm row={editingRow} onDone={() => setEditingId(null)} />
        )}
      </Modal>
    </div>
  );
}

function SortHeader({
  label,
  sortKey,
  activeKey,
  dir,
  onClick,
  align = "right",
}: {
  label: string;
  sortKey: SortKey;
  activeKey: SortKey;
  dir: "asc" | "desc";
  onClick: (key: SortKey) => void;
  align?: "left" | "right";
}) {
  const active = activeKey === sortKey;
  return (
    <th
      onClick={() => onClick(sortKey)}
      className={`px-4 py-2 cursor-pointer select-none hover:text-slate-700 whitespace-nowrap ${
        align === "left" ? "text-left" : "text-right"
      }`}
    >
      {label}
      {active && <span className="ml-1">{dir === "asc" ? "↑" : "↓"}</span>}
    </th>
  );
}

function EditPurchaseForm({ row, onDone }: { row: PurchaseRow; onDone: () => void }) {
  const [state, action, pending] = useActionState(updatePurchaseAction, undefined);
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
      <p className="text-sm text-slate-500">{row.productName}</p>
      <div className="grid grid-cols-2 gap-2">
        <input
          name="quantity"
          type="number"
          min="1"
          defaultValue={row.quantity}
          required
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          name="unitCost"
          type="number"
          step="0.01"
          min="0"
          defaultValue={row.unitCost}
          required
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input
          name="retailer"
          defaultValue={row.retailer ?? ""}
          placeholder="Retailer"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          name="purchaseDate"
          type="date"
          defaultValue={row.purchaseDate.slice(0, 10)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
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
