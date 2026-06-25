"use client";

import { useGetMeQuery } from "@/api/auth/authApi";
import {
  AppNotification,
  useGetAllNotificationsQuery,
  useGetNotificationsQuery,
  useMarkAllReadMutation,
  useMarkOneReadMutation,
} from "@/api/notifications/notificationsApi";
import PageHeader from "@/components/ui/PageHeader";
import { Bell, CheckCheck, Inbox } from "lucide-react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Filter = "all" | "unread" | "read";

function notificationLink(n: AppNotification, role: string | undefined, locale: string): string | null {
  if (!n.reference_id) return null;
  switch (n.reference_type) {
    case "ORDER_CREATED":
    case "STATUS_CHANGED":
      if (role === "ADMIN" || role === "WAREHOUSE") return `/${locale}/admin/orders/${n.reference_id}`;
      if (role === "DELIVERY") return `/${locale}/delivery/orders/${n.reference_id}`;
      return `/${locale}/orders/${n.reference_id}`;
    case "REVIEW_PENDING":
      return `/${locale}/admin/settings/reviews`;
    default:
      return null;
  }
}

export default function NotificationsPage() {
  const locale = useLocale();
  const isBn = locale === "bn";
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");
  const [page, setPage] = useState(1);

  const { data: me } = useGetMeQuery();
  const { data: summary } = useGetNotificationsQuery();
  const { data, isLoading } = useGetAllNotificationsQuery({
    page,
    page_size: 20,
    is_read: filter === "all" ? undefined : filter === "read",
  });
  const [markAll] = useMarkAllReadMutation();
  const [markOne] = useMarkOneReadMutation();

  const notifications = data?.data ?? [];
  const totalPages = data?.pagination?.total_pages ?? 1;
  const unreadCount = summary?.unread_count ?? 0;

  const timeAgo = (iso: string) => {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (diff < 60) return isBn ? "এইমাত্র" : "just now";
    if (diff < 3600) return isBn ? `${Math.floor(diff / 60)} মিনিট আগে` : `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return isBn ? `${Math.floor(diff / 3600)} ঘণ্টা আগে` : `${Math.floor(diff / 3600)}h ago`;
    return isBn ? `${Math.floor(diff / 86400)} দিন আগে` : `${Math.floor(diff / 86400)}d ago`;
  };

  const handleClick = async (n: AppNotification) => {
    if (!n.is_read) await markOne(n.id);
    const link = notificationLink(n, me?.role, locale);
    if (link) router.push(link);
  };

  const handleFilterChange = (f: Filter) => {
    setFilter(f);
    setPage(1);
  };

  const FILTERS: { key: Filter; icon: React.ReactNode; bn: string; en: string; count?: number }[] = [
    { key: "all", icon: <Inbox className="w-4 h-4" />, bn: "সব", en: "All" },
    { key: "unread", icon: <Bell className="w-4 h-4" />, bn: "অপঠিত", en: "Unread", count: unreadCount },
    { key: "read", icon: <CheckCheck className="w-4 h-4" />, bn: "পঠিত", en: "Read" },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-3">
      <PageHeader
        title={isBn ? "নোটিফিকেশন" : "Notifications"}
        description={isBn ? "আপনার সকল নোটিফিকেশন এখানে দেখুন" : "All your notifications in one place"}
        actions={
          unreadCount > 0 ? (
            <button
              onClick={() => markAll()}
              className="text-sm text-amber-600 hover:text-amber-700 font-medium"
            >
              {isBn ? "সব পড়া হয়েছে" : "Mark all read"}
            </button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-4">
        {/* Left panel — filters */}
        <div className="card p-2 h-fit md:sticky md:top-20">
          <nav className="flex md:flex-col gap-1">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => handleFilterChange(f.key)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-left transition-colors ${
                  filter === f.key
                    ? "bg-amber-50 text-amber-700"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {f.icon}
                <span className="flex-1">{isBn ? f.bn : f.en}</span>
                {!!f.count && (
                  <span className="bg-red-100 text-red-600 text-xs font-semibold px-1.5 py-0.5 rounded-full">
                    {f.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Right panel — list */}
        <div>
          <div className="card divide-y divide-gray-50 p-0 overflow-hidden">
            {isLoading ? (
              <p className="text-center text-sm text-gray-400 py-12">
                {isBn ? "লোড হচ্ছে..." : "Loading..."}
              </p>
            ) : notifications.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-12">
                {isBn ? "কোনো নোটিফিকেশন নেই" : "No notifications"}
              </p>
            ) : (
              notifications.map((n) => {
                const link = notificationLink(n, me?.role, locale);
                return (
                  <div
                    key={n.id}
                    onClick={() => handleClick(n)}
                    className={`px-4 py-3.5 transition-colors ${!n.is_read ? "bg-amber-50/50" : ""} ${link ? "cursor-pointer hover:bg-gray-50" : ""}`}
                  >
                    <div className="flex items-start gap-2.5">
                      {!n.is_read && (
                        <span className="mt-1.5 w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0" style={{ paddingLeft: n.is_read ? "10px" : "0" }}>
                        <p className="text-sm font-semibold text-gray-800 leading-snug">
                          {isBn ? n.title_bn : n.title_en}
                        </p>
                        <p
                          className="text-sm text-gray-500 mt-0.5 leading-snug"
                          dangerouslySetInnerHTML={{
                            __html: (isBn ? n.body_bn : n.body_en).replace(
                              /\*\*(.+?)\*\*/g,
                              '<strong class="text-gray-800">$1</strong>',
                            ),
                          }}
                        />
                        <p className="text-xs text-gray-400 mt-1">{timeAgo(n.created_at)}</p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
              >
                {isBn ? "আগের" : "Prev"}
              </button>
              <span className="text-sm text-gray-500">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
              >
                {isBn ? "পরের" : "Next"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
