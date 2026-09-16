"use client";

import { useMemo, useState } from "react";
import { Flame, Radio, Search, X } from "lucide-react";

import { useApiData } from "@/hooks/useApiData";
import { useLiveSocket } from "@/hooks/useLiveSocket";
import { useLiveSocketContext } from "@/providers/LiveSocketProvider";
import { useFullscreen } from "@/hooks/useFullscreen";
import { useStations } from "@/hooks/useStations";
import MapFullscreenToggle from "@/components/dashboard/MapFullscreenToggle";
import { getCrowdHeatmap } from "@/lib/api/crowd";
import { useSelectedState } from "@/providers/StateProvider";
import { useFocusedStation } from "@/providers/FocusedStationProvider";
import { queryKeys } from "@/lib/queryKeys";
import { buildStationProjection, applyStationProjection } from "@/lib/mapProjection";
import { buildFullLineSegments, buildFallbackConnector } from "@/lib/mapLines";
import type { CrowdHeatmapPoint, CrowdLevel } from "@/lib/api/types";

function heatColor(percent: number) {
  if (percent >= 90) return "#ef4444";
  if (percent >= 70) return "#f97316";
  if (percent >= 50) return "#facc15";
  return "#10b981";
}

function dedupeByStationName(points: CrowdHeatmapPoint[]) {
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
  trainRouteStationIds?: number[] | null;
  preferredStationId?: number | null;
} = {}) {
  const { selectedState } = useSelectedState();
  const { focusedStation, setFocusedStation } = useFocusedStation();
  const { isConnected } = useLiveSocketContext();
  const { ref, isFullscreen, toggleFullscreen } =
    useFullscreen<HTMLDivElement>();

  const { data: allStations } = useStations();

  // Location search shown above the map: user tells us their station,
  // and the map narrows down to just the stations around it (same
  // focusedStation-driven nearest-15 logic already used below).
  const [locationQuery, setLocationQuery] = useState("");
  const locationMatches = useMemo(() => {
    const q = locationQuery.trim().toLowerCase();
    if (!q) return [];
    return (allStations ?? [])
      .filter((s) => s.station_name.toLowerCase().includes(q))
      .slice(0, 8);
  }, [allStations, locationQuery]);

  function pickLocationStation(station: NonNullable<typeof allStations>[number]) {
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
    setLocationQuery("");
  }

  const [liveById, setLiveById] = useState<
    Record<number, { current_count: number; crowd_level: CrowdLevel }>
  >({});
  const [selectedId, setSelectedId] = useState<number | null>(
    preferredStationId ?? null,
  );
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  const routeIds = useMemo(
    () =>
      trainRouteStationIds?.length
        ? new Set(trainRouteStationIds)
        : null,
    [trainRouteStationIds],
  );

  const { data, loading, error } = useApiData(
    queryKeys.crowdHeatmap,
    (signal) =>
      getCrowdHeatmap(selectedState ?? undefined, undefined, signal),
    [selectedState],
    isConnected ? 0 : 30000,
  );

  useLiveSocket({
    crowd_update: (payload) => {
      setLiveById((previous) => {
        let changed = false;
        const next = { ...previous };

        for (const update of payload.updates) {
          const old = previous[update.station_id];

          if (
            old?.current_count === update.current_count &&
            old?.crowd_level === update.crowd_level
          ) {
            continue;
          }

          changed = true;
          next[update.station_id] = {
            current_count: update.current_count,
            crowd_level: update.crowd_level as CrowdLevel,
          };
        }

        return changed ? next : previous;
      });
    },
  });

  const points = useMemo(() => {
    const merged = (data ?? []).map((point) => {
      const live = liveById[point.station_id];

      if (!live) return point;

      return {
        ...point,
        current_count: live.current_count,
        crowd_level: live.crowd_level,
        occupancy_ratio: point.capacity
          ? live.current_count / point.capacity
          : point.occupancy_ratio,
      };
    });

    if (routeIds) {
      return merged
        .filter((p) => routeIds.has(p.station_id))
        .filter((p) => Math.round(p.occupancy_ratio * 100) > 0);
    }

    if (focusedStation) {
      return [...merged]
        .sort(
          (a, b) =>
            Math.hypot(
              a.latitude - focusedStation.latitude,
              a.longitude - focusedStation.longitude,
            ) -
            Math.hypot(
              b.latitude - focusedStation.latitude,
              b.longitude - focusedStation.longitude,
            ),
        )
        .filter((p) => Math.round(p.occupancy_ratio * 100) > 0)
        .slice(0, 15);
    }

    // Drop zero-density stations everywhere else too - a 0% dot has no
    // people to show and just clutters the map with a useless marker.
    return merged.filter((p) => Math.round(p.occupancy_ratio * 100) > 0);
  }, [data, liveById, routeIds, focusedStation]);

  // Project the FULL station list once (stable coordinate space) and
  // look up coordinates for whichever stations are currently shown, so
  // every visible dot lands exactly on its line's path - same fix as
  // the main Crowd Heat Map (see mapProjection.ts).
  const stationProjection = useMemo(
    () =>
      allStations ? buildStationProjection(allStations) : new Map<number, { x: number; y: number }>(),
    [allStations],
  );

  // Look up each station's line straight from the master station list
  // (authoritative) rather than trusting the crowd point's own
  // line_name, which some backend rows can leave blank.
  const lineNameById = useMemo(() => {
    const map = new Map<number, string | null>();
    for (const s of allStations ?? []) map.set(s.id, s.line_name);
    return map;
  }, [allStations]);

  const positioned = useMemo(
    () => applyStationProjection(dedupeByStationName(points), stationProjection),
    [points, stationProjection],
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
      allStations
        ? buildFullLineSegments(allStations, stationProjection, visibleLineNames)
        : [],
    [allStations, stationProjection, visibleLineNames],
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

  const effectiveSelectedId =
    selectedId ?? positioned[0]?.station_id ?? null;

  const totalPeople = positioned.reduce(
    (sum, p) => sum + (p.current_count ?? 0),
    0,
  );

  const avgDensity = positioned.length
    ? Math.round(
        (positioned.reduce(
          (sum, p) => sum + p.occupancy_ratio,
          0,
        ) /
          positioned.length) *
          100,
      )
    : 0;

  const selected = positioned.find(
    (p) => p.station_id === effectiveSelectedId,
  );

  return (
    <section className="rounded-3xl border border-border bg-card p-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">
            Live Crowd Density Heatmap
          </h2>
          <p className="mt-2 text-sm text-muted">
            {positioned.length} stations · {totalPeople.toLocaleString()} people
            tracked · average density {avgDensity}%
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isConnected && (
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-500">
              <Radio size={12} className="animate-pulse" />
              Live
            </span>
          )}
          <div className="rounded-xl bg-primary/10 p-3">
            <Flame className="text-primary" size={26} />
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
          <Search size={15} className="text-muted" />
          Enter your location/station to see crowd density nearby
        </div>

        {focusedStation ? (
          <div className="flex w-full max-w-sm items-center justify-between rounded-xl border border-primary/40 bg-primary/10 px-3 py-2.5 text-sm font-semibold">
            <span className="truncate">{focusedStation.name}</span>
            <button
              type="button"
              onClick={() => setFocusedStation(null)}
              title="Clear station"
              className="ml-2 shrink-0 text-muted hover:text-foreground"
            >
              <X size={15} />
            </button>
          </div>
        ) : (
          <div className="relative w-full max-w-sm">
            <div className="flex items-center rounded-xl border border-border bg-background px-3">
              <Search size={15} className="text-muted" />
              <input
                type="text"
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
                placeholder="Search your station..."
                className="h-10 w-full bg-transparent px-2.5 text-sm outline-none"
              />
            </div>

            {locationMatches.length > 0 && (
              <ul className="absolute z-30 mt-1.5 w-full overflow-hidden rounded-xl border border-border bg-card shadow-xl">
                {locationMatches.map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => pickLocationStation(s)}
                      className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted"
                    >
                      <span className="font-medium">{s.station_name}</span>
                      <span className="text-xs text-muted">{s.city}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="mb-5 rounded-xl bg-red-500/10 p-3 text-sm text-red-500">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-muted">Loading live crowd data...</p>
      ) : positioned.length === 0 ? (
        <p className="text-sm text-muted">
          No crowd data for {selectedState ?? "this selection"} yet.
        </p>
      ) : (
        <>
          <div
            ref={ref}
            className={
              isFullscreen
                ? "relative h-screen w-screen overflow-hidden bg-slate-950"
                : "relative h-[560px] overflow-hidden rounded-3xl border border-border bg-slate-950"
            }
          >
            <MapFullscreenToggle
              isFullscreen={isFullscreen}
              onToggle={toggleFullscreen}
            />

            <svg
              className="absolute inset-0 h-full w-full opacity-20"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              {Array.from({ length: 9 }).map((_, i) => (
                <g key={i}>
                  <line
                    x1={(i + 1) * 10}
                    y1="0"
                    x2={(i + 1) * 10}
                    y2="100"
                    stroke="white"
                    strokeWidth=".15"
                  />
                  <line
                    x1="0"
                    y1={(i + 1) * 10}
                    x2="100"
                    y2={(i + 1) * 10}
                    stroke="white"
                    strokeWidth=".15"
                  />
                </g>
              ))}
            </svg>

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
                  strokeWidth={seg.dashed ? 0.8 : 0.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={seg.dashed ? 0.9 : 0.7}
                  strokeDasharray={seg.dashed ? "2 1.5" : undefined}
                  vectorEffect={seg.dashed ? undefined : "non-scaling-stroke"}
                />
              ))}
            </svg>

            <svg
              className="absolute inset-0 h-full w-full overflow-visible"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <defs>
                {positioned.map((p) => {
                  const pct = p.occupancy_ratio * 100;
                  const color = heatColor(pct);

                  return (
                    <radialGradient
                      key={p.station_id}
                      id={`heat-${p.station_id}`}
                    >
                      <stop offset="0%" stopColor={color} stopOpacity=".9" />
                      <stop offset="45%" stopColor={color} stopOpacity=".42" />
                      <stop offset="100%" stopColor={color} stopOpacity="0" />
                    </radialGradient>
                  );
                })}
              </defs>

              <g style={{ mixBlendMode: "screen" }}>
                {positioned.map((p) => {
                  const pct = Math.min(
                    100,
                    Math.max(0, p.occupancy_ratio * 100),
                  );
                  const radius = 7 + pct / 5;

                  return (
                    <circle
                      key={p.station_id}
                      cx={p.x}
                      cy={p.y}
                      r={radius}
                      fill={`url(#heat-${p.station_id})`}
                    />
                  );
                })}
              </g>
            </svg>

            {positioned.map((p) => {
              const pct = p.occupancy_ratio * 100;
              const color = heatColor(pct);
              const selectedStation =
                p.station_id === effectiveSelectedId;
              // With this many stations, permanent always-on labels pile
              // into unreadable text (see the reported screenshot) - only
              // keep them all on when the set is small enough to fit;
              // otherwise reveal a label on hover/selection only.
              const labelAlwaysOn = positioned.length <= 25;
              const showLabel =
                labelAlwaysOn ||
                selectedStation ||
                hoveredId === p.station_id;

              return (
                <button
                  key={p.station_id}
                  type="button"
                  onClick={() => {
                    setSelectedId(p.station_id);
                    onSelectStation?.({
                      id: p.station_id,
                      name: p.station_name,
                    });
                  }}
                  onPointerEnter={() => setHoveredId(p.station_id)}
                  onPointerLeave={() =>
                    setHoveredId((id) => (id === p.station_id ? null : id))
                  }
                  className="group absolute -translate-x-1/2 -translate-y-1/2 focus:outline-none"
                  style={{ left: `${p.x}%`, top: `${p.y}%` }}
                  title={`${p.station_name} · ${pct.toFixed(0)}%`}
                >
                  <span
                    className={`block h-3 w-3 rounded-full border-2 border-white shadow-lg transition ${
                      selectedStation ? "scale-150" : "group-hover:scale-150"
                    }`}
                    style={{ background: color }}
                  />

                  {showLabel && (
                    <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-black/85 px-2 py-1 text-[10px] font-semibold text-white shadow-lg">
                      {p.station_name} - {pct.toFixed(0)}%
                    </span>
                  )}
                </button>
              );
            })}

            {positioned.length > 25 && !isFullscreen && (
              <p className="pointer-events-none absolute left-5 top-14 rounded-lg bg-black/60 px-3 py-1.5 text-xs text-white/70">
                Hover a dot for its name, or zoom in above for the full labeled map
              </p>
            )}

            {!isFullscreen && (
              <div className="absolute left-5 top-5 rounded-lg bg-black/65 px-3 py-1.5 text-xs text-white">
                {totalPeople.toLocaleString()} people tracked
              </div>
            )}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-6 text-sm text-muted">
            <Legend color="#10b981" label="Low" />
            <Legend color="#facc15" label="Medium" />
            <Legend color="#f97316" label="High" />
            <Legend color="#ef4444" label="Critical" />
          </div>

          {selected && (
            <div className="mt-5 rounded-2xl border border-border bg-background p-4 text-sm">
              <div className="flex flex-wrap justify-between gap-3">
                <strong>{selected.station_name}</strong>
                <span>
                  {selected.current_count.toLocaleString()} passengers ·{" "}
                  {(selected.occupancy_ratio * 100).toFixed(0)}% occupancy
                </span>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function Legend({
  color,
  label,
}: {
  color: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="h-3 w-3 rounded-full"
        style={{ background: color }}
      />
      {label}
    </div>
  );
}


// "use client";

// import { useMemo, useState } from "react";
// import { Flame, Radio } from "lucide-react";

// import { useApiData } from "@/hooks/useApiData";
// import { useLiveSocket } from "@/hooks/useLiveSocket";
// import { useLiveSocketContext } from "@/providers/LiveSocketProvider";
// import { useFullscreen } from "@/hooks/useFullscreen";
// import MapFullscreenToggle from "@/components/dashboard/MapFullscreenToggle";
// import { getCrowdHeatmap } from "@/lib/api/crowd";
// import { useSelectedState } from "@/providers/StateProvider";
// import { queryKeys } from "@/lib/queryKeys";
// import type { CrowdHeatmapPoint, CrowdLevel } from "@/lib/api/types";

// function dedupeByStationName(points: CrowdHeatmapPoint[]) {
//   // Interchange stations can come back as two rows with the same
//   // station_name (one per metro line) - keep only the busier one so
//   // the map never draws the same station label twice.
//   const byName = new Map<string, CrowdHeatmapPoint>();
//   for (const p of points) {
//     const key = p.station_name.trim().toLowerCase();
//     const existing = byName.get(key);
//     if (!existing || p.occupancy_ratio > existing.occupancy_ratio) {
//       byName.set(key, p);
//     }
//   }
//   return Array.from(byName.values());
// }

// function projectPositions(points: CrowdHeatmapPoint[]) {
//   const valid = dedupeByStationName(points).filter(
//     (p) =>
//       Number.isFinite(p.latitude) &&
//       Number.isFinite(p.longitude) &&
//       !(p.latitude === 0 && p.longitude === 0),
//   );
//   if (valid.length === 0) return [];

//   const lats = valid.map((p) => p.latitude);
//   const lngs = valid.map((p) => p.longitude);
//   const minLat = Math.min(...lats);
//   const maxLat = Math.max(...lats);
//   const minLng = Math.min(...lngs);
//   const maxLng = Math.max(...lngs);
//   const latRange = maxLat - minLat || 1;
//   const lngRange = maxLng - minLng || 1;

//   return valid.map((point) => ({
//     ...point,
//     x: ((point.longitude - minLng) / lngRange) * 80 + 10,
//     y: ((maxLat - point.latitude) / latRange) * 80 + 10,
//   }));
// }

// function heatColor(occupancyPct: number) {
//   if (occupancyPct >= 90) return "#ef4444";
//   if (occupancyPct >= 70) return "#f97316";
//   if (occupancyPct >= 50) return "#facc15";
//   return "#10b981";
// }

// export default function CrowdDensityGradientMap() {
//   const { selectedState } = useSelectedState();
//   const { isConnected } = useLiveSocketContext();
//   const [connected, setConnected] = useState(false);
//   const [liveById, setLiveById] = useState<
//     Record<number, { current_count: number; crowd_level: CrowdLevel }>
//   >({});

//   const { data, loading, error } = useApiData(
//     queryKeys.crowdHeatmap,
//     (signal) => getCrowdHeatmap(selectedState ?? undefined, undefined, signal),
//     [selectedState],
//     isConnected ? 0 : 30000,
//   );

//   useLiveSocket({
//     crowd_update: (payload) => {
//       setConnected(true);
//       setLiveById((prev) => {
//         let changed = false;
//         const next = { ...prev };
//         for (const u of payload.updates) {
//           const existing = prev[u.station_id];
//           if (
//             existing &&
//             existing.current_count === u.current_count &&
//             existing.crowd_level === u.crowd_level
//           ) {
//             continue;
//           }
//           changed = true;
//           next[u.station_id] = {
//             current_count: u.current_count,
//             crowd_level: u.crowd_level as CrowdLevel,
//           };
//         }
//         return changed ? next : prev;
//       });
//     },
//   });

//   const merged = useMemo(() => {
//     return (data ?? []).map((point) => {
//       const live = liveById[point.station_id];
//       if (!live) return point;
//       const occupancy_ratio = point.capacity
//         ? live.current_count / point.capacity
//         : point.occupancy_ratio;
//       return {
//         ...point,
//         current_count: live.current_count,
//         crowd_level: live.crowd_level,
//         occupancy_ratio,
//       };
//     });
//   }, [data, liveById]);

//   const positioned = useMemo(() => projectPositions(merged), [merged]);

//   const { ref: fullscreenRef, isFullscreen, toggleFullscreen } = useFullscreen<HTMLDivElement>();

//   const totalPeople = positioned.reduce((sum, p) => sum + (p.current_count ?? 0), 0);
//   const avgDensity =
//     positioned.length > 0
//       ? Math.round(
//           (positioned.reduce((sum, p) => sum + p.occupancy_ratio, 0) / positioned.length) * 100,
//         )
//       : 0;

//   return (
//     <section className="rounded-3xl border border-border bg-card p-8">
//       <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
//         <div>
//           <h2 className="text-2xl font-bold">Live Crowd Density Heatmap</h2>
//           <p className="mt-2 text-muted">
//             Same live data as above, blended into a continuous density map -
//             {" "}
//             {positioned.length} station{positioned.length === 1 ? "" : "s"}
//             {positioned.length > 0 && <> - avg density {avgDensity}%</>}
//           </p>
//         </div>

//         <div className="flex items-center gap-3">
//           {(connected || isConnected) && (
//             <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-500">
//               <Radio size={12} className="animate-pulse" />
//               Live
//             </span>
//           )}
//           <div className="rounded-xl bg-primary/10 p-3">
//             <Flame className="text-primary" size={28} />
//           </div>
//         </div>
//       </div>

//       {error && (
//         <p className="mb-6 rounded-xl bg-red-500/10 p-3 text-sm text-red-500">{error}</p>
//       )}

//       {loading ? (
//         <p className="text-sm text-muted">Loading live crowd data...</p>
//       ) : positioned.length === 0 ? (
//         <p className="text-sm text-muted">
//           No crowd data for {selectedState ?? "this selection"} yet.
//         </p>
//       ) : (
//         <div
//           ref={fullscreenRef}
//           className={
//             isFullscreen
//               ? "relative h-screen w-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-black"
//               : "relative h-[420px] overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-slate-950 via-slate-900 to-black"
//           }
//         >
//           <MapFullscreenToggle isFullscreen={isFullscreen} onToggle={toggleFullscreen} />

//           {/* faint grid to read as a floor plan / map, same in light & dark
//               since this canvas is intentionally always-dark for contrast
//               against the heat colors - matches the existing Crowd Heat Map
//               panel above it. */}
//           <svg
//             className="absolute inset-0 h-full w-full opacity-[0.15]"
//             viewBox="0 0 100 100"
//             preserveAspectRatio="none"
//           >
//             {Array.from({ length: 9 }).map((_, i) => (
//               <line
//                 key={`v${i}`}
//                 x1={(i + 1) * 10}
//                 y1={0}
//                 x2={(i + 1) * 10}
//                 y2={100}
//                 stroke="white"
//                 strokeWidth={0.15}
//               />
//             ))}
//             {Array.from({ length: 9 }).map((_, i) => (
//               <line
//                 key={`h${i}`}
//                 x1={0}
//                 y1={(i + 1) * 10}
//                 x2={100}
//                 y2={(i + 1) * 10}
//                 stroke="white"
//                 strokeWidth={0.15}
//               />
//             ))}
//           </svg>

//           <svg
//             className="absolute inset-0 h-full w-full overflow-visible"
//             viewBox="0 0 100 100"
//             preserveAspectRatio="none"
//           >
//             <defs>
//               {positioned.map((p) => {
//                 const pct = p.occupancy_ratio * 100;
//                 const color = heatColor(pct);
//                 return (
//                   <radialGradient
//                     key={`grad-${p.station_id}`}
//                     id={`heat-${p.station_id}`}
//                     cx="50%"
//                     cy="50%"
//                     r="50%"
//                   >
//                     <stop offset="0%" stopColor={color} stopOpacity={0.85} />
//                     <stop offset="55%" stopColor={color} stopOpacity={0.35} />
//                     <stop offset="100%" stopColor={color} stopOpacity={0} />
//                   </radialGradient>
//                 );
//               })}
//             </defs>

//             {/* blended heat blobs - "screen"-style additive blending so
//                 overlapping high-density stations glow brighter, exactly
//                 like a real density heatmap. */}
//             <g style={{ mixBlendMode: "screen" }}>
//               {positioned.map((p) => {
//                 const pct = p.occupancy_ratio * 100;
//                 const radius = 8 + pct / 6;
//                 return (
//                   <circle
//                     key={`blob-${p.station_id}`}
//                     cx={p.x}
//                     cy={p.y}
//                     r={radius}
//                     fill={`url(#heat-${p.station_id})`}
//                   />
//                 );
//               })}
//             </g>
//           </svg>

//           {/* station dots + labels on top of the blended glow */}
//           {positioned.map((p) => {
//             const pct = p.occupancy_ratio * 100;
//             const color = heatColor(pct);
//             return (
//               <div
//                 key={`dot-${p.station_id}`}
//                 className="group absolute -translate-x-1/2 -translate-y-1/2"
//                 style={{ left: `${p.x}%`, top: `${p.y}%` }}
//               >
//                 <div
//                   className="h-2.5 w-2.5 rounded-full border-2 border-white/90 shadow"
//                   style={{ background: color }}
//                 />
//                 <div className="pointer-events-none absolute left-1/2 top-full z-10 mt-1.5 -translate-x-1/2 whitespace-nowrap rounded-md bg-black/80 px-2 py-1 text-[10px] font-semibold text-white opacity-0 transition group-hover:opacity-100">
//                   {p.station_name} - {pct.toFixed(0)}%
//                 </div>
//               </div>
//             );
//           })}

//           {!isFullscreen && (
//             <div className="pointer-events-none absolute left-4 top-4 z-10 rounded-lg bg-black/60 px-3 py-1.5 text-xs text-white/80">
//               {totalPeople.toLocaleString()} people tracked
//             </div>
//           )}
//         </div>
//       )}

//       <div className="mt-6 flex flex-wrap items-center gap-6">
//         <LegendDot color="#10b981" label="Low" />
//         <LegendDot color="#facc15" label="Medium" />
//         <LegendDot color="#f97316" label="High" />
//         <LegendDot color="#ef4444" label="Critical" />
//       </div>
//     </section>
//   );
// }

// function LegendDot({ color, label }: { color: string; label: string }) {
//   return (
//     <div className="flex items-center gap-2 text-sm text-muted">
//       <span className="h-3 w-3 rounded-full" style={{ background: color }} />
//       {label}
//     </div>
//   );
// }