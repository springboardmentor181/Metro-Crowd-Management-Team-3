"use client";

import { useState } from "react";
import {
  AlertOctagon,
  Bell,
  CheckCheck,
  Mail,
  Newspaper,
  Radio,
} from "lucide-react";

import { Button } from "@/components/ui/Button";
import { useApiData } from "@/hooks/useApiData";
import { useLiveSocket } from "@/hooks/useLiveSocket";
import { getNotifications, markAllNotificationsRead, markNotificationRead } from "@/lib/api/notifications";
import { queryKeys } from "@/lib/queryKeys";
import { useSelectedState } from "@/providers/StateProvider";
import type { Notification, NotificationSource } from "@/lib/api/types";

const POLL_MS = 120000;

type TabKey = "all" | NotificationSource;

const TABS: { key: TabKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "email", label: "Email" },
  { key: "operator", label: "Operator" },
  { key: "system", label: "System" },
  { key: "system_failure", label: "System failure" },
];

function sourceMeta(source: NotificationSource) {
  switch (source) {
    case "email":
      return { label: "Email", icon: Mail, color: "bg-blue-500/10 text-blue-500" };
    case "operator":
      return { label: "Operator", icon: Radio, color: "bg-orange-500/10 text-orange-500" };
    case "system_failure":
      return {
        label: "System failure",
        icon: AlertOctagon,
        color: "bg-red-500/10 text-red-500",
      };
    default:
      return { label: "System", icon: Newspaper, color: "bg-emerald-500/10 text-emerald-500" };
  }
}

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function NotificationCard({
  notification,
  onRead,
}: {
  notification: Notification;
  onRead: () => void;
}) {
  const { label, icon: Icon, color } = sourceMeta(notification.source);
  const [marking, setMarking] = useState(false);

  async function handleRead() {
    if (notification.is_read) return;
    setMarking(true);
    try {
      await markNotificationRead(notification.id);
      onRead();
    } finally {
      setMarking(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleRead}
      className={`flex w-full items-start gap-4 rounded-2xl border p-5 text-left transition ${
        notification.is_read
          ? "border-border"
          : "border-primary/40 bg-primary/5"
      }`}
    >
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${color}`}>
        <Icon size={20} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="font-semibold">{notification.title}</h4>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
            {label}
          </span>
          {!notification.is_read && (
            <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
          )}
        </div>
        <p className="mt-1.5 whitespace-pre-wrap text-sm text-muted">
          {notification.message}
        </p>
        <p className="mt-2 text-xs text-muted">
          {timeAgo(notification.created_at)}
          {marking ? " · marking as read..." : ""}
        </p>
      </div>
    </button>
  );
}

export default function NotificationCenter() {
  const [tab, setTab] = useState<TabKey>("all");
  const { selectedState } = useSelectedState();

  const notifications = useApiData(
    queryKeys.notifications,
    (signal) => getNotifications(tab === "all" ? undefined : tab, false, signal, selectedState ?? undefined),
    [tab, selectedState],
    POLL_MS,
  );

  // New notifications that arrived over the live socket since the
  // last fetch, prepended instantly instead of waiting on POLL_MS.
  // Reset whenever a fresh fetch comes in (that fetch already
  // includes them, so keeping both would duplicate) - adjusted during
  // render, not inside an effect: https://react.dev/learn/you-might-not-need-an-effect
  const [prevData, setPrevData] = useState(notifications.data);
  const [liveItems, setLiveItems] = useState<Notification[]>([]);
  if (notifications.data !== prevData) {
    setPrevData(notifications.data);
    setLiveItems([]);
  }

  useLiveSocket({
    notification: (payload) => {
      const matchesTab = tab === "all" || payload.source === tab;
      const matchesState = !payload.state || !selectedState || payload.state === selectedState;
      if (!matchesTab || !matchesState) return;
      setLiveItems((items) =>
        items.some((n) => n.id === payload.id) ? items : [payload, ...items],
      );
    },
    notification_read: () => notifications.refresh(),
    notification_all_read: () => notifications.refresh(),
  });

  const items = [
    ...liveItems,
    ...(notifications.data ?? []).filter(
      (n) => !liveItems.some((live) => live.id === n.id),
    ),
  ];

  const unreadCount = items.filter((n) => !n.is_read).length;

  async function handleMarkAll() {
    await markAllNotificationsRead();
    setLiveItems([]);
    notifications.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-border bg-card p-6">
        <div className="flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                tab === t.key ? "bg-primary text-white" : "text-muted hover:bg-muted"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {unreadCount > 0 && (
          <Button size="sm" variant="outline" onClick={handleMarkAll}>
            <CheckCheck size={14} />
            Mark all as read
          </Button>
        )}
      </div>

      <div className="rounded-3xl border border-border bg-card p-6">
        {notifications.loading ? (
          <p className="text-sm text-muted">Loading notifications...</p>
        ) : notifications.error ? (
          <p className="text-sm text-red-500">{notifications.error}</p>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-border p-6 text-center">
            <Bell className="mx-auto text-muted" size={24} />
            <p className="mt-3 text-sm text-muted">
              No notifications from the last 7 days.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((n) => (
              <NotificationCard
                key={n.id}
                notification={n}
                onRead={() => {
                  setLiveItems((cur) =>
                    cur.map((item) =>
                      item.id === n.id ? { ...item, is_read: true } : item,
                    ),
                  );
                  notifications.refresh();
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
