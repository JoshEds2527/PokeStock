"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/lib/actions/auth";
import { SessionBadge } from "@/components/SessionBadge";

const baseLinks = [
  { href: "/", label: "Dashboard", icon: "📊" },
  { href: "/inventory", label: "Inventory", icon: "📦" },
  { href: "/sales", label: "Sales", icon: "💰" },
  { href: "/releases", label: "Releases", icon: "📅" },
  { href: "/market", label: "Market", icon: "🔎" },
];

const adminLink = { href: "/admin", label: "Admin", icon: "🛠️" };

export function NavBar({
  userName,
  pokemonId,
  isDeveloper,
}: {
  userName: string;
  pokemonId?: number;
  isDeveloper?: boolean;
}) {
  const pathname = usePathname();
  const links = isDeveloper ? [...baseLinks, adminLink] : baseLinks;

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-56 border-r border-white/30 bg-white/70 backdrop-blur-xl px-4 py-6">
        <div className="flex items-center gap-2 mb-1">
          <SessionBadge pokemonId={pokemonId} />
          <h1 className="text-lg font-bold text-slate-900">PokéStock</h1>
        </div>
        <Link
          href="/settings"
          className="block text-xs text-slate-500 hover:text-slate-800 hover:underline mb-6"
        >
          Signed in as {userName} · Settings
        </Link>
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
                    : "text-slate-600 hover:bg-white/60"
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
      <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-white/30 bg-white/70 backdrop-blur-xl sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <SessionBadge pokemonId={pokemonId} size={24} />
          <h1 className="text-base font-bold text-slate-900">PokéStock</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/settings" className="text-xs text-slate-500">
            Settings
          </Link>
          <form action={logoutAction}>
            <button className="text-xs text-slate-500">Sign out</button>
          </form>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/70 backdrop-blur-xl border-t border-white/30 flex z-20">
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
