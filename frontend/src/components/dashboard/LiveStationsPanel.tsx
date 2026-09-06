"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, MapPin, Radio, TrainFront, Users } from "lucide-react";

import { useApiData } from "@/hooks/useApiData";
import { useLiveSocket } from "@/hooks/useLiveSocket";
import { useLiveSocketContext } from "@/providers/LiveSocketProvider";
import { useStations } from "@/hooks/useStations";
import { getCrowdDashboard } from "@/lib/api/crowd";
import { useSelectedState } from "@/providers/StateProvider";
import { useFocusedStation } from "@/providers/FocusedStationProvider";
import { queryKeys } from "@/lib/queryKeys";
import LiveStatusBadge from "@/components/dashboard/LiveStatusBadge";
import StationLiveDetailModal from "@/components/dashboard/StationLiveDetailModal";
import type { CrowdLevel, Station } from "@/lib/api/types";

const LEVEL_STYLES: Record<CrowdLevel, { dot: string; text: string; bg: string; label: string }> = {
  low: { dot: "bg-emerald-500", text: "text-emerald-500", bg: "bg-emerald-500/10", label: "Low" },
  moderate: { dot: "bg-yellow-400", text: "text-yellow-500", bg: "bg-yellow-400/10", label: "Moderate" },
  high: { dot: "bg-orange-500", text: "text-orange-500", bg: "bg-orange-500/10", label: "High" },
  critical: { dot: "bg-red-500", text: "text-red-500", bg: "bg-red-500/10", label: "Critical" },
};

function secondsSince(iso: string | null) {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return null;
  return Math.max(0, Math.floor((Date.now() - then) / 1000));
}

const LastUpdated = memo(function LastUpdated({ lastUpdated }: { lastUpdated: string | null }) {
  const [, forceTick] = useState(0);

  useEffect(() => {
    if (!lastUpdated) return;
    const id = setInterval(() => forceTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [lastUpdated]);

  const secsAgo = secondsSince(lastUpdated);

  return (
    <span>
      {secsAgo === null ? "no data yet" : secsAgo <= 1 ? "updated just now" : `updated ${secsAgo}s ago`}
    </span>
  );
});

interface StationCardProps {
  station: Station;
  count: number;
  level: CrowdLevel;
  capacity: number;
  lastUpdated: string | null;
  connected: boolean;
  onOpen: (station: Station) => void;
}

const StationCard = memo(function StationCard({
  station,
  count,
  level,
  capacity,
  lastUpdated,
  connected,
  onOpen,
}: StationCardProps) {
  const style = LEVEL_STYLES[level] ?? LEVEL_STYLES.low;
  const occupancy = capacity > 0 ? Math.min(100, Math.round((count / capacity) * 100)) : 0;

  return (
    <button
      type="button"
      onClick={() => onOpen(station)}
      className="
      group relative overflow-hidden rounded-2xl border border-border
      bg-background p-5 text-left transition-all duration-200
      hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl
      "
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate font-bold">{station.station_name}</h3>
          <p className="mt-1 flex items-center gap-1 text-xs text-muted">
            <MapPin size={12} />
            {station.city}
            {station.line_name && (
              <span
                className="ml-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5"
                style={{
                  background: `${station.line_color ?? "#3b82f6"}22`,
                  color: station.line_color ?? "#3b82f6",
                }}
              >
                {station.line_name}
              </span>
            )}
          </p>
        </div>

        <span className={`relative flex h-3 w-3 shrink-0 ${connected ? "" : "opacity-40"}`}>
          {connected && (
            <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${style.dot}`} />
          )}
          <span className={`relative inline-flex h-3 w-3 rounded-full ${style.dot}`} />
        </span>
      </div>

      <div className="mt-5 flex items-end justify-between">
        <div>
          <p className="flex items-center gap-1.5 text-xs text-muted">
            <Users size={12} />
            Passengers now
          </p>
          <p className="mt-1 text-2xl font-black">{count.toLocaleString()}</p>
        </div>

        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${style.bg} ${style.text}`}>
          {style.label} · {occupancy}%
        </span>
      </div>

      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-border">
        <div
          className={`h-full rounded-full ${style.dot} transition-all duration-700`}
          style={{ width: `${occupancy}%` }}
        />
      </div>

      <div className="mt-4 flex items-center justify-between text-[11px] text-muted">
        <span className="flex items-center gap-1">
          <TrainFront size={12} />
          Tap for live view
        </span>
        <LastUpdated lastUpdated={lastUpdated} />
      </div>
    </button>
  );
});

export default function LiveStationsPanel() {
  const { selectedState } = useSelectedState();
  const { data: stations, loading: stationsLoading } = useStations();
  const { setFocusedStation, setLiveLocationOn } = useFocusedStation();
  const { isConnected } = useLiveSocketContext();

  const { data: crowd } = useApiData(
    queryKeys.crowdDashboard,
    (signal) => getCrowdDashboard(selectedState ?? undefined, signal),
    [selectedState],
    isConnected ? 0 : 30000,
  );

  const [liveById, setLiveById] = useState<
    Record<number, { current_count: number; crowd_level: CrowdLevel; at: string }>
  >({});
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const validIds = new Set((crowd ?? []).map((c) => c.station_id));
    setLiveById((prev) => {
      let changed = false;
      const next: typeof prev = {};
      for (const [idStr, entry] of Object.entries(prev)) {
        if (validIds.has(Number(idStr))) {
          next[Number(idStr)] = entry;
        } else {
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [crowd]);

  useLiveSocket({
    crowd_update: (payload) => {
      setConnected(true);
      
      setLiveById((prev) => {
        let changed = false;
        const next = { ...prev };
        for (const u of payload.updates) {
          const existing = prev[u.station_id];
          if (
            existing &&
            existing.current_count === u.current_count &&
            existing.crowd_level === u.crowd_level
          ) {
            continue;
          }
          changed = true;
          next[u.station_id] = {
            current_count: u.current_count,
            crowd_level: u.crowd_level as CrowdLevel,
            at: payload.timestamp,
          };
        }
        return changed ? next : prev;
      });
    },
  });

  const crowdById = useMemo(() => {
    const map = new Map<number, { current_count: number; crowd_level: CrowdLevel; capacity: number; last_updated: string | null }>();
    for (const c of crowd ?? []) {
      map.set(c.station_id, {
        current_count: c.current_count,
        crowd_level: c.crowd_level,
        capacity: c.capacity,
        last_updated: c.last_updated,
      });
    }
    return map;
  }, [crowd]);

  const cards = useMemo(() => {
    return (stations ?? []).map((s) => {
      const base = crowdById.get(s.id);
      const live = liveById[s.id];
      return {
        station: s,
        count: live?.current_count ?? base?.current_count ?? 0,
        level: (live?.crowd_level ?? base?.crowd_level ?? "low") as CrowdLevel,
        capacity: base?.capacity ?? s.capacity,
        lastUpdated: live?.at ?? base?.last_updated ?? null,
      };
    });
  }, [stations, crowdById, liveById]);

  // Grid defaults to a compact 8-up preview - "Show All" expands the
  // full station list in place, and "Show Less" collapses it back
  // instead of always rendering all 50+ stations up front.
  const DEFAULT_VISIBLE_STATIONS = 8;
  const [showAllStations, setShowAllStations] = useState(false);
  const canExpandStations = cards.length > DEFAULT_VISIBLE_STATIONS;
  const visibleCards = showAllStations
    ? cards
    : cards.slice(0, DEFAULT_VISIBLE_STATIONS);

  useEffect(() => {
    setShowAllStations(false);
  }, [selectedState]);

  const [selected, setSelected] = useState<Station | null>(null);

  const openStation = useCallback(
    (station: Station) => {
      setSelected(station);
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
      setLiveLocationOn(true);
    },
    [setFocusedStation, setLiveLocationOn],
  );

  function closeModal() {
    setSelected(null);
    setFocusedStation(null);
  }

  return (
    <section className="rounded-3xl border border-border bg-card p-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Live Stations</h2>
          <p className="mt-2 text-muted">
            Click any station for its full live view - crowd heat map, live
            train tracking and passenger analytics, all in one place.
            {cards.length > 0 && ` ${cards.length} stations tracked.`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <LiveStatusBadge />
          <div className="rounded-xl bg-primary/10 p-3">
            <Radio className="text-primary" size={28} />
          </div>
        </div>
      </div>

      {stationsLoading ? (
        <p className="text-sm text-muted">Loading stations...</p>
      ) : cards.length === 0 ? (
        <p className="text-sm text-muted">
          No stations for {selectedState ?? "this selection"} yet.
        </p>
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visibleCards.map(({ station, count, level, capacity, lastUpdated }) => (
              <StationCard
                key={station.id}
                station={station}
                count={count}
                level={level}
                capacity={capacity}
                lastUpdated={lastUpdated}
                connected={connected}
                onOpen={openStation}
              />
            ))}
          </div>

          {canExpandStations && (
            <button
              type="button"
              onClick={() => setShowAllStations((prev) => !prev)}
              aria-expanded={showAllStations}
              className="
              mt-6
              flex
              w-full
              items-center
              justify-center
              gap-2
              rounded-2xl
              border
              border-border
              bg-background
              py-3
              text-sm
              font-semibold
              text-primary
              transition-all
              duration-200
              hover:border-primary/40
              hover:bg-primary/5
              "
            >
              {showAllStations ? (
                <>
                  Show Less
                  <ChevronUp size={16} />
                </>
              ) : (
                <>
                  Show All Stations ({cards.length})
                  <ChevronDown size={16} />
                </>
              )}
            </button>
          )}
        </>
      )}

      {selected && <StationLiveDetailModal station={selected} onClose={closeModal} />}
    </section>
  );
}