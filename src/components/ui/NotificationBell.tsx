"use client";

import {
  useGetNotificationsQuery,
  useMarkAllReadMutation,
  useMarkOneReadMutation,
} from "@/api/notifications/notificationsApi";
import { useLocale } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";

export default function NotificationBell() {
  const locale = useLocale();
  const isBn = locale === "bn";
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data, refetch } = useGetNotificationsQuery(undefined, {
    pollingInterval: 30_000,
  });

  const [markAll] = useMarkAllReadMutation();
  const [markOne] = useMarkOneReadMutation();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const notifications = data?.notifications ?? [];
  const unread = data?.unread_count ?? 0;

  const handleMarkAll = async () => {
    await markAll();
    refetch();
  };

  const handleMarkOne = async (id: string) => {
    await markOne(id);
  };

  const timeAgo = (iso: string) => {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (diff < 60) return isBn ? "এইমাত্র" : "just now";
    if (diff < 3600) return isBn ? `${Math.floor(diff / 60)} মিনিট আগে` : `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return isBn ? `${Math.floor(diff / 3600)} ঘণ্টা আগে` : `${Math.floor(diff / 3600)}h ago`;
    return isBn ? `${Math.floor(diff / 86400)} দিন আগে` : `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="relative flex items-center justify-center text-gray-600 hover:text-amber-600 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-800">
                {isBn ? "নোটিফিকেশন" : "Notifications"}
                {unread > 0 && (
                  <span className="ml-2 bg-red-100 text-red-600 text-xs font-semibold px-1.5 py-0.5 rounded-full">
                    {unread}
                  </span>
                )}
              </h3>
              {unread > 0 && (
                <button
                  onClick={handleMarkAll}
                  className="text-xs text-amber-600 hover:text-amber-700 font-medium"
                >
                  {isBn ? "সব পড়া হয়েছে" : "Mark all read"}
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
              {notifications.length === 0 ? (
                <p className="text-center text-sm text-gray-400 py-10">
                  {isBn ? "কোনো নোটিফিকেশন নেই" : "No notifications"}
                </p>
              ) : (
                notifications.map(n => (
                  <div
                    key={n.id}
                    onClick={() => !n.is_read && handleMarkOne(n.id)}
                    className={`px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${!n.is_read ? "bg-amber-50/50" : ""}`}
                  >
                    <div className="flex items-start gap-2">
                      {!n.is_read && (
                        <span className="mt-1.5 w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0" style={{ paddingLeft: n.is_read ? "10px" : "0" }}>
                        <p className="text-xs font-semibold text-gray-800 leading-snug">
                          {isBn ? n.title_bn : n.title_en}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5 leading-snug"
                          dangerouslySetInnerHTML={{
                            __html: (isBn ? n.body_bn : n.body_en)
                              .replace(/\*\*(.+?)\*\*/g, '<strong class="text-gray-800">$1</strong>')
                          }}
                        />
                        <p className="text-[10px] text-gray-400 mt-1">{timeAgo(n.created_at)}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
