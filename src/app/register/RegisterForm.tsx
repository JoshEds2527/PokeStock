"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAction } from "@/lib/actions/auth";

export function RegisterForm({ pokemonId }: { pokemonId: number }) {
  const [state, action, pending] = useActionState(registerAction, undefined);

  return (
    <form
      action={action}
      className="bg-white/70 backdrop-blur-xl shadow-xl rounded-2xl border border-white/40 p-6 space-y-4"
    >
      <input type="hidden" name="pokemonId" value={pokemonId} />
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Your name</label>
        <input
          name="name"
          type="text"
          required
          autoComplete="name"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
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
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
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
          Confirm password
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
      <p className="text-xs text-slate-400">
        Share this email and password with anyone you want to co-manage this tracker with
        &mdash; anyone signed in with it sees the same shared data.
      </p>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <p className="text-xs text-slate-400">
        By creating an account you agree to the{" "}
        <Link href="/terms" className="text-indigo-600 hover:underline">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="text-indigo-600 hover:underline">
          Privacy Policy
        </Link>
        .
      </p>
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-indigo-600 text-white font-medium py-2.5 disabled:opacity-60"
      >
        {pending ? "Creating account..." : "Create account"}
      </button>
      <p className="text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link href="/login" className="text-indigo-600 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
