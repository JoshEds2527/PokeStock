"use client";

import { useEffect, useRef, useState } from "react";
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
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  // Closing on route change keeps the dropdown from staying open after a tap.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

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

      {/* Mobile top bar: logo centered, dropdown menu on the right */}
      <div className="md:hidden relative grid grid-cols-[2.25rem_1fr_2.25rem] items-center px-4 py-3 border-b border-white/30 bg-white/70 backdrop-blur-xl">
        <div />
        <div className="flex items-center justify-center gap-2">
          <SessionBadge pokemonId={pokemonId} size={24} />
          <h1 className="text-base font-bold text-slate-900">PokéStock</h1>
        </div>
        <div ref={menuRef} className="relative justify-self-end">
          <button
            onClick={() => setMenuOpen((open) => !open)}
            aria-label="Open menu"
            aria-expanded={menuOpen}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-700 hover:bg-white/60"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M3 5.5h14M3 10h14M3 14.5h14"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-white/40 bg-white/95 backdrop-blur-xl shadow-lg overflow-hidden z-30">
              <nav className="flex flex-col py-1">
                {links.map((link) => {
                  const active = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium ${
                        active
                          ? "bg-indigo-50 text-indigo-700"
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <span>{link.icon}</span>
                      {link.label}
                    </Link>
                  );
                })}
              </nav>
              <div className="border-t border-slate-200 py-1">
                <Link
                  href="/settings"
                  className="block px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50"
                >
                  Settings
                </Link>
                <form action={logoutAction}>
                  <button className="w-full text-left px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50">
                    Sign out
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
