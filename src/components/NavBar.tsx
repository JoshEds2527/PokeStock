"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/lib/actions/auth";
import { Logo } from "@/components/Logo";

const links = [
  { href: "/", label: "Dashboard", icon: "📊" },
  { href: "/inventory", label: "Inventory", icon: "📦" },
  { href: "/sales", label: "Sales", icon: "💰" },
  { href: "/releases", label: "Releases", icon: "📅" },
  { href: "/market", label: "Market", icon: "🔎" },
];

export function NavBar({ userName }: { userName: string }) {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-56 border-r border-slate-200 bg-white px-4 py-6">
        <div className="flex items-center gap-2 mb-1">
          <Logo />
          <h1 className="text-lg font-bold text-slate-900">PokéStock</h1>
        </div>
        <p className="text-xs text-slate-500 mb-6">Signed in as {userName}</p>
        <nav className="flex flex-col gap-1">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
                  active
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <span>{link.icon}</span>
                {link.label}
              </Link>
            );
          })}
        </nav>
        <form action={logoutAction} className="mt-auto">
          <button className="text-sm text-slate-500 hover:text-slate-800 mt-6">
            Sign out
          </button>
        </form>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-white sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Logo size={24} />
          <h1 className="text-base font-bold text-slate-900">PokéStock</h1>
        </div>
        <form action={logoutAction}>
          <button className="text-xs text-slate-500">Sign out</button>
        </form>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex z-20">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium ${
                active ? "text-indigo-700" : "text-slate-500"
              }`}
            >
              <span className="text-lg leading-none">{link.icon}</span>
              {link.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
