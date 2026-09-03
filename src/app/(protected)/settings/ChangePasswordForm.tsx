"use client";

import { useActionState, useEffect, useRef } from "react";
import { changePasswordAction } from "@/lib/actions/account";

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState(changePasswordAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="space-y-3">
      <input
        name="currentPassword"
        type="password"
        placeholder="Current password"
        required
        autoComplete="current-password"
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
      <input
        name="newPassword"
        type="password"
        placeholder="New password"
        required
        minLength={8}
        autoComplete="new-password"
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
      <input
        name="confirmPassword"
        type="password"
        placeholder="Confirm new password"
        required
        minLength={8}
        autoComplete="new-password"
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.success && <p className="text-sm text-emerald-600">Password updated.</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-indigo-600 text-white text-sm font-medium py-2 disabled:opacity-60"
      >
        {pending ? "Saving..." : "Update password"}
      </button>
    </form>
  );
}
