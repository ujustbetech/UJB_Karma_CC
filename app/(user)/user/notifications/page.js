"use client";

import { useMemo, useState } from "react";
import { Bell, CheckCheck, ChevronRight, RefreshCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/authContext";
import UserPageHeader from "@/components/user/UserPageHeader";
import useUserNotifications from "@/hooks/useUserNotifications";

export default function NotificationsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [filter, setFilter] = useState("all");

  const {
    notifications,
    unreadCount,
    loading,
    refresh,
    markOneRead,
    markAllRead,
  } = useUserNotifications(user);

  const filteredNotifications = useMemo(() => {
    if (filter === "unread") {
      return notifications.filter((item) => !item.read);
    }

    return notifications;
  }, [filter, notifications]);

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <main className="min-h-screen py-6">
      <div className="space-y-5">
        <UserPageHeader
          title="Notifications"
          description="Stay on top of referral updates, prospects, meetings, and payment activity in one place."
          icon={Bell}
          action={
            <div className="flex items-center gap-2">
              <button
                onClick={refresh}
                className="inline-flex items-center gap-2 rounded-2xl border border-orange-200 bg-white px-4 py-2 text-sm font-medium text-orange-600 transition hover:border-orange-300 hover:bg-orange-50"
              >
                <RefreshCcw size={16} />
                Refresh
              </button>
              <button
                onClick={markAllRead}
                disabled={notifications.length === 0 || unreadCount === 0}
                className="inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                <CheckCheck size={16} />
                Mark all read
              </button>
            </div>
          }
        />

        <div className="grid grid-cols-2 gap-3">
          <SummaryCard label="Unread" value={unreadCount} tone="orange" />
          <SummaryCard label="Total" value={notifications.length} tone="slate" />
        </div>

        <div className="flex rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
          <FilterButton
            active={filter === "all"}
            label="All"
            onClick={() => setFilter("all")}
          />
          <FilterButton
            active={filter === "unread"}
            label="Unread"
            onClick={() => setFilter("unread")}
          />
        </div>

        <div className="space-y-3">
          {filteredNotifications.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
              No notifications to show right now.
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <button
                key={notification.id}
                onClick={() => {
                  markOneRead(notification.id);
                  if (notification.href) {
                    router.push(notification.href);
                  }
                }}
                className={`w-full rounded-3xl border p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                  notification.read
                    ? "border-slate-200 bg-white"
                    : "border-orange-200 bg-orange-50/60"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {!notification.read ? (
                        <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
                      ) : (
                        <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                      )}
                      <p className="text-sm font-semibold text-slate-800">
                        {notification.title}
                      </p>
                    </div>
                    <p className="text-sm leading-6 text-slate-600">
                      {notification.message}
                    </p>
                    <p className="text-xs text-slate-400">
                      {notification.createdAtLabel || "Recently"}
                    </p>
                  </div>
                  <ChevronRight className="mt-1 text-slate-400" size={18} />
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </main>
  );
}

function SummaryCard({ label, value, tone }) {
  const toneClass =
    tone === "orange"
      ? "border-orange-200 bg-orange-50 text-orange-600"
      : "border-slate-200 bg-white text-slate-700";

  return (
    <div className={`rounded-3xl border p-4 shadow-sm ${toneClass}`}>
      <p className="text-xs uppercase tracking-[0.24em]">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}

function FilterButton({ active, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
        active ? "bg-orange-500 text-white" : "text-slate-500 hover:text-slate-700"
      }`}
    >
      {label}
    </button>
  );
}


