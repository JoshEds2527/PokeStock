import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Logo } from "@/components/Logo";
import { RegisterForm } from "./RegisterForm";

export default async function RegisterPage() {
  const session = await getSession();
  if (session) redirect("/");

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2">
            <Logo size={32} />
            <h1 className="text-2xl font-bold text-slate-900">PokéStock</h1>
          </div>
          <p className="text-slate-500 mt-1 text-sm">Create your own tracker</p>
        </div>
        <RegisterForm />
      </div>
    </div>
  );
}
