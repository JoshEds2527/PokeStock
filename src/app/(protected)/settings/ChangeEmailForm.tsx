"use client";

import { useActionState, useEffect, useRef } from "react";
import { changeEmailAction } from "@/lib/actions/account";

export function ChangeEmailForm() {
  const [state, action, pending] = useActionState(changeEmailAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="space-y-3">
      <input
        name="newEmail"
        type="email"
        placeholder="New email"
        required
        autoComplete="email"
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
      <input
        name="currentPassword"
        type="password"
        placeholder="Current password"
        required
        autoComplete="current-password"
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.success && <p className="text-sm text-emerald-600">Email updated.</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-indigo-600 text-white text-sm font-medium py-2 disabled:opacity-60"
      >
        {pending ? "Saving..." : "Update email"}
      </button>
    </form>
  );
}
