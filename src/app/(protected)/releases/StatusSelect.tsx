"use client";

import { updateReleaseStatusAction } from "@/lib/actions/releases";
import { statuses } from "./types";

export function StatusSelect({ id, status }: { id: string; status: string }) {
  return (
    <form action={updateReleaseStatusAction}>
      <input type="hidden" name="id" value={id} />
      <select
        name="status"
        defaultValue={status}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="text-xs rounded-lg border border-slate-300 px-2 py-1"
      >
        {statuses.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
    </form>
  );
}
