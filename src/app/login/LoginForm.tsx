"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction } from "@/lib/actions/auth";

export function LoginForm({ pokemonId }: { pokemonId: number }) {
  const [state, action, pending] = useActionState(loginAction, undefined);

  return (
    <form
      action={action}
      className="bg-white/70 backdrop-blur-xl shadow-xl rounded-2xl border border-white/40 p-6 space-y-4"
    >
      <input type="hidden" name="pokemonId" value={pokemonId} />
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
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium text-slate-700">Password</label>
          <Link href="/forgot-password" className="text-xs text-indigo-600 hover:underline">
            Forgot password?
          </Link>
        </div>
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-indigo-600 text-white font-medium py-2.5 disabled:opacity-60"
      >
        {pending ? "Signing in..." : "Sign in"}
      </button>
      <p className="text-center text-sm text-slate-500">
        New here?{" "}
        <Link href="/register" className="text-indigo-600 hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}
