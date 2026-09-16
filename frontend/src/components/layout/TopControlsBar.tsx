"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bell, UserCircle2 } from "lucide-react";

import ThemeToggle from "./ThemeToggle";
import StateSelector from "./StateSelector";
import LiveStatusBadge from "@/components/dashboard/LiveStatusBadge";
import { useAuth } from "@/providers/AuthProvider";
import { useApiData } from "@/hooks/useApiData";
import { getUnreadCount } from "@/lib/api/notifications";
import { queryKeys } from "@/lib/queryKeys";
import { useSelectedState } from "@/providers/StateProvider";
import { useLiveSocket } from "@/hooks/useLiveSocket";

/**
 * The "location + theme + notifications + profile" cluster shown in the
 * main Header. Pulled out into its own component so the exact same live
 * bar (with a correctly-uncapped notification count) can also be dropped
 * into the station-detail block on the Crowd Heat Map.
 */
export default function TopControlsBar({
  showLiveStatus = true,
}: {
  showLiveStatus?: boolean;
} = {}) {
  const { profile } = useAuth();
  const { selectedState } = useSelectedState();

  // Slow fallback poll - the live socket subscription below normally keeps
  // the badge current instantly, this just re-syncs periodically in case an
  // event was missed (e.g. connection was down).
  const { data: unreadData } = useApiData(
    queryKeys.notificationsUnreadCount,
    (signal) => getUnreadCount(signal, selectedState ?? undefined),
    [selectedState],
    120000,
  );

  // Single source of truth for the badge count. Starts at 0, synced from
  // the poll whenever fresh data arrives, and otherwise updated directly
  // by live socket events - no derived math against a possibly-stale
  // closure, so "mark all read" always lands on exactly 0 instead of
  // silently no-op'ing.
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (unreadData) setUnreadCount(unreadData.unread);
  }, [unreadData]);

  useLiveSocket({
    notification: (payload) => {
      const matchesState = !payload.state || !selectedState || payload.state === selectedState;
      if (matchesState) setUnreadCount((c) => c + 1);
    },
    notification_read: () => setUnreadCount((c) => Math.max(0, c - 1)),
    notification_all_read: () => setUnreadCount(0),
  });

  const userName = profile?.full_name ?? "Metro User";
  const role = profile?.role ?? "passenger";

  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3 lg:gap-4">
      {showLiveStatus && (
        <div className="hidden sm:block">
          <LiveStatusBadge />
        </div>
      )}

      <StateSelector />

      <ThemeToggle />

      <Link
        href="/notifications"
        className="relative shrink-0 rounded-xl border border-border p-2 transition hover:bg-muted sm:rounded-2xl sm:p-3"
      >
        <Bell size={20} />

        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
            {unreadCount}
          </span>
        )}
      </Link>

      <Link
        href="/profile"
        className="flex shrink-0 items-center gap-3 rounded-xl border border-border bg-card px-2.5 py-1.5 transition hover:border-primary sm:rounded-2xl sm:px-3 sm:py-2"
      >
        <UserCircle2 size={40} className="text-primary" />

        <div className="hidden text-left xl:block">
          <h4 className="font-bold">{userName}</h4>
          <p className="text-xs text-muted">{role}</p>
        </div>
      </Link>
    </div>
  );
}