"use client";

import { useMemo, useState } from "react";
import { deleteReleaseAction, trackReleaseAction, untrackReleaseAction } from "@/lib/actions/releases";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";
import { Modal } from "@/components/Modal";
import { statuses, statusStyles, type ReleaseRow } from "./types";
import { EditReleaseForm } from "./TrackedReleases";

const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" });

type SortKey = "releaseDate" | "productName";

export function ReleaseCatalog({ rows }: { rows: ReleaseRow[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("releaseDate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [editingId, setEditingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = rows;
    if (statusFilter !== "ALL") result = result.filter((r) => r.status === statusFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (r) =>
          r.productName.toLowerCase().includes(q) ||
          (r.retailer ?? "").toLowerCase().includes(q)
      );
    }
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
  }, [rows, search, statusFilter, sortKey, sortDir]);

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
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search all releases..."
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="ALL">All statuses</option>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <SortHeader label="Product" sortKey="productName" activeKey={sortKey} dir={sortDir} onClick={toggleSort} align="left" />
              <SortHeader label="Date" sortKey="releaseDate" activeKey={sortKey} dir={sortDir} onClick={toggleSort} align="left" />
              <th className="px-4 py-2 text-left">Retailer</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  {rows.length === 0
                    ? "No releases in the shared list yet. Add one above."
                    : "No releases match."}
                </td>
              </tr>
            )}
            {filtered.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-2 font-medium text-slate-800">{r.productName}</td>
                <td className="px-4 py-2 text-slate-500 whitespace-nowrap">
                  {dateFmt.format(new Date(r.releaseDate))}
                </td>
                <td className="px-4 py-2 text-slate-500">{r.retailer ?? "—"}</td>
                <td className="px-4 py-2">
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${statusStyles[r.status]}`}
                  >
                    {r.status}
                  </span>
                </td>
                <td className="px-4 py-2 text-right whitespace-nowrap">
                  {r.isTracked ? (
                    <form action={untrackReleaseAction} className="inline">
                      <input type="hidden" name="releaseId" value={r.id} />
                      <button className="text-xs text-slate-500 hover:text-slate-700 mr-3">
                        Tracking ✓
                      </button>
                    </form>
                  ) : (
                    <form action={trackReleaseAction} className="inline">
                      <input type="hidden" name="releaseId" value={r.id} />
                      <button className="text-xs text-indigo-600 hover:text-indigo-800 mr-3">
                        Track
                      </button>
                    </form>
                  )}
                  {r.isOwner && (
                    <>
                      <button
                        onClick={() => setEditingId(r.id)}
                        className="text-xs text-indigo-600 hover:text-indigo-800 mr-3"
                      >
                        Edit
                      </button>
                      <form action={deleteReleaseAction} className="inline">
                        <input type="hidden" name="id" value={r.id} />
                        <ConfirmSubmitButton
                          confirmText={`Remove "${r.productName}" from the shared release list entirely? This also removes it from everyone else tracking it. This cannot be undone.`}
                          className="text-xs text-red-500 hover:text-red-700"
                        >
                          Delete
                        </ConfirmSubmitButton>
                      </form>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={!!editingRow} onClose={() => setEditingId(null)} title="Edit release">
        {editingRow && (
          <EditReleaseForm row={editingRow} onDone={() => setEditingId(null)} />
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
