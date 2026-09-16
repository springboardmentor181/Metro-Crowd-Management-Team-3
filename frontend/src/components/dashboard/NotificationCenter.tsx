"use client";

import { useState } from "react";
import {
  AlertOctagon,
  Bell,
  CheckCheck,
  Mail,
  Newspaper,
  Radio,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/Button";
import { useApiData } from "@/hooks/useApiData";
import { useDebouncedRefresh } from "@/hooks/useDebouncedRefresh";
import { useLiveSocket } from "@/hooks/useLiveSocket";
import {
  deleteAllNotifications,
  deleteNotification,
  getBinnedNotifications,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/api/notifications";
import { queryKeys } from "@/lib/queryKeys";
import { useSelectedState } from "@/providers/StateProvider";
import type { Notification, NotificationSource } from "@/lib/api/types";

const POLL_MS = 120000;
const BIN_RETENTION_HOURS = 72;

type TabKey = "all" | NotificationSource | "bin";

const TABS: { key: TabKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "email", label: "Email" },
  { key: "operator", label: "Operator" },
  { key: "system", label: "System" },
  { key: "system_failure", label: "System failure" },
  { key: "bin", label: "Bin" },
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

/** "removes in Xh Ym" countdown for a binned item, based on binned_at +
 * the fixed 72h bin retention window - purely a display hint, the
 * actual deletion happens server-side (app/simulator/
 * notification_bin_retention.py) regardless of anyone viewing this. */
function removesIn(binnedAtIso: string) {
  const removalAt = new Date(binnedAtIso).getTime() + BIN_RETENTION_HOURS * 60 * 60 * 1000;
  const remainingMs = removalAt - Date.now();
  if (remainingMs <= 0) return "removing shortly";
  const hours = Math.floor(remainingMs / 3600000);
  const mins = Math.floor((remainingMs % 3600000) / 60000);
  if (hours < 1) return `removes in ${mins}m`;
  return `removes in ${hours}h ${mins}m`;
}

function NotificationCard({
  notification,
  binned,
  onRead,
  onDelete,
}: {
  notification: Notification;
  binned: boolean;
  onRead: () => void;
  onDelete: () => void;
}) {
  const { label, icon: Icon, color } = sourceMeta(notification.source);
  const [marking, setMarking] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  async function handleDelete(e: React.MouseEvent) {
    // This button sits inside the same card as the mark-as-read
    // trigger below - stop the click from bubbling up and marking it
    // read on its way out.
    e.stopPropagation();
    if (deleting) return;
    setDeleting(true);
    try {
      await deleteNotification(notification.id);
      onDelete();
    } catch {
      setDeleting(false);
    }
  }

  return (
    <div
      className={`group relative w-full rounded-2xl border transition ${
        notification.is_read ? "border-border" : "border-primary/40 bg-primary/5"
      } ${deleting ? "opacity-40" : ""}`}
    >
      <button
        type="button"
        onClick={handleRead}
        disabled={deleting}
        className="flex w-full items-start gap-4 rounded-2xl p-5 pr-14 text-left"
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
            {deleting ? " · deleting..." : ""}
            {binned && notification.binned_at ? ` · ${removesIn(notification.binned_at)}` : ""}
          </p>
        </div>
      </button>

      <button
        type="button"
        onClick={handleDelete}
        disabled={deleting}
        title="Delete this notification"
        aria-label="Delete this notification"
        className="absolute right-4 top-5 rounded-xl p-2 text-muted transition hover:bg-red-500/10 hover:text-red-500"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}

export default function NotificationCenter() {
  const [tab, setTab] = useState<TabKey>("all");
  const { selectedState } = useSelectedState();
  const isBinTab = tab === "bin";
  const [deletingAll, setDeletingAll] = useState(false);

  const notifications = useApiData(
    isBinTab ? queryKeys.notificationsBin : queryKeys.notifications,
    (signal) =>
      isBinTab
        ? getBinnedNotifications(signal)
        : getNotifications(tab === "all" ? undefined : tab, false, signal, selectedState ?? undefined),
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

  // ids removed locally (via the per-card delete button or "Delete
  // all") ahead of the next refetch/poll actually confirming it -
  // keeps a just-deleted row from flashing back in until the poll
  // catches up.
  const [removedIds, setRemovedIds] = useState<Set<number>>(new Set());

  const debouncedNotificationsRefresh = useDebouncedRefresh(notifications.refresh);
  const liveSocketHandlers: any = {
    notification: (payload: Notification) => {
      // Freshly-arrived notifications are never binned yet, so they
      // never belong on the Bin tab - only "all"/source tabs pick
      // these up.
      const matchesTab = !isBinTab && (tab === "all" || payload.source === tab);
      const matchesState = !payload.state || !selectedState || payload.state === selectedState;
      if (!matchesTab || !matchesState) return;
      setLiveItems((items) =>
        items.some((n) => n.id === payload.id) ? items : [payload, ...items],
      );
    },
    notification_read: debouncedNotificationsRefresh,
    // A "mark all as read" sweep bins rows out of the Inbox and into
    // the Bin - whichever tab is open right now needs a refresh to
    // reflect that (Inbox loses them, Bin gains them).
    notification_all_read: debouncedNotificationsRefresh,
    // A delete (single or "Delete all") happening in another tab/
    // device should disappear here too, instead of waiting on the
    // next poll.
    notification_deleted: (payload: { id: number }) => {
      setRemovedIds((ids) => (ids.has(payload.id) ? ids : new Set(ids).add(payload.id)));
      debouncedNotificationsRefresh();
    },
    notification_all_deleted: () => {
      setLiveItems([]);
      notifications.refresh();
    },
  };
  useLiveSocket(liveSocketHandlers);

  const items = [
    ...liveItems,
    ...(notifications.data ?? []).filter(
      (n) => !liveItems.some((live) => live.id === n.id),
    ),
  ].filter((n) => !removedIds.has(n.id));

  const unreadCount = items.filter((n) => !n.is_read).length;

  async function handleMarkAll() {
    await markAllNotificationsRead();
    setLiveItems([]);
    notifications.refresh();
  }

  async function handleDeleteAll() {
    if (deletingAll) return;
    setDeletingAll(true);
    try {
      await deleteAllNotifications();
      setLiveItems([]);
      setRemovedIds(new Set());
      notifications.refresh();
    } finally {
      setDeletingAll(false);
    }
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

        <div className="flex flex-wrap items-center gap-2">
          {!isBinTab && unreadCount > 0 && (
            <Button size="sm" variant="outline" onClick={handleMarkAll}>
              <CheckCheck size={14} />
              Mark all as read
            </Button>
          )}

          {items.length > 0 && (
            <Button
              size="sm"
              variant="destructive"
              onClick={handleDeleteAll}
              disabled={deletingAll}
            >
              <Trash2 size={14} />
              {deletingAll ? "Deleting..." : "Delete all"}
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-card p-6">
        {notifications.loading ? (
          <p className="text-sm text-muted">Loading notifications...</p>
        ) : notifications.error ? (
          <p className="text-sm text-red-500">{notifications.error}</p>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-border p-6 text-center">
            {isBinTab ? (
              <>
                <Trash2 className="mx-auto text-muted" size={24} />
                <p className="mt-3 text-sm text-muted">
                  The Bin is empty. Notifications you delete (one at a time,
                  or with &quot;Mark all as read&quot;) land here for 72 hours
                  before they&apos;re removed for good.
                </p>
              </>
            ) : (
              <>
                <Bell className="mx-auto text-muted" size={24} />
                <p className="mt-3 text-sm text-muted">
                  No notifications from the last 7 days.
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((n) => (
              <NotificationCard
                key={n.id}
                notification={n}
                binned={isBinTab}
                onRead={() => {
                  setLiveItems((cur) =>
                    cur.map((item) =>
                      item.id === n.id ? { ...item, is_read: true } : item,
                    ),
                  );
                  notifications.refresh();
                }}
                onDelete={() => {
                  setRemovedIds((ids) => new Set(ids).add(n.id));
                  setLiveItems((cur) => cur.filter((item) => item.id !== n.id));
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