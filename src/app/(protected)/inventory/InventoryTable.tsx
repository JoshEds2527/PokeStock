"use client";

import { useMemo, useState } from "react";
import { useActionState, useEffect, useRef } from "react";
import { deleteProductAction, updateProductAction } from "@/lib/actions/inventory";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";
import { Modal } from "@/components/Modal";

const gbp = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });

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

export type InventoryRow = {
  id: string;
  name: string;
  setName: string | null;
  category: string;
  msrp: number | null;
  stock: number;
  avgCost: number;
  totalSpent: number;
};

type SortKey = "name" | "stock" | "avgCost" | "totalSpent" | "msrp";

export function InventoryTable({ rows }: { rows: InventoryRow[] }) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [editingId, setEditingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = rows;
    if (categoryFilter !== "ALL") {
      result = result.filter((r) => r.category === categoryFilter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (r) =>
          r.name.toLowerCase().includes(q) || (r.setName ?? "").toLowerCase().includes(q)
      );
    }
    const sorted = [...result].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name") cmp = a.name.localeCompare(b.name);
      else cmp = (a[sortKey] ?? 0) - (b[sortKey] ?? 0);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [rows, search, categoryFilter, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const editingRow = rows.find((r) => r.id === editingId) ?? null;

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products or set..."
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="ALL">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <SortHeader label="Product" sortKey="name" activeKey={sortKey} dir={sortDir} onClick={toggleSort} align="left" />
              <SortHeader label="In stock" sortKey="stock" activeKey={sortKey} dir={sortDir} onClick={toggleSort} />
              <SortHeader label="Avg cost" sortKey="avgCost" activeKey={sortKey} dir={sortDir} onClick={toggleSort} />
              <SortHeader label="Total spent" sortKey="totalSpent" activeKey={sortKey} dir={sortDir} onClick={toggleSort} />
              <SortHeader label="MSRP" sortKey="msrp" activeKey={sortKey} dir={sortDir} onClick={toggleSort} />
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                  {rows.length === 0 ? "No products yet. Add one above." : "No products match."}
                </td>
              </tr>
            )}
            {filtered.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-2">
                  <div className="font-medium text-slate-800">{row.name}</div>
                  <div className="text-xs text-slate-400">
                    {row.setName ?? row.category.replace(/_/g, " ")}
                  </div>
                </td>
                <td className="px-4 py-2 text-right">{row.stock}</td>
                <td className="px-4 py-2 text-right">{gbp.format(row.avgCost)}</td>
                <td className="px-4 py-2 text-right font-medium">
                  {gbp.format(row.totalSpent)}
                </td>
                <td className="px-4 py-2 text-right">
                  {row.msrp != null ? gbp.format(row.msrp) : "—"}
                </td>
                <td className="px-4 py-2 text-right whitespace-nowrap">
                  <button
                    onClick={() => setEditingId(row.id)}
                    className="text-xs text-indigo-600 hover:text-indigo-800 mr-3"
                  >
                    Edit
                  </button>
                  <form action={deleteProductAction} className="inline">
                    <input type="hidden" name="id" value={row.id} />
                    <ConfirmSubmitButton
                      confirmText={`Delete "${row.name}"? This also deletes all its purchase and sale history. This cannot be undone.`}
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

      <Modal open={!!editingRow} onClose={() => setEditingId(null)} title="Edit product">
        {editingRow && (
          <EditProductForm row={editingRow} onDone={() => setEditingId(null)} />
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
      className={`px-4 py-2 cursor-pointer select-none hover:text-slate-700 ${
        align === "left" ? "text-left" : "text-right"
      }`}
    >
      {label}
      {active && <span className="ml-1">{dir === "asc" ? "↑" : "↓"}</span>}
    </th>
  );
}

function EditProductForm({
  row,
  onDone,
}: {
  row: InventoryRow;
  onDone: () => void;
}) {
  const [state, action, pending] = useActionState(updateProductAction, undefined);
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
      <input
        name="name"
        defaultValue={row.name}
        required
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
      <div className="grid grid-cols-2 gap-2">
        <select
          name="category"
          defaultValue={row.category}
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
          defaultValue={row.msrp ?? ""}
          placeholder="MSRP £"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <input
        name="setName"
        defaultValue={row.setName ?? ""}
        placeholder="Set (optional)"
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
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
