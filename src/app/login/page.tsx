import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect("/");

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900">PokéStock</h1>
          <p className="text-slate-500 mt-1 text-sm">Sign in to your stock tracker</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
