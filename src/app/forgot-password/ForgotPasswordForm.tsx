"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordResetAction } from "@/lib/actions/password-reset";

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordResetAction, undefined);

  if (state?.success) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4 text-center">
        <p className="text-sm text-slate-700">
          If an account exists for that email, we&apos;ve sent a link to reset the
          password. It expires in 1 hour.
        </p>
        <Link href="/login" className="text-sm text-indigo-600 hover:underline">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form
      action={action}
      className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4"
    >
      <p className="text-sm text-slate-500">
        Enter your account email and we&apos;ll send you a link to reset your password.
      </p>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-indigo-600 text-white font-medium py-2.5 disabled:opacity-60"
      >
        {pending ? "Sending..." : "Send reset link"}
      </button>
      <p className="text-center text-sm text-slate-500">
        <Link href="/login" className="text-indigo-600 hover:underline">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
