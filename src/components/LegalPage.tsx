import Link from "next/link";
import { Logo } from "@/components/Logo";

export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <Link href="/" className="inline-flex items-center gap-2 mb-8">
          <Logo size={28} />
          <span className="text-white font-bold">PokéStock</span>
        </Link>

        <div className="bg-white/90 backdrop-blur-xl rounded-2xl border border-white/40 p-6 sm:p-8">
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          <p className="text-xs text-slate-400 mt-1 mb-6">Last updated: {updated}</p>
          <div className="space-y-4 text-sm text-slate-700 leading-relaxed [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-slate-900 [&_h2]:mt-6 [&_h2]:mb-1 [&_a]:text-indigo-600 [&_a]:hover:underline [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1">
            {children}
          </div>
        </div>

        <div className="flex gap-4 justify-center mt-6 text-sm text-white drop-shadow">
          <Link href="/terms" className="hover:underline">
            Terms of Service
          </Link>
          <Link href="/privacy" className="hover:underline">
            Privacy Policy
          </Link>
          <Link href="/login" className="hover:underline">
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
