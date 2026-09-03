import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ChangeEmailForm } from "./ChangeEmailForm";
import { ChangePasswordForm } from "./ChangePasswordForm";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="text-xl font-bold text-white drop-shadow">Account settings</h1>

      <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 p-4 space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-700">Change email</h2>
          <p className="text-xs text-slate-500 mt-0.5">Current email: {session.email}</p>
        </div>
        <ChangeEmailForm />
      </div>

      <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 p-4 space-y-3">
        <h2 className="text-sm font-semibold text-slate-700">Change password</h2>
        <p className="text-xs text-slate-500">
          If this account is shared with someone else, changing the password
          means you&apos;ll need to give them the new one too.
        </p>
        <ChangePasswordForm />
      </div>
    </div>
  );
}
