"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { markNotificationReadAction, markAllNotificationsReadAction } from "@/lib/actions/notifications";

export type NotificationItem = {
  id: string;
  message: string;
  url: string | null;
  createdAt: string; // ISO
  read: boolean;
};

const relativeFmt = new Intl.RelativeTimeFormat("en-GB", { numeric: "auto" });

function relativeTime(iso: string): string {
  const diffMs = new Date(iso).getTime() - Date.now();
  const diffMin = Math.round(diffMs / 60000);
  if (Math.abs(diffMin) < 60) return relativeFmt.format(diffMin, "minute");
  const diffHour = Math.round(diffMin / 60);
  if (Math.abs(diffHour) < 24) return relativeFmt.format(diffHour, "hour");
  return relativeFmt.format(Math.round(diffHour / 24), "day");
}

export function NotificationBell({ notifications }: { notifications: NotificationItem[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [, startTransition] = useTransition();
  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  function handleItemClick(n: NotificationItem) {
    setOpen(false);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", n.id);
      await markNotificationReadAction(fd);
      if (n.url) router.push(n.url);
      else router.refresh();
    });
  }

  function handleMarkAllRead() {
    startTransition(async () => {
      await markAllNotificationsReadAction();
      router.refresh();
    });
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        aria-expanded={open}
        className="relative w-9 h-9 flex items-center justify-center rounded-lg text-slate-700 hover:bg-white/60"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M4 15h12l-1.4-2.1a3 3 0 0 1-.5-1.67V8.5a4.1 4.1 0 0 0-3.35-4.03V4a.75.75 0 0 0-1.5 0v.47A4.1 4.1 0 0 0 5.9 8.5v2.73a3 3 0 0 1-.5 1.67L4 15Z"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
          <path d="M8 16.5a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 rounded-xl border border-white/40 bg-white/95 backdrop-blur-xl shadow-lg overflow-hidden z-30">
          <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100">
            <span className="text-xs font-semibold text-slate-600">Notifications</span>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} className="text-xs text-indigo-600 hover:underline">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 && (
              <p className="px-4 py-6 text-center text-xs text-slate-400">No notifications yet.</p>
            )}
            {notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => handleItemClick(n)}
                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 ${
                  n.read ? "text-slate-400" : "text-slate-700 font-medium"
                }`}
              >
                <div className="flex items-start gap-2">
                  {!n.read && <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />}
                  <span>
                    {n.message}
                    <div className="text-[11px] text-slate-400 mt-0.5 font-normal">
                      {relativeTime(n.createdAt)}
                    </div>
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
