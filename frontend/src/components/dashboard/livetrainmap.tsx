"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  TrainFront,
  Circle,
  RadioTower,
  BrainCircuit,
  Gauge,
  Milestone,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

import { useStations } from "@/hooks/useStations";
import { useGetLiveTrainPositionsQuery, useGetTrainRoutesQuery } from "@/store/apiSlice";
import { useLiveSocket, type TrainPositionPayload } from "@/hooks/useLiveSocket";
import { useFullscreen } from "@/hooks/useFullscreen";
import { useStationRoute } from "@/hooks/useStationRoute";
import MapFullscreenToggle from "@/components/dashboard/MapFullscreenToggle";
import LiveLocationPanel from "@/components/dashboard/LiveLocationPanel";
import LiveStatusBadge from "@/components/dashboard/LiveStatusBadge";
import { buildLineSegments } from "@/lib/mapLines";
import { etaToStationSeconds, formatEtaMinutes, stationsAwayToStation } from "@/lib/eta";
import { useSelectedState } from "@/providers/StateProvider";
import { useFocusedStation } from "@/providers/FocusedStationProvider";
import type { LiveTrainPosition, Station } from "@/lib/api/types";

const LIVE_TRAIN_SNAPSHOT_POLL_MS = 30000;

const TRAIN_GLIDE_SECONDS = Math.max(
  1,
  Number(process.env.NEXT_PUBLIC_TRAIN_TRACK_INTERVAL_SECONDS ?? 5) - 0.5,
);

function projectStations(stations: Station[]) {
  const valid = stations.filter(
    (s) =>
      Number.isFinite(s.latitude) &&
      Number.isFinite(s.longitude) &&
      !(s.latitude === 0 && s.longitude === 0),
  );
  if (valid.length === 0) return [];
  const lats = valid.map((s) => s.latitude);
  const lngs = valid.map((s) => s.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const latRange = maxLat - minLat || 1;
  const lngRange = maxLng - minLng || 1;

  return valid.map((s) => ({
    ...s,
    x: ((s.longitude - minLng) / lngRange) * 80 + 10,
    y: ((maxLat - s.latitude) / latRange) * 80 + 10,
  }));
}

interface Props {
  onlyTrainId?: number;
}

const TrainMarker = memo(function TrainMarker({
  x,
  y,
  status,
  trainNumber,
  glideSeconds,
}: {
  x: number;
  y: number;
  status: string;
  trainNumber: string;
  glideSeconds: number;
}) {
  const isDelayed = status === "Delayed";
  return (
    <motion.div
      className="absolute -translate-x-1/2 -translate-y-1/2"
      animate={{ left: `${x}%`, top: `${y}%` }}
      transition={{ duration: glideSeconds, ease: "linear" }}
    >
      <div className="flex flex-col items-center">
        <div
          className={`rounded-full p-3 ${isDelayed ? "bg-orange-500" : "bg-blue-600"}`}
        >
          <TrainFront size={22} className="text-white" />
        </div>

        <span
          className={`mt-1.5 whitespace-nowrap rounded-md px-2 py-0.5 text-[11px] font-bold text-white shadow ${
            isDelayed ? "bg-orange-600" : "bg-blue-600"
          }`}
        >
          {trainNumber}
        </span>
      </div>
    </motion.div>
  );
});

const StationMarker = memo(function StationMarker({
  id,
  x,
  y,
  name,
  isFocused,
  showLabel,
  connected,
  onHoverStart,
  onHoverEnd,
}: {
  id: number;
  x: number;
  y: number;
  name: string;
  isFocused: boolean;
  showLabel: boolean;
  connected: boolean;
  onHoverStart: (id: number) => void;
  onHoverEnd: (id: number) => void;
}) {
  return (
    <div
      className="absolute"
      style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%,-50%)" }}
      onPointerEnter={() => onHoverStart(id)}
      onPointerLeave={() => onHoverEnd(id)}
    >
      <div className="relative flex h-5 w-5 items-center justify-center">
        {connected && (
          <span
            className={`absolute h-full w-full animate-ping rounded-full opacity-60 ${
              isFocused ? "bg-orange-400" : "bg-green-400"
            }`}
          />
        )}
        <div
          className={`relative h-5 w-5 rounded-full border-4 border-white ${
            isFocused ? "bg-orange-500" : "bg-green-500"
          }`}
        />
      </div>

      {showLabel && (
        <p
          className={`mt-3 whitespace-nowrap rounded px-1.5 py-0.5 text-xs font-semibold text-white ${
            isFocused ? "bg-orange-600" : "bg-black/70"
          }`}
        >
          {name}
        </p>
      )}
    </div>
  );
});

interface TrainSummary {
  id: number;
  trainNumber: string;
  status: string;
  currentStation: string;
  nextStation: string;
  delayMinutes: number;
  etaSeconds: number | null;
  etaToFocusedStationSeconds: number | null;
  stationsAwayFromFocused: number | null;
  servesFocusedStation: boolean;
}

const TrainSummaryCard = memo(function TrainSummaryCard({
  train,
  focusedStationName,
}: {
  train: TrainSummary;
  focusedStationName: string | null;
}) {
  return (
    <div className="rounded-2xl border border-border bg-background p-6">
      <div className="flex justify-between">
        <div>
          <h3 className="font-bold">{train.trainNumber}</h3>
          <p className="mt-2 text-muted">Now near: {train.currentStation}</p>
          <p className="mt-1 text-muted">Next: {train.nextStation}</p>
        </div>

        <Circle
          size={14}
          className={`fill-current ${train.status === "Delayed" ? "text-orange-500" : "text-green-500"}`}
        />
      </div>

      <div className="mt-6 space-y-4">
        <div className="flex justify-between">
          <span className="text-muted">Status</span>
          <strong>{train.status}</strong>
        </div>

        <div className="flex justify-between">
          <span className="text-muted">Delay</span>
          <strong>{train.delayMinutes > 0 ? `${train.delayMinutes} min` : "On time"}</strong>
        </div>

        <div className="flex justify-between">
          <span className="text-muted">Arriving at {train.nextStation}</span>
          <strong>{formatEtaMinutes(train.etaSeconds) || "—"}</strong>
        </div>

        {focusedStationName && (
          <div className="flex justify-between border-t border-border pt-4">
            <span className="text-muted">Stations away from {focusedStationName}</span>
            <strong className={train.servesFocusedStation ? "text-primary" : "text-muted"}>
              {train.servesFocusedStation && train.stationsAwayFromFocused !== null
                ? train.stationsAwayFromFocused
                : "—"}
            </strong>
          </div>
        )}

        {focusedStationName && (
          <div className="flex justify-between">
            <span className="text-muted">ETA to {focusedStationName}</span>
            <strong className={train.servesFocusedStation ? "text-primary" : "text-muted"}>
              {train.servesFocusedStation
                ? formatEtaMinutes(train.etaToFocusedStationSeconds) || "Calculating..."
                : "Not on this route"}
            </strong>
          </div>
        )}
      </div>
    </div>
  );
});

function LiveTrainMap({ onlyTrainId }: Props = {}) {
  const { selectedState } = useSelectedState();
  const { data: stationsData } = useStations();
  const { focusedStation, liveLocationOn } = useFocusedStation();

  const [liveById, setLiveById] = useState<Record<number, LiveTrainPosition>>({});
  const [everReceivedLive, setEverReceivedLive] = useState(false);

  const handleTrainPosition = useCallback((payload: TrainPositionPayload) => {
    setEverReceivedLive(true);
    setLiveById((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const u of payload.updates) {
        const existing = prev[u.train_id];
        if (
          existing &&
          existing.progress_ratio === u.progress_ratio &&
          existing.status === u.status &&
          existing.delay_minutes === u.delay_minutes &&
          existing.eta_seconds === u.eta_seconds &&
          existing.from_station_id === u.from_station_id &&
          existing.to_station_id === u.to_station_id
        ) {
          continue;
        }
        changed = true;
        next[u.train_id] = {
          train_id: u.train_id,
          train_number: u.train_number,
          from_station_id: u.from_station_id,
          from_station_name: u.from_station_name,
          to_station_id: u.to_station_id,
          to_station_name: u.to_station_name,
          progress_ratio: u.progress_ratio,
          delay_minutes: u.delay_minutes,
          status: u.status,
          eta_seconds: u.eta_seconds,
          segment_duration_seconds: u.segment_duration_seconds,
          direction: u.direction,
        };
      }
      return changed ? next : prev;
    });
  }, []);

  const { isConnected: socketConnected } = useLiveSocket({
    train_position: handleTrainPosition,
  });

  const connected = everReceivedLive && socketConnected;

  const initialQuery = useGetLiveTrainPositionsQuery(selectedState ?? undefined, {
    pollingInterval: socketConnected ? 0 : LIVE_TRAIN_SNAPSHOT_POLL_MS,
  });
  const initial = { data: initialQuery.data, loading: initialQuery.isLoading };

  const { data: routesData } = useGetTrainRoutesQuery(selectedState ?? undefined);
  const routesByTrainId = useMemo(() => {
    const map = new Map<number, { station_ids: number[]; segment_seconds: number[] }>();
    for (const r of routesData ?? []) {
      map.set(r.train_id, { station_ids: r.station_ids, segment_seconds: r.segment_seconds });
    }
    return map;
  }, [routesData]);

  useEffect(() => {
    const validIds = new Set((initial.data ?? []).map((p) => p.train_id));
    setLiveById((prev) => {
      let changed = false;
      const next: Record<number, LiveTrainPosition> = {};
      for (const [idStr, pos] of Object.entries(prev)) {
        if (validIds.has(Number(idStr))) {
          next[Number(idStr)] = pos;
        } else {
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [initial.data]);

  const positions = useMemo<LiveTrainPosition[]>(() => {
    const byId = new Map<number, LiveTrainPosition>();
    for (const p of initial.data ?? []) byId.set(p.train_id, p);
    for (const p of Object.values(liveById)) byId.set(p.train_id, p);
    const all = Array.from(byId.values());
    return onlyTrainId ? all.filter((p) => p.train_id === onlyTrainId) : all;
  }, [initial.data, liveById, onlyTrainId]);

  const { routeStations, lineName } = useStationRoute(
    stationsData,
    focusedStation,
    liveLocationOn,
  );

  // When we're scoped to a single train (onlyTrainId), the train's own
  // route - the same station_ids used for its ETA/position math - is the
  // authoritative path. It doesn't depend on any one station's line_name
  // being populated, so it stays correct for every train, not just ones
  // whose focused station happens to carry valid line metadata.
  const trainRoute = onlyTrainId ? routesByTrainId.get(onlyTrainId) : undefined;
  const scopedToTrainRoute = Boolean(onlyTrainId && trainRoute && trainRoute.station_ids.length > 0);

  const stationsForMap = useMemo(() => {
    if (scopedToTrainRoute && trainRoute) {
      const byId = new Map((stationsData ?? []).map((s) => [s.id, s]));
      return trainRoute.station_ids
        .map((id) => byId.get(id))
        .filter((s): s is Station => Boolean(s));
    }
    return liveLocationOn && lineName ? routeStations : stationsData ?? [];
  }, [scopedToTrainRoute, trainRoute, stationsData, liveLocationOn, lineName, routeStations]);

  const positioned = useMemo(
    () => projectStations(stationsForMap),
    [stationsForMap],
  );

  const lineSegments = useMemo(() => buildLineSegments(positioned), [positioned]);

  const routeStationIds = useMemo(
    () => new Set(routeStations.map((s) => s.id)),
    [routeStations],
  );

  const { ref: fullscreenRef, isFullscreen, toggleFullscreen } = useFullscreen<HTMLDivElement>();
  const showAllLabels = positioned.length <= 20;
  const [hoveredStationId, setHoveredStationId] = useState<number | null>(null);
  const handleStationHoverStart = useCallback((id: number) => setHoveredStationId(id), []);
  const handleStationHoverEnd = useCallback(
    (id: number) => setHoveredStationId((current) => (current === id ? null : current)),
    [],
  );

  const DEFAULT_VISIBLE_TRAINS = 6;

  const allTrainMarkersRaw = useMemo(() => {
    const stationById = new Map(positioned.map((s) => [s.id, s]));

    return positions.map((pos) => {
      const from = stationById.get(pos.from_station_id);
      const to = stationById.get(pos.to_station_id) ?? from;

      const x = from && to ? from.x + (to.x - from.x) * pos.progress_ratio : 50;
      const y = from && to ? from.y + (to.y - from.y) * pos.progress_ratio : 50;

      const route = routesByTrainId.get(pos.train_id);

      let derivedDirection = pos.direction;
      if (route) {
        const fromIdx = route.station_ids.indexOf(pos.from_station_id);
        const toIdx = route.station_ids.indexOf(pos.to_station_id);
        if (fromIdx !== -1 && toIdx !== -1 && fromIdx !== toIdx) {
          derivedDirection = toIdx > fromIdx ? 1 : -1;
        }
      }

      const etaToFocused =
        focusedStation && route
          ? etaToStationSeconds({
              stationIds: route.station_ids,
              segmentSeconds: route.segment_seconds,
              fromStationId: pos.from_station_id,
              toStationId: pos.to_station_id,
              direction: derivedDirection,
              remainingCurrentSegmentSeconds: pos.eta_seconds,
              delayMinutes: pos.delay_minutes,
              targetStationId: focusedStation.id,
            })
          : null;
      const stationsAway =
        focusedStation && route
          ? stationsAwayToStation({
              stationIds: route.station_ids,
              fromStationId: pos.from_station_id,
              direction: derivedDirection,
              targetStationId: focusedStation.id,
            })
          : null;

      return {
        id: pos.train_id,
        trainNumber: pos.train_number,
        status: pos.status,
        currentStation: pos.from_station_name ?? "Unknown",
        nextStation: pos.to_station_name ?? "Unknown",
        onRoute:
          onlyTrainId
            ? true
            : liveLocationOn
              ? routeStationIds.has(pos.from_station_id) || routeStationIds.has(pos.to_station_id)
              : true,
        x,
        y,
        delayMinutes: pos.delay_minutes,
        etaSeconds: pos.eta_seconds,
        etaToFocusedStationSeconds: etaToFocused,
        stationsAwayFromFocused: stationsAway,
        servesFocusedStation: focusedStation
          ? (route?.station_ids ?? []).includes(focusedStation.id)
          : false,
      };
    });
  }, [positions, positioned, liveLocationOn, routeStationIds, routesByTrainId, focusedStation, onlyTrainId]);

  const allTrainMarkers = useMemo(
    () => (liveLocationOn ? allTrainMarkersRaw.filter((t) => t.onRoute) : allTrainMarkersRaw),
    [allTrainMarkersRaw, liveLocationOn],
  );

  const focusedRelevantMarkers = useMemo(
    () => (focusedStation ? allTrainMarkers.filter((t) => t.servesFocusedStation) : allTrainMarkers),
    [allTrainMarkers, focusedStation],
  );

  const trainSummaries = useMemo(
    () =>
      [...focusedRelevantMarkers].sort((a, b) => {
        if (focusedStation) {
          const aEta = a.etaToFocusedStationSeconds;
          const bEta = b.etaToFocusedStationSeconds;
          if (aEta === null && bEta === null) return b.delayMinutes - a.delayMinutes;
          if (aEta === null) return 1;
          if (bEta === null) return -1;
          return aEta - bEta;
        }
        return b.delayMinutes - a.delayMinutes;
      }),
    [focusedRelevantMarkers, focusedStation],
  );

  // Cards default to a compact preview - "View All Active Trains"
  // expands the full sorted list in place, and collapses back on
  // request instead of always dumping every tracked train on screen.
  const [showAllTrains, setShowAllTrains] = useState(false);

  useEffect(() => {
    setShowAllTrains(false);
  }, [focusedStation?.id, onlyTrainId]);

  const canExpandTrains = trainSummaries.length > DEFAULT_VISIBLE_TRAINS;
  const visibleTrainSummaries = showAllTrains
    ? trainSummaries
    : trainSummaries.slice(0, DEFAULT_VISIBLE_TRAINS);

  const delayedTrain = trainSummaries.find((t) => t.status === "Delayed");

  return (
    <section className="rounded-3xl border border-border bg-card p-8">

      <div className="mb-8 flex items-center justify-between">

        <div>

          <h2 className="text-3xl font-bold">
            Live Train Tracking
          </h2>

          <p className="mt-2 text-muted">
            {onlyTrainId
              ? "Just this train's live position - updates automatically, no refresh needed."
              : liveLocationOn && lineName
                ? `Tracking your real track on ${lineName} - positions update automatically, no refresh needed.`
                : connected
                  ? "Positions update automatically every few seconds - no refresh needed."
                  : "Station layout is live from real coordinates; connecting to live position feed..."}
          </p>

        </div>

        <div className="flex gap-3">

          <LiveStatusBadge />

          <div className="rounded-xl bg-primary/10 p-3">
            <RadioTower
              className="text-primary"
              size={24}
            />
          </div>

          <div className="rounded-xl bg-violet-500/10 p-3">
            <BrainCircuit
              className="text-violet-500"
              size={24}
            />
          </div>

        </div>

      </div>

      {stationsData && stationsData.length > 0 && positioned.length === 0 && (
        <p className="mb-6 rounded-xl bg-orange-500/10 p-3 text-sm text-orange-500">
          {stationsData.length} station{stationsData.length === 1 ? "" : "s"}{" "}
          found, but none has valid map coordinates (latitude/longitude
          missing or 0,0) - check the seeded station data.
        </p>
      )}

      <div className="grid gap-8 xl:grid-cols-3">

        <div className="xl:col-span-2">

          <div
            ref={fullscreenRef}
            className={
              isFullscreen
                ? "relative h-screen w-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-black"
                : "relative h-[620px] overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-slate-950 via-slate-900 to-black"
            }
          >

            <MapFullscreenToggle isFullscreen={isFullscreen} onToggle={toggleFullscreen} />

            <div className="absolute inset-0 select-none">

              <svg
                className="absolute inset-0 h-full w-full overflow-visible"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                {lineSegments.map((seg) => (
                  <polyline
                    key={seg.key}
                    points={seg.points}
                    fill="none"
                    stroke={seg.color}
                    strokeWidth={0.6}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={0.85}
                    vectorEffect="non-scaling-stroke"
                  />
                ))}
              </svg>

              {positioned.map((station) => {
                const showLabel = showAllLabels || hoveredStationId === station.id;
                const isFocused = focusedStation?.id === station.id;
                return (
                  <StationMarker
                    key={station.id}
                    id={station.id}
                    x={station.x}
                    y={station.y}
                    name={station.station_name}
                    isFocused={isFocused}
                    showLabel={showLabel}
                    connected={connected}
                    onHoverStart={handleStationHoverStart}
                    onHoverEnd={handleStationHoverEnd}
                  />
                );
              })}

              {allTrainMarkers.map((train) => (
                <TrainMarker
                  key={train.id}
                  x={train.x}
                  y={train.y}
                  status={train.status}
                  trainNumber={train.trainNumber}
                  glideSeconds={TRAIN_GLIDE_SECONDS}
                />
              ))}

            </div>

            {scopedToTrainRoute ? (
              <p className="pointer-events-none absolute left-4 top-4 z-10 flex items-center gap-1.5 rounded-lg bg-black/60 px-3 py-1.5 text-xs text-white/70">
                <Milestone size={12} />
                This train&apos;s route: {positioned.length} stations
              </p>
            ) : liveLocationOn && lineName ? (
              <p className="pointer-events-none absolute left-4 top-4 z-10 flex items-center gap-1.5 rounded-lg bg-black/60 px-3 py-1.5 text-xs text-white/70">
                <Milestone size={12} />
                Live Location: {routeStations.length} stations on {lineName}
              </p>
            ) : (
              !liveLocationOn && (
                <p className="pointer-events-none absolute left-4 top-4 z-10 rounded-lg bg-black/60 px-3 py-1.5 text-xs text-white/70">
                  {positioned.length} stations - hover a dot for its name
                </p>
              )
            )}

          </div>

        </div>

        <div className="space-y-6">

          {!onlyTrainId && <LiveLocationPanel />}

          {allTrainMarkers.length > 0 && (
            <p className="text-xs text-muted">
              {onlyTrainId
                ? "Showing only this train."
                : liveLocationOn
                  ? `Showing all ${allTrainMarkers.length} trains on your line.`
                  : focusedStation
                    ? `Showing ${visibleTrainSummaries.length} of ${trainSummaries.length} train${trainSummaries.length === 1 ? "" : "s"} heading toward ${focusedStation.name}, soonest first.`
                    : `Showing ${visibleTrainSummaries.length} of ${trainSummaries.length} tracked trains, most delayed first - every train is still plotted on the map.`}
            </p>
          )}

          {visibleTrainSummaries.map((train) => (
            <TrainSummaryCard
              key={train.id}
              train={train}
              focusedStationName={focusedStation?.name ?? null}
            />
          ))}

          {trainSummaries.length === 0 && (
            <p className="text-sm text-muted">
              {initial.loading
                ? "Loading live train positions..."
                : focusedStation
                  ? `No trains currently running toward ${focusedStation.name}.`
                  : "No train tracking data yet."}
            </p>
          )}

          {canExpandTrains && (
            <button
              type="button"
              onClick={() => setShowAllTrains((prev) => !prev)}
              aria-expanded={showAllTrains}
              className="
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
              {showAllTrains ? (
                <>
                  Show Less
                  <ChevronUp size={16} />
                </>
              ) : (
                <>
                  View All Active Trains ({trainSummaries.length})
                  <ChevronDown size={16} />
                </>
              )}
            </button>
          )}

          <div
            className="
            rounded-2xl
            border
            border-primary/20
            bg-primary/5
            p-6
            "
          >

            <div className="flex gap-3">

              <Gauge
                className="text-primary"
                size={24}
              />

              <div>

                <h3 className="font-bold">
                  AI Recommendation
                </h3>

                <p className="mt-3 text-sm leading-7 text-muted">
                  {delayedTrain
                    ? `${delayedTrain.trainNumber} is delayed by ${delayedTrain.delayMinutes} min near ${delayedTrain.nextStation}. Consider dispatching a standby train to avoid overcrowding.`
                    : "All tracked trains are currently running on schedule."}
                </p>

              </div>

            </div>

          </div>

        </div>

      </div>

    </section>
  );
}

export default memo(LiveTrainMap);