"use client";

import { useEffect, useRef, useState } from "react";
import { useActionState } from "react";
import {
  untrackReleaseAction,
  deleteReleaseAction,
  updateReleaseAction,
} from "@/lib/actions/releases";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";
import { Modal } from "@/components/Modal";
import { StatusSelect } from "./StatusSelect";
import { statuses, statusStyles, type ReleaseRow } from "./types";

const dateFmt = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export function TrackedReleases({ rows }: { rows: ReleaseRow[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const editingRow = rows.find((r) => r.id === editingId) ?? null;

  const sorted = [...rows].sort(
    (a, b) => new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime()
  );

  return (
    <div className="space-y-3">
      {sorted.length === 0 && (
        <p className="text-sm text-white/60 drop-shadow">
          You&apos;re not tracking any releases yet — browse the shared list below and tap
          &quot;Track&quot; on anything you want to keep an eye on.
        </p>
      )}
      {sorted.map((r) => (
        <div
          key={r.id}
          className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 p-4 flex items-start justify-between gap-3"
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
            {r.isOwner && <StatusSelect id={r.id} status={r.status} />}
            {r.isOwner && (
              <button
                onClick={() => setEditingId(r.id)}
                className="text-xs text-indigo-600 hover:text-indigo-800"
              >
                Edit
              </button>
            )}
            <form action={untrackReleaseAction}>
              <input type="hidden" name="releaseId" value={r.id} />
              <button className="text-xs text-slate-500 hover:text-slate-700">Untrack</button>
            </form>
            {r.isOwner && (
              <form action={deleteReleaseAction}>
                <input type="hidden" name="id" value={r.id} />
                <ConfirmSubmitButton
                  confirmText={`Remove "${r.productName}" from the shared release list entirely? This also removes it from everyone else tracking it. This cannot be undone.`}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Delete
                </ConfirmSubmitButton>
              </form>
            )}
          </div>
        </div>
      ))}

      <Modal open={!!editingRow} onClose={() => setEditingId(null)} title="Edit release">
        {editingRow && (
          <EditReleaseForm row={editingRow} onDone={() => setEditingId(null)} />
        )}
      </Modal>
    </div>
  );
}

export function EditReleaseForm({ row, onDone }: { row: ReleaseRow; onDone: () => void }) {
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
