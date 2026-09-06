"use client";

import { useMemo, useState } from "react";
import { Flame, Radio } from "lucide-react";

import { useApiData } from "@/hooks/useApiData";
import { useLiveSocket } from "@/hooks/useLiveSocket";
import { useLiveSocketContext } from "@/providers/LiveSocketProvider";
import { useFullscreen } from "@/hooks/useFullscreen";
import MapFullscreenToggle from "@/components/dashboard/MapFullscreenToggle";
import { getCrowdHeatmap } from "@/lib/api/crowd";
import { useSelectedState } from "@/providers/StateProvider";
import { queryKeys } from "@/lib/queryKeys";
import type { CrowdHeatmapPoint, CrowdLevel } from "@/lib/api/types";

function projectPositions(points: CrowdHeatmapPoint[]) {
  const valid = points.filter(
    (p) =>
      Number.isFinite(p.latitude) &&
      Number.isFinite(p.longitude) &&
      !(p.latitude === 0 && p.longitude === 0),
  );
  if (valid.length === 0) return [];

  const lats = valid.map((p) => p.latitude);
  const lngs = valid.map((p) => p.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const latRange = maxLat - minLat || 1;
  const lngRange = maxLng - minLng || 1;

  return valid.map((point) => ({
    ...point,
    x: ((point.longitude - minLng) / lngRange) * 80 + 10,
    y: ((maxLat - point.latitude) / latRange) * 80 + 10,
  }));
}

function heatColor(occupancyPct: number) {
  if (occupancyPct >= 90) return "#ef4444";
  if (occupancyPct >= 70) return "#f97316";
  if (occupancyPct >= 50) return "#facc15";
  return "#10b981";
}

export default function CrowdDensityGradientMap() {
  const { selectedState } = useSelectedState();
  const { isConnected } = useLiveSocketContext();
  const [connected, setConnected] = useState(false);
  const [liveById, setLiveById] = useState<
    Record<number, { current_count: number; crowd_level: CrowdLevel }>
  >({});

  const { data, loading, error } = useApiData(
    queryKeys.crowdHeatmap,
    (signal) => getCrowdHeatmap(selectedState ?? undefined, undefined, signal),
    [selectedState],
    isConnected ? 0 : 30000,
  );

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
    return (data ?? []).map((point) => {
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
  }, [data, liveById]);

  const positioned = useMemo(() => projectPositions(merged), [merged]);

  const { ref: fullscreenRef, isFullscreen, toggleFullscreen } = useFullscreen<HTMLDivElement>();

  const totalPeople = positioned.reduce((sum, p) => sum + (p.current_count ?? 0), 0);
  const avgDensity =
    positioned.length > 0
      ? Math.round(
          (positioned.reduce((sum, p) => sum + p.occupancy_ratio, 0) / positioned.length) * 100,
        )
      : 0;

  return (
    <section className="rounded-3xl border border-border bg-card p-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Live Crowd Density Heatmap</h2>
          <p className="mt-2 text-muted">
            Same live data as above, blended into a continuous density map -
            {" "}
            {positioned.length} station{positioned.length === 1 ? "" : "s"}
            {positioned.length > 0 && <> - avg density {avgDensity}%</>}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {(connected || isConnected) && (
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-500">
              <Radio size={12} className="animate-pulse" />
              Live
            </span>
          )}
          <div className="rounded-xl bg-primary/10 p-3">
            <Flame className="text-primary" size={28} />
          </div>
        </div>
      </div>

      {error && (
        <p className="mb-6 rounded-xl bg-red-500/10 p-3 text-sm text-red-500">{error}</p>
      )}

      {loading ? (
        <p className="text-sm text-muted">Loading live crowd data...</p>
      ) : positioned.length === 0 ? (
        <p className="text-sm text-muted">
          No crowd data for {selectedState ?? "this selection"} yet.
        </p>
      ) : (
        <div
          ref={fullscreenRef}
          className={
            isFullscreen
              ? "relative h-screen w-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-black"
              : "relative h-[420px] overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-slate-950 via-slate-900 to-black"
          }
        >
          <MapFullscreenToggle isFullscreen={isFullscreen} onToggle={toggleFullscreen} />

          {/* faint grid to read as a floor plan / map, same in light & dark
              since this canvas is intentionally always-dark for contrast
              against the heat colors - matches the existing Crowd Heat Map
              panel above it. */}
          <svg
            className="absolute inset-0 h-full w-full opacity-[0.15]"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            {Array.from({ length: 9 }).map((_, i) => (
              <line
                key={`v${i}`}
                x1={(i + 1) * 10}
                y1={0}
                x2={(i + 1) * 10}
                y2={100}
                stroke="white"
                strokeWidth={0.15}
              />
            ))}
            {Array.from({ length: 9 }).map((_, i) => (
              <line
                key={`h${i}`}
                x1={0}
                y1={(i + 1) * 10}
                x2={100}
                y2={(i + 1) * 10}
                stroke="white"
                strokeWidth={0.15}
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
                    key={`grad-${p.station_id}`}
                    id={`heat-${p.station_id}`}
                    cx="50%"
                    cy="50%"
                    r="50%"
                  >
                    <stop offset="0%" stopColor={color} stopOpacity={0.85} />
                    <stop offset="55%" stopColor={color} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={color} stopOpacity={0} />
                  </radialGradient>
                );
              })}
            </defs>

            {/* blended heat blobs - "screen"-style additive blending so
                overlapping high-density stations glow brighter, exactly
                like a real density heatmap. */}
            <g style={{ mixBlendMode: "screen" }}>
              {positioned.map((p) => {
                const pct = p.occupancy_ratio * 100;
                const radius = 8 + pct / 6;
                return (
                  <circle
                    key={`blob-${p.station_id}`}
                    cx={p.x}
                    cy={p.y}
                    r={radius}
                    fill={`url(#heat-${p.station_id})`}
                  />
                );
              })}
            </g>
          </svg>

          {/* station dots + labels on top of the blended glow */}
          {positioned.map((p) => {
            const pct = p.occupancy_ratio * 100;
            const color = heatColor(pct);
            return (
              <div
                key={`dot-${p.station_id}`}
                className="group absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${p.x}%`, top: `${p.y}%` }}
              >
                <div
                  className="h-2.5 w-2.5 rounded-full border-2 border-white/90 shadow"
                  style={{ background: color }}
                />
                <div className="pointer-events-none absolute left-1/2 top-full z-10 mt-1.5 -translate-x-1/2 whitespace-nowrap rounded-md bg-black/80 px-2 py-1 text-[10px] font-semibold text-white opacity-0 transition group-hover:opacity-100">
                  {p.station_name} - {pct.toFixed(0)}%
                </div>
              </div>
            );
          })}

          {!isFullscreen && (
            <div className="pointer-events-none absolute left-4 top-4 z-10 rounded-lg bg-black/60 px-3 py-1.5 text-xs text-white/80">
              {totalPeople.toLocaleString()} people tracked
            </div>
          )}
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-6">
        <LegendDot color="#10b981" label="Low" />
        <LegendDot color="#facc15" label="Medium" />
        <LegendDot color="#f97316" label="High" />
        <LegendDot color="#ef4444" label="Critical" />
      </div>
    </section>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted">
      <span className="h-3 w-3 rounded-full" style={{ background: color }} />
      {label}
    </div>
  );
}
