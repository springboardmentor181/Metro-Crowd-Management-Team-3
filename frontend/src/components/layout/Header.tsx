
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Search,
  UserCircle2,
  PanelLeft,
  X,
} from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import StateSelector from "./StateSelector";
import { useAuth } from "@/providers/AuthProvider";
import { useApiData } from "@/hooks/useApiData";
import { getStations } from "@/lib/api/stations";
import { queryKeys } from "@/lib/queryKeys";
import { useFocusedStation } from "@/providers/FocusedStationProvider";
import { useSelectedState } from "@/providers/StateProvider";
import LiveStatusBadge from "@/components/dashboard/LiveStatusBadge";
import { getUnreadCount } from "@/lib/api/notifications";
import { useLiveSocket } from "@/hooks/useLiveSocket";

interface HeaderProps {
  title?: string;
  description?: string;
  onMenuClick?: () => void;
}

export default function Header({
  title = "Dashboard",
  description = "Welcome back to MetroFlow AI",
  onMenuClick,
}: HeaderProps) {
  const pathname = usePathname();
  const { profile } = useAuth();
  const { setSelectedState, selectedState } = useSelectedState();
  const { focusedStation, setFocusedStation } = useFocusedStation();

  const { data: allStations } = useApiData(
    queryKeys.stations,
    (signal) => getStations(undefined, undefined, signal),
    [],
  );
  const [query, setQuery] = useState("");

  // Slow fallback poll - the live socket subscription below normally
  // keeps the badge current instantly, this just re-syncs periodically
  // in case an event was missed (e.g. connection was down).
  const { data: unreadData } = useApiData(
    queryKeys.notificationsUnreadCount,
    (signal) => getUnreadCount(signal, selectedState ?? undefined),
    [selectedState],
    120000,
  );

  // Track live deltas on top of the last poll result, reset whenever
  // a fresh poll result comes in (adjusting state in response to a
  // prop/data change during render, not inside an effect - see
  // https://react.dev/learn/you-might-not-need-an-effect).
  const [prevUnreadData, setPrevUnreadData] = useState(unreadData);
  const [liveDelta, setLiveDelta] = useState(0);
  if (unreadData !== prevUnreadData) {
    setPrevUnreadData(unreadData);
    setLiveDelta(0);
  }
  const unreadCount = Math.max(0, (unreadData?.unread ?? 0) + liveDelta);

  useLiveSocket({
    notification: (payload) => {
      const matchesState = !payload.state || !selectedState || payload.state === selectedState;
      if (matchesState) setLiveDelta((d) => d + 1);
    },
    notification_read: () => setLiveDelta((d) => d - 1),
    notification_all_read: () => setLiveDelta(-(unreadData?.unread ?? 0)),
  });

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return (allStations ?? [])
      .filter((s) => s.station_name.toLowerCase().includes(q))
      .slice(0, 8);
  }, [allStations, query]);

  function pickStation(station: NonNullable<typeof allStations>[number]) {
    setFocusedStation({
      id: station.id,
      name: station.station_name,
      city: station.city,
      latitude: station.latitude,
      longitude: station.longitude,
      line_name: station.line_name,
      line_color: station.line_color,
      station_order: station.station_order,
    });
    setSelectedState(station.city);
    setQuery("");
  }

  const userName = profile?.full_name ?? "Metro User";
  const role = profile?.role ?? "passenger";

  const pageName = pathname
    .split("/")
    .filter(Boolean)
    .pop()
    ?.replace("-", " ");

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-xl">

      <div className="flex min-h-20 items-center justify-between gap-5 px-4 py-3 sm:px-6 lg:px-8">

        <div className="flex items-center gap-5">

          <button
            onClick={onMenuClick}
            className="rounded-xl border border-border p-2 transition hover:bg-muted lg:hidden"
          >
            <PanelLeft size={22} />
          </button>

          <div>

            <h1 className="text-2xl font-black capitalize tracking-tight sm:text-3xl">

              {pageName || title}

            </h1>

            <p className="mt-1 text-sm text-muted">

              {description}

            </p>

          </div>

        </div>

        <div className="relative hidden w-full max-w-sm xl:block">

          {focusedStation ? (
            <div className="flex h-12 items-center justify-between rounded-2xl border border-primary/40 bg-primary/10 px-4 text-sm font-semibold">
              <span className="truncate">
                Focused: {focusedStation.name}
              </span>
              <button
                type="button"
                onClick={() => setFocusedStation(null)}
                title="Clear focus - show every station again"
                className="ml-2 shrink-0 text-muted hover:text-foreground"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <div className="flex items-center rounded-2xl border border-border bg-card px-4">

              <Search
                size={18}
                className="text-muted"
              />

              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search your station..."
                className="h-12 w-full bg-transparent px-3 text-sm outline-none"
              />

            </div>
          )}

          {matches.length > 0 && (
            <ul className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
              {matches.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => pickStation(s)}
                    className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-muted"
                  >
                    <span className="font-medium">{s.station_name}</span>
                    <span className="text-xs text-muted">{s.city}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}

        </div>

        <div className="flex items-center gap-4">

          {

}
          <div className="hidden sm:block">
            <LiveStatusBadge />
          </div>

          <StateSelector />

          <ThemeToggle />

          <Link
            href="/notifications"
            className="relative rounded-2xl border border-border p-3 transition hover:bg-muted"
          >

            <Bell size={20} />

            {unreadCount > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}

          </Link>

          <Link
            href="/profile"
            className="flex items-center gap-3 rounded-2xl border border-border bg-card px-3 py-2 transition hover:border-primary"
          >

            <UserCircle2
              size={40}
              className="text-primary"
            />

            <div className="hidden text-left xl:block">

              <h4 className="font-bold">

                {userName}

              </h4>

              <p className="text-xs text-muted">

                {role}

              </p>

            </div>

          </Link>

        </div>

      </div>

    </header>
  );
}
