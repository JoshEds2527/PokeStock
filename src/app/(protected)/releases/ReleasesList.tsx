"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useActionState } from "react";
import { deleteReleaseAction, updateReleaseAction } from "@/lib/actions/releases";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";
import { Modal } from "@/components/Modal";
import { StatusSelect } from "./StatusSelect";

const dateFmt = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const statusStyles: Record<string, string> = {
  UPCOMING: "bg-indigo-50 text-indigo-700",
  RELEASED: "bg-emerald-50 text-emerald-700",
  DELAYED: "bg-amber-50 text-amber-700",
  CANCELLED: "bg-slate-100 text-slate-500",
};

const statuses = ["UPCOMING", "RELEASED", "DELAYED", "CANCELLED"];

export type ReleaseRow = {
  id: string;
  productName: string;
  retailer: string | null;
  releaseDate: string; // ISO
  url: string | null;
  status: string;
  notes: string | null;
};

type SortKey = "releaseDate" | "productName";

export function ReleasesList({ rows }: { rows: ReleaseRow[] }) {
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("releaseDate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [editingId, setEditingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = rows;
    if (statusFilter !== "ALL") result = result.filter((r) => r.status === statusFilter);
    const sorted = [...result].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "releaseDate") {
        cmp = new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime();
      } else {
        cmp = a.productName.localeCompare(b.productName);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [rows, statusFilter, sortKey, sortDir]);

  const editingRow = rows.find((r) => r.id === editingId) ?? null;

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
          className="text-xs rounded-lg border border-slate-300 px-2 py-1"
        >
          <option value="releaseDate">Sort by date</option>
          <option value="productName">Sort A–Z</option>
        </select>
        <button
          onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
          className="text-xs rounded-lg border border-slate-300 px-2 py-1 text-slate-600"
        >
          {sortDir === "asc" ? "Ascending ↑" : "Descending ↓"}
        </button>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs rounded-lg border border-slate-300 px-2 py-1"
        >
          <option value="ALL">All statuses</option>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <p className="text-sm text-slate-400">
            {rows.length === 0 ? "No releases tracked yet." : "No releases match."}
          </p>
        )}
        {filtered.map((r) => (
          <div
            key={r.id}
            className="bg-white rounded-2xl border border-slate-200 p-4 flex items-start justify-between gap-3"
          >
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-slate-800">{r.productName}</span>
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${statusStyles[r.status]}`}
                >
                  {r.status}
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-1">
                {dateFmt.format(new Date(r.releaseDate))}
                {r.retailer ? ` · ${r.retailer}` : ""}
              </p>
              {r.url && (
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-indigo-600 hover:underline"
                >
                  View listing
                </a>
              )}
              {r.notes && <p className="text-sm text-slate-500 mt-1">{r.notes}</p>}
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <StatusSelect id={r.id} status={r.status} />
              <button
                onClick={() => setEditingId(r.id)}
                className="text-xs text-indigo-600 hover:text-indigo-800"
              >
                Edit
              </button>
              <form action={deleteReleaseAction}>
                <input type="hidden" name="id" value={r.id} />
                <ConfirmSubmitButton
                  confirmText={`Delete the release "${r.productName}"? This cannot be undone.`}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Delete
                </ConfirmSubmitButton>
              </form>
            </div>
          </div>
        ))}
      </div>

      <Modal open={!!editingRow} onClose={() => setEditingId(null)} title="Edit release">
        {editingRow && (
          <EditReleaseForm row={editingRow} onDone={() => setEditingId(null)} />
        )}
      </Modal>
    </div>
  );
}

function EditReleaseForm({ row, onDone }: { row: ReleaseRow; onDone: () => void }) {
  const [state, action, pending] = useActionState(updateReleaseAction, undefined);
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
        name="productName"
        defaultValue={row.productName}
        required
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          name="retailer"
          defaultValue={row.retailer ?? ""}
          placeholder="Retailer"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          name="releaseDate"
          type="date"
          defaultValue={row.releaseDate.slice(0, 10)}
          required
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <select
        name="status"
        defaultValue={row.status}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
      >
        {statuses.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <input
        name="url"
        type="url"
        defaultValue={row.url ?? ""}
        placeholder="https:// link (optional)"
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
      <input
        name="notes"
        defaultValue={row.notes ?? ""}
        placeholder="Notes (optional)"
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
