"use client";

import { useActionState } from "react";
import Link from "next/link";
import { resetPasswordAction } from "@/lib/actions/password-reset";

export function ResetPasswordForm({
  token,
  maskedEmail,
}: {
  token: string;
  maskedEmail: string | null;
}) {
  const [state, action, pending] = useActionState(resetPasswordAction, undefined);

  return (
    <form
      action={action}
      className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4"
    >
      <input type="hidden" name="token" value={token} />
      {maskedEmail && (
        <p className="text-sm text-slate-500">
          Resetting the password for <span className="font-medium text-slate-700">{maskedEmail}</span>
        </p>
      )}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          New password
        </label>
        <input
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Confirm new password
        </label>
        <input
          name="confirmPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      {state?.error && (
        <div className="space-y-1">
          <p className="text-sm text-red-600">{state.error}</p>
          <Link
            href="/forgot-password"
            className="text-sm text-indigo-600 hover:underline"
          >
            Request a new reset link
          </Link>
        </div>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-indigo-600 text-white font-medium py-2.5 disabled:opacity-60"
      >
        {pending ? "Saving..." : "Reset password"}
      </button>
    </form>
  );
}
