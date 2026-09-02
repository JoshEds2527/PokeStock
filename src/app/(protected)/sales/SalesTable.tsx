"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useActionState } from "react";
import { deleteSaleAction, updateSaleAction } from "@/lib/actions/sales";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";
import { Modal } from "@/components/Modal";

const gbp = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });
const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short" });

const platforms = ["EBAY", "VINTED", "FACEBOOK", "DEPOP", "IN_PERSON", "OTHER"];

export type SaleRow = {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitSalePrice: number;
  platform: string;
  fees: number;
  shippingCost: number;
  saleDate: string; // ISO
};

type SortKey = "saleDate" | "productName" | "net";

export function SalesTable({ rows }: { rows: SaleRow[] }) {
  const [productFilter, setProductFilter] = useState("ALL");
  const [platformFilter, setPlatformFilter] = useState("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("saleDate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [editingId, setEditingId] = useState<string | null>(null);

  const productOptions = useMemo(() => {
    const names = new Set(rows.map((r) => r.productName));
    return [...names].sort();
  }, [rows]);

  function netOf(r: SaleRow) {
    return r.quantity * r.unitSalePrice - r.fees - r.shippingCost;
  }

  const filtered = useMemo(() => {
    let result = rows;
    if (productFilter !== "ALL") result = result.filter((r) => r.productName === productFilter);
    if (platformFilter !== "ALL") result = result.filter((r) => r.platform === platformFilter);
    const sorted = [...result].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "saleDate") cmp = new Date(a.saleDate).getTime() - new Date(b.saleDate).getTime();
      else if (sortKey === "productName") cmp = a.productName.localeCompare(b.productName);
      else cmp = netOf(a) - netOf(b);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [rows, productFilter, platformFilter, sortKey, sortDir]);

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
      <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
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
        <select
          value={platformFilter}
          onChange={(e) => setPlatformFilter(e.target.value)}
          className="text-xs rounded-lg border border-slate-300 px-2 py-1"
        >
          <option value="ALL">All platforms</option>
          {platforms.map((p) => (
            <option key={p} value={p}>
              {p.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <SortHeader label="Date" sortKey="saleDate" activeKey={sortKey} dir={sortDir} onClick={toggleSort} align="left" />
              <SortHeader label="Product" sortKey="productName" activeKey={sortKey} dir={sortDir} onClick={toggleSort} align="left" />
              <th className="px-4 py-2 text-left">Platform</th>
              <SortHeader label="Net" sortKey="net" activeKey={sortKey} dir={sortDir} onClick={toggleSort} />
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  {rows.length === 0 ? "No sales logged yet." : "No sales match."}
                </td>
              </tr>
            )}
            {filtered.map((s) => (
              <tr key={s.id}>
                <td className="px-4 py-2 text-slate-500 whitespace-nowrap">
                  {dateFmt.format(new Date(s.saleDate))}
                </td>
                <td className="px-4 py-2">
                  {s.quantity}x {s.productName}
                </td>
                <td className="px-4 py-2 text-slate-500">{s.platform.replace(/_/g, " ")}</td>
                <td className="px-4 py-2 text-right font-medium">{gbp.format(netOf(s))}</td>
                <td className="px-4 py-2 text-right whitespace-nowrap">
                  <button
                    onClick={() => setEditingId(s.id)}
                    className="text-xs text-indigo-600 hover:text-indigo-800 mr-3"
                  >
                    Edit
                  </button>
                  <form action={deleteSaleAction} className="inline">
                    <input type="hidden" name="id" value={s.id} />
                    <ConfirmSubmitButton
                      confirmText={`Delete this sale of ${s.quantity}x ${s.productName}? This cannot be undone.`}
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

      <Modal open={!!editingRow} onClose={() => setEditingId(null)} title="Edit sale">
        {editingRow && <EditSaleForm row={editingRow} onDone={() => setEditingId(null)} />}
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

function EditSaleForm({ row, onDone }: { row: SaleRow; onDone: () => void }) {
  const [state, action, pending] = useActionState(updateSaleAction, undefined);
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
          name="unitSalePrice"
          type="number"
          step="0.01"
          min="0"
          defaultValue={row.unitSalePrice}
          required
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <select
          name="platform"
          defaultValue={row.platform}
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
          defaultValue={row.fees}
          placeholder="Fees £"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          name="shippingCost"
          type="number"
          step="0.01"
          min="0"
          defaultValue={row.shippingCost}
          placeholder="Postage £"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <input
        name="saleDate"
        type="date"
        defaultValue={row.saleDate.slice(0, 10)}
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
