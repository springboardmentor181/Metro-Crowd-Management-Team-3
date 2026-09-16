"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Users,
  Activity,
  AlertTriangle,
  Info,
  Radio,
  Plus,
  Minus,
  RotateCcw,
} from "lucide-react";

import { useApiData } from "@/hooks/useApiData";
import { useLiveSocket } from "@/hooks/useLiveSocket";
import { useLiveSocketContext } from "@/providers/LiveSocketProvider";
import { useStations } from "@/hooks/useStations";
import { useStationRoute } from "@/hooks/useStationRoute";
import { useFullscreen } from "@/hooks/useFullscreen";
import { usePanZoom } from "@/hooks/usePanZoom";
import MapFullscreenToggle from "@/components/dashboard/MapFullscreenToggle";
import SimulatorToggle from "@/components/dashboard/SimulatorToggle";
import LiveLocationPanel from "@/components/dashboard/LiveLocationPanel";
import { buildFullLineSegments, buildFallbackConnector } from "@/lib/mapLines";
import { buildStationProjection, applyStationProjection } from "@/lib/mapProjection";
import { getCrowdHeatmap } from "@/lib/api/crowd";
import { getRecommendations } from "@/lib/api/predictions";
import { useSelectedState } from "@/providers/StateProvider";
import { useFocusedStation } from "@/providers/FocusedStationProvider";
import { queryKeys } from "@/lib/queryKeys";
import type { CrowdHeatmapPoint, CrowdLevel, SmartRecommendation } from "@/lib/api/types";

const DEFAULT_NEARBY_COUNT = 15;
const NEARBY_COUNT_OPTIONS = [10, 15, 20] as const;

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function getColor(value: number) {
  if (value >= 90) return "#ef4444";
  if (value >= 70) return "#f97316";
  if (value >= 50) return "#facc15";
  return "#10b981";
}

function getSize(value: number) {
  return value / 4 + 16;
}

function dedupeByStationName(points: CrowdHeatmapPoint[]) {
  // Interchange stations can come back as two rows with the same
  // station_name (one per metro line) - keep only the busier one so
  // the map never draws the same station label twice.
  const byName = new Map<string, CrowdHeatmapPoint>();
  for (const p of points) {
    const key = p.station_name.trim().toLowerCase();
    const existing = byName.get(key);
    if (!existing || p.occupancy_ratio > existing.occupancy_ratio) {
      byName.set(key, p);
    }
  }
  return Array.from(byName.values());
}

export default function CrowdHeatMap({
  onSelectStation,
  trainRouteStationIds,
  preferredStationId,
}: {
  onSelectStation?: (station: { id: number; name: string } | null) => void;
  /** When set (e.g. viewing a single train), scope the heat map to exactly
   * these station ids - the train's own route - instead of the generic
   * focused-station/line lookup, which depends on that station's line_name
   * being populated and can silently fall back to "all stations". */
  trainRouteStationIds?: number[] | null;
  /** Station to auto-select by default when trainRouteStationIds is set. */
  preferredStationId?: number | null;
} = {}) {
  const { selectedState } = useSelectedState();
  const [crowdedOnly, setCrowdedOnly] = useState(false);
  const { focusedStation, liveLocationOn } = useFocusedStation();
  const { isConnected } = useLiveSocketContext();

  const explicitTrainRouteIds = useMemo(
    () =>
      trainRouteStationIds && trainRouteStationIds.length > 0
        ? new Set(trainRouteStationIds)
        : null,
    [trainRouteStationIds],
  );

  const { data, loading, error } = useApiData(
    queryKeys.crowdHeatmap,
    (signal) => getCrowdHeatmap(selectedState ?? undefined, undefined, signal),
    [selectedState],
    isConnected ? 0 : 30000,
  );

  const { data: allStationsForRoute } = useStations();

  const { routeStations, lineName } = useStationRoute(
    allStationsForRoute,
    focusedStation,
    liveLocationOn,
  );
  const routeStationIds = useMemo(
    () => new Set(routeStations.map((s) => s.id)),
    [routeStations],
  );

  const [liveById, setLiveById] = useState<
    Record<number, { current_count: number; crowd_level: CrowdLevel }>
  >({});
  const [connected, setConnected] = useState(false);

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
          };
        }
        return changed ? next : prev;
      });
    },
  });

  const merged = useMemo(() => {
    const withLive = (data ?? []).map((point) => {
      const live = liveById[point.station_id];
      if (!live) return point;
      const occupancy_ratio = point.capacity
        ? live.current_count / point.capacity
        : point.occupancy_ratio;
      return {
        ...point,
        current_count: live.current_count,
        crowd_level: live.crowd_level,
        occupancy_ratio,
      };
    });

    // "Crowded Stations" view: only stations that actually have people
    // in them right now - drop the 0% dots instead of cluttering the
    // map with stations nobody is at.
    return crowdedOnly
      ? withLive.filter((p) => Math.round(p.occupancy_ratio * 100) > 0)
      : withLive;
  }, [data, liveById, crowdedOnly]);

  // Full list of crowded stations (name + %), independent of the map's
  // current filters/scope - always sourced from the unscoped merged
  // data so the sidebar list stays a complete picture.
  const crowdedStationsList = useMemo(
    () =>
      [...merged]
        .filter((p) => Math.round(p.occupancy_ratio * 100) > 0)
        .sort((a, b) => b.occupancy_ratio - a.occupancy_ratio),
    [merged],
  );

  const [nearbyCount, setNearbyCount] = useState<number>(DEFAULT_NEARBY_COUNT);

  const nearby = useMemo(() => {
    if (explicitTrainRouteIds) {
      return merged.filter((p) => explicitTrainRouteIds.has(p.station_id));
    }

    if (!focusedStation) return merged;

    if (liveLocationOn && lineName) {
      return merged.filter((p) => routeStationIds.has(p.station_id));
    }

    return [...merged]
      .sort(
        (a, b) =>
          haversineKm(focusedStation.latitude, focusedStation.longitude, a.latitude, a.longitude) -
          haversineKm(focusedStation.latitude, focusedStation.longitude, b.latitude, b.longitude),
      )
      .slice(0, nearbyCount);
  }, [
    merged,
    focusedStation,
    nearbyCount,
    liveLocationOn,
    lineName,
    routeStationIds,
    explicitTrainRouteIds,
  ]);

  // Project the FULL station list once (stable coordinate space), then
  // just look up coordinates for whichever stations are currently
  // shown. This guarantees every visible dot lands exactly on its
  // line's path below - see buildStationProjection for why.
  const stationProjection = useMemo(
    () =>
      allStationsForRoute
        ? buildStationProjection(allStationsForRoute)
        : new Map<number, { x: number; y: number }>(),
    [allStationsForRoute],
  );

  // Look up each station's line straight from the master station list
  // (authoritative) rather than trusting the crowd point's own
  // line_name, which some backend rows can leave blank.
  const lineNameById = useMemo(() => {
    const map = new Map<number, string | null>();
    for (const s of allStationsForRoute ?? []) map.set(s.id, s.line_name);
    return map;
  }, [allStationsForRoute]);

  const positioned = useMemo(
    () => applyStationProjection(dedupeByStationName(nearby), stationProjection),
    [nearby, stationProjection],
  );

  const visibleLineNames = useMemo(() => {
    const set = new Set<string>();
    for (const p of positioned) {
      const line = lineNameById.get(p.station_id) ?? p.line_name;
      if (line) set.add(line);
    }
    return set;
  }, [positioned, lineNameById]);

  const lineSegments = useMemo(
    () =>
      allStationsForRoute
        ? buildFullLineSegments(allStationsForRoute, stationProjection, visibleLineNames)
        : [],
    [allStationsForRoute, stationProjection, visibleLineNames],
  );

  // Any visible dot whose station has no line assigned at all (a data
  // gap, not a placement issue) still gets chained into a dashed
  // "unassigned" connector so it never renders as a lone floating dot.
  const fallbackSegment = useMemo(() => {
    const orphans = positioned.filter(
      (p) => !(lineNameById.get(p.station_id) ?? p.line_name),
    );
    return buildFallbackConnector(orphans);
  }, [positioned, lineNameById]);

  const allLineSegments = useMemo(
    () => (fallbackSegment ? [...lineSegments, fallbackSegment] : lineSegments),
    [lineSegments, fallbackSegment],
  );

  const { ref: fullscreenRef, isFullscreen, toggleFullscreen } = useFullscreen<HTMLDivElement>();
  const panZoom = usePanZoom();

  // With a small set of stations, showing every label at once is
  // readable and helpful. Past that, permanent labels on a fixed-size
  // box just overlap into an unreadable wall of text (see the
  // reported screenshots) - so once the map is busy, labels only show
  // on hover/selection, or once the person has zoomed in enough to
  // give each station room to breathe.
  const LABEL_DENSITY_THRESHOLD = 25;
  const showAllLabels =
    positioned.length <= LABEL_DENSITY_THRESHOLD || panZoom.scale >= 2.2;
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [recommendations, setRecommendations] = useState<SmartRecommendation[]>([]);

  // Default selection when nothing's been clicked yet: prefer the train's
  // relevant station when we're scoped to one train's route, otherwise
  // fall back to the first station currently on the map.
  const routeFallbackStationId = explicitTrainRouteIds ? preferredStationId ?? null : null;
  const effectiveSelectedId =
    selectedId ?? routeFallbackStationId ?? positioned[0]?.station_id ?? null;
  const selected = positioned.find((p) => p.station_id === effectiveSelectedId);

  useEffect(() => {
    onSelectStation?.(
      selected ? { id: selected.station_id, name: selected.station_name } : null,
    );
  }, [selected?.station_id]);

  // Whenever the visible station set changes shape (a different train's
  // route, a new nearby-station search, a state filter...) drop any pan/
  // zoom from the previous view so the person isn't left staring at an
  // empty corner of the map.
  useEffect(() => {
    panZoom.reset();
  }, [explicitTrainRouteIds, focusedStation?.name, selectedState]);

  useEffect(() => {
    if (!selected) return;
    getRecommendations(selected.station_id)
      .then(setRecommendations)
      .catch(() => setRecommendations([]));
  }, [selected?.station_id]);

  return (
    <section className="rounded-3xl border border-border bg-card p-8">

      <div className="mb-8 flex items-center justify-between">

        <div>

          <h2 className="text-2xl font-bold">
            Crowd Heat Map
          </h2>

          <p className="mt-2 flex flex-wrap items-center gap-2 text-muted">
            {explicitTrainRouteIds ? (
              <span>This train&apos;s route - {positioned.length} stations</span>
            ) : liveLocationOn && lineName ? (
              <span>
                Your real track on {lineName} - {positioned.length} stations
              </span>
            ) : focusedStation ? (
              <>
                <span>
                  Nearest {Math.min(nearbyCount, positioned.length)} stations around{" "}
                  {focusedStation.name}
                </span>
                <select
                  value={nearbyCount}
                  onChange={(e) => setNearbyCount(Number(e.target.value))}
                  className="rounded-lg border border-border bg-background px-2 py-1 text-xs font-semibold text-foreground"
                  title="How many nearby stations to show"
                >
                  {NEARBY_COUNT_OPTIONS.map((n) => (
                    <option key={n} value={n}>
                      Show {n}
                    </option>
                  ))}
                </select>
              </>
            ) : (
              crowdedOnly
                ? `Crowded stations only - ${positioned.length} station${positioned.length === 1 ? "" : "s"}`
                : "Live passenger density across stations"
            )}
          </p>

        </div>

        <div className="flex items-center gap-3">

          <div className="flex items-center gap-1.5 rounded-full bg-background p-1">
            <button
              type="button"
              onClick={() => setCrowdedOnly(false)}
              disabled={!!focusedStation || !!explicitTrainRouteIds}
              title={
                focusedStation || explicitTrainRouteIds
                  ? "Not applied while searching a station - clear the search to use this filter"
                  : undefined
              }
              className={`
              rounded-full
              px-4
              py-1.5
              text-xs
              font-semibold
              transition
              disabled:cursor-not-allowed
              disabled:opacity-40
              ${
                !crowdedOnly
                  ? "bg-primary text-white"
                  : "text-muted hover:text-foreground"
              }
              `}
            >
              All Stations
            </button>
            <button
              type="button"
              onClick={() => setCrowdedOnly(true)}
              disabled={!!focusedStation || !!explicitTrainRouteIds}
              title={
                focusedStation || explicitTrainRouteIds
                  ? "Not applied while searching a station - clear the search to use this filter"
                  : undefined
              }
              className={`
              rounded-full
              px-4
              py-1.5
              text-xs
              font-semibold
              transition
              disabled:cursor-not-allowed
              disabled:opacity-40
              ${
                crowdedOnly
                  ? "bg-primary text-white"
                  : "text-muted hover:text-foreground"
              }
              `}
            >
              Crowded Stations
            </button>
          </div>

          <SimulatorToggle />

          {connected && (
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-500">
              <Radio size={12} className="animate-pulse" />
              Live
            </span>
          )}

          <div className="rounded-xl bg-primary/10 p-3">

            <Activity
              className="text-primary"
              size={28}
            />

          </div>

        </div>

      </div>

      {error && (
        <p className="mb-6 rounded-xl bg-red-500/10 p-3 text-sm text-red-500">{error}</p>
      )}

      {loading ? (
        <p className="text-sm text-muted">Loading live crowd data...</p>
      ) : (data ?? []).length === 0 ? (
        <p className="text-sm text-muted">
          No crowd data for {selectedState ?? "this selection"} yet.
        </p>
      ) : nearby.length === 0 ? (
        <p className="mb-6 rounded-xl bg-orange-500/10 p-3 text-sm text-orange-500">
          {crowdedOnly
            ? "No stations currently have live crowd - try the All Stations view."
            : "No stations match this view."}
        </p>
      ) : nearby.length > 0 && positioned.length === 0 ? (
        <p className="mb-6 rounded-xl bg-orange-500/10 p-3 text-sm text-orange-500">
          {nearby.length} station{nearby.length === 1 ? "" : "s"} found, but
          none has valid map coordinates (latitude/longitude missing or
          0,0) - check the seeded station data.
        </p>
      ) : (
      <div className="grid gap-8 xl:grid-cols-3">

        <div className="xl:col-span-2">

          <div
            ref={fullscreenRef}
            className={
              isFullscreen
                ? "relative h-screen w-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-black"
                : "relative h-[380px] overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-slate-950 via-slate-900 to-black sm:h-[460px] lg:h-[560px]"
            }
          >

            <MapFullscreenToggle isFullscreen={isFullscreen} onToggle={toggleFullscreen} />

            <div className="absolute right-4 top-16 z-10 flex flex-col gap-1.5">
              <button
                type="button"
                onClick={panZoom.zoomIn}
                title="Zoom in"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-black/60 text-white backdrop-blur transition hover:bg-white/10"
              >
                <Plus size={14} />
              </button>
              <button
                type="button"
                onClick={panZoom.zoomOut}
                title="Zoom out"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-black/60 text-white backdrop-blur transition hover:bg-white/10"
              >
                <Minus size={14} />
              </button>
              {panZoom.isZoomed && (
                <button
                  type="button"
                  onClick={panZoom.reset}
                  title="Reset view"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-black/60 text-white backdrop-blur transition hover:bg-white/10"
                >
                  <RotateCcw size={13} />
                </button>
              )}
            </div>

            <div
              className="absolute inset-0 select-none overflow-hidden"
              style={{ touchAction: "none", cursor: panZoom.isZoomed ? "grab" : "default" }}
              {...panZoom.handlers}
            >
              <div
                className="absolute inset-0"
                style={{
                  transform: `translate(${panZoom.x}px, ${panZoom.y}px) scale(${panZoom.scale})`,
                  transformOrigin: "center center",
                }}
              >
                <svg
                  className="absolute inset-0 h-full w-full overflow-visible"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                >
                  {allLineSegments.map((seg) => (
                    <polyline
                      key={seg.key}
                      points={seg.points}
                      fill="none"
                      stroke={seg.color}
                      strokeWidth={seg.dashed ? 0.9 : 0.6}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity={seg.dashed ? 0.9 : 0.85}
                      strokeDasharray={seg.dashed ? "2 1.5" : undefined}
                      vectorEffect={seg.dashed ? undefined : "non-scaling-stroke"}
                    />
                  ))}
                </svg>

                {positioned.map((station) => {
                  const occupancy = station.occupancy_ratio * 100;
                  const showLabel =
                    showAllLabels || hoveredId === station.station_id || selectedId === station.station_id;
                  const isOvercrowded = occupancy >= 70;
                  return (
                    <button
                      key={station.station_id}
                      onClick={() => setSelectedId(station.station_id)}
                      onPointerEnter={() => setHoveredId(station.station_id)}
                      onPointerLeave={() => setHoveredId((id) => (id === station.station_id ? null : id))}
                      className="absolute -translate-x-1/2 -translate-y-1/2"
                      style={{
                        left: `${station.x}%`,
                        top: `${station.y}%`,
                      }}
                    >
                      <div
                        className={`absolute rounded-full blur-xl opacity-50 ${isOvercrowded ? "animate-pulse" : ""}`}
                        style={{
                          width: getSize(occupancy) * 2,
                          height: getSize(occupancy) * 2,
                          background: getColor(occupancy),
                          transform: "translate(-50%,-50%)",
                          left: "50%",
                          top: "50%",
                        }}
                      />

                      <div
                        className={`relative rounded-full border-4 border-white transition hover:scale-125 ${isOvercrowded ? "animate-pulse" : ""}`}
                        style={{
                          width: getSize(occupancy),
                          height: getSize(occupancy),
                          background: getColor(occupancy),
                        }}
                      />

                      {isOvercrowded && !showLabel && (
                        <span className="absolute -right-1 -top-1 flex h-3 w-3">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75" />
                          <span className="relative inline-flex h-3 w-3 rounded-full bg-orange-500" />
                        </span>
                      )}

                      {showLabel && (
                        <p
                          className="mt-3 whitespace-nowrap rounded bg-black/70 px-1.5 py-0.5 text-xs font-semibold text-white"
                          style={{ fontSize: panZoom.scale > 1 ? `${10 / panZoom.scale}px` : undefined }}
                        >
                          {station.station_name}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {!showAllLabels && (
              <p className="pointer-events-none absolute left-4 top-4 z-10 rounded-lg bg-black/60 px-3 py-1.5 text-xs text-white/70">
                {positioned.length} stations - hover a dot, or use +/- to zoom into a cluster
              </p>
            )}

          </div>

          <div className="mt-6 max-h-[320px] overflow-y-auto rounded-3xl border border-border bg-background p-6">

            <h3 className="mb-4 font-bold">
              Crowded Stations
            </h3>

            {crowdedStationsList.length === 0 ? (
              <p className="text-sm text-muted">
                No stations currently have crowd.
              </p>
            ) : (
              <div className="space-y-3">
                {crowdedStationsList.map((s) => (
                  <div
                    key={s.station_id}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="truncate">{s.station_name}</span>
                    <strong
                      className="shrink-0"
                      style={{ color: getColor(s.occupancy_ratio * 100) }}
                    >
                      {(s.occupancy_ratio * 100).toFixed(0)}%
                    </strong>
                  </div>
                ))}
              </div>
            )}

          </div>

        </div>

        <div>

          <div className="mb-6">
            <LiveLocationPanel />
          </div>

          <div className="rounded-3xl border border-border bg-background p-6">

            <h3 className="text-xl font-bold">
              Station Details
            </h3>

            {selected && (
              <>

                <div className="mt-8 space-y-5">

                  <InfoRow
                    icon={<Users size={18} />}
                    label="Station"
                    value={selected.station_name}
                  />

                  <InfoRow
                    icon={<Users size={18} />}
                    label="Passengers"
                    value={selected.current_count.toLocaleString()}
                  />

                  <InfoRow
                    icon={<Activity size={18} />}
                    label="Occupancy"
                    value={`${(selected.occupancy_ratio * 100).toFixed(0)}%`}
                  />

                </div>

                <div className="mt-8">

                  <div className="mb-3 flex justify-between">

                    <span>Capacity</span>

                    <strong>
                      {(selected.occupancy_ratio * 100).toFixed(0)}%
                    </strong>

                  </div>

                  <div className="h-3 overflow-hidden rounded-full bg-border">

                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${selected.occupancy_ratio * 100}%`,
                        background: getColor(selected.occupancy_ratio * 100),
                      }}
                    />

                  </div>

                </div>

                <div
                  className="
                  mt-8
                  rounded-2xl
                  border
                  border-orange-500/20
                  bg-orange-500/10
                  p-5
                  "
                >

                  <div className="flex gap-3">

                    <AlertTriangle
                      className="text-orange-500"
                      size={22}
                    />

                    <div>

                      <h4 className="font-semibold">
                        AI Recommendation
                      </h4>

                      <p className="mt-2 text-sm text-muted leading-7">
                        {recommendations[0]?.detail ??
                          "No anomalies detected for this station right now."}
                      </p>

                    </div>

                  </div>

                </div>

              </>
            )}

          </div>

          <div className="mt-6 rounded-3xl border border-border bg-background p-6">

            <h3 className="mb-6 font-bold">
              Legend
            </h3>

            <Legend color="#10b981" text="0 - 49%" />

            <Legend color="#facc15" text="50 - 69%" />

            <Legend color="#f97316" text="70 - 89%" />

            <Legend color="#ef4444" text="90% +" />

            <div className="mt-8 flex items-start gap-3 rounded-2xl bg-primary/5 p-4">

              <Info
                className="text-primary"
                size={18}
              />

              <p className="text-sm text-muted">
                Live data from MetroFlow&apos;s crowd monitoring API.
              </p>

            </div>

          </div>

        </div>

      </div>
      )}

    </section>
  );
}

function Legend({
  color,
  text,
}: {
  color: string;
  text: string;
}) {
  return (
    <div className="mb-4 flex items-center gap-3">

      <div
        className="h-4 w-4 rounded-full"
        style={{
          background: color,
        }}
      />

      <span>{text}</span>

    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between">

      <div className="flex items-center gap-3">

        {icon}

        <span>{label}</span>

      </div>

      <strong>{value}</strong>

    </div>
  );
}