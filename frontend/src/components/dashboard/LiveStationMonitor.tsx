"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, Radio } from "lucide-react";

import { useApiData } from "@/hooks/useApiData";
import { useLiveSocket } from "@/hooks/useLiveSocket";
import { useLiveSocketContext } from "@/providers/LiveSocketProvider";
import { getStationMonitor } from "@/lib/api/crowd";
import { useSelectedState } from "@/providers/StateProvider";
import { queryKeys } from "@/lib/queryKeys";
import type { CrowdLevel, StationMonitorEntry } from "@/lib/api/types";

type LevelFilter = "all" | CrowdLevel;

type LiveStationState = Record<number, { current_count: number; crowd_level: CrowdLevel }>;

const LEVEL_OPTIONS: { value: LevelFilter; label: string }[] = [
  { value: "all", label: "All levels" },
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "moderate", label: "Medium" },
  { value: "low", label: "Low" },
];

function levelMeta(level: CrowdLevel, occupancyPct: number) {
  switch (level) {
    case "critical":
      return {
        label: occupancyPct >= 95 ? "Very High" : "Critical",
        dot: "bg-red-500",
        text: "text-red-500",
      };
    case "high":
      return { label: "High", dot: "bg-orange-500", text: "text-orange-500" };
    case "moderate":
      return { label: "Medium", dot: "bg-amber-500", text: "text-amber-500" };
    default:
      return { label: "Low", dot: "bg-emerald-500", text: "text-emerald-500" };
  }
}

export default function LiveStationMonitor() {
  const { selectedState } = useSelectedState();
  const { isConnected } = useLiveSocketContext();
  const [level, setLevel] = useState<LevelFilter>("all");

  const { data, loading, error } = useApiData(
    queryKeys.stationMonitor,
    (signal) => getStationMonitor(selectedState ?? undefined, 1, signal),
    [selectedState],
    isConnected ? 15000 : 10000,
  );

  // Live crowd_update pushes patch density/status instantly between polls -
  // inflow/outflow stay at the last poll's value until the next refresh
  // (they're a windowed delta, not a single live number).
  const [liveById, setLiveById] = useState<LiveStationState>({});

  useLiveSocket({
    crowd_update: (payload) => {
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

  const merged: StationMonitorEntry[] = useMemo(() => {
    return (data ?? []).map((entry) => {
      const live = liveById[entry.station_id];
      if (!live) return entry;
      const occupancy_ratio = entry.capacity
        ? live.current_count / entry.capacity
        : entry.occupancy_ratio;
      return {
        ...entry,
        current_count: live.current_count,
        crowd_level: live.crowd_level,
        occupancy_ratio,
      };
    });
  }, [data, liveById]);

  const filtered = useMemo(
    () => (level === "all" ? merged : merged.filter((s) => s.crowd_level === level)),
    [merged, level],
  );

  return (
    <section className="rounded-3xl border border-border bg-card p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Live Station Monitor</h2>
          <p className="mt-2 text-sm text-muted">
            {selectedState ?? "All cities"} - density, status and passenger flow per station.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isConnected && (
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-500">
              <Radio size={12} className="animate-pulse" />
              Live
            </span>
          )}

          <select
            value={level}
            onChange={(e) => setLevel(e.target.value as LevelFilter)}
            className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground outline-none transition hover:border-primary focus:border-primary"
          >
            {LEVEL_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <Link
            href="/crowd-monitor"
            className="text-xs font-semibold text-primary hover:underline"
          >
            View All
          </Link>
        </div>
      </div>

      {loading && !data && <p className="text-sm text-muted">Loading station data...</p>}
      {error && !data && <p className="text-sm text-red-500">{error}</p>}

      {data && filtered.length === 0 && (
        <p className="text-sm text-muted">
          No stations match this filter for {selectedState ?? "this selection"}.
        </p>
      )}

      {filtered.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs font-semibold uppercase tracking-wide text-muted">
                <th className="pb-3">Station</th>
                <th className="pb-3">Density</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Passenger In/Out</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => {
                const pct = Math.round(s.occupancy_ratio * 100);
                const meta = levelMeta(s.crowd_level, pct);
                return (
                  <tr key={s.station_id} className="border-b border-border/60 last:border-b-0">
                    <td className="py-3.5 font-semibold">{s.station_name}</td>
                    <td className={`py-3.5 font-bold ${meta.text}`}>{pct}%</td>
                    <td className="py-3.5">
                      <span className="inline-flex items-center gap-1.5">
                        <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
                        <span className={`font-medium ${meta.text}`}>{meta.label}</span>
                      </span>
                    </td>
                    <td className="py-3.5 text-right">
                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-500">
                        <ArrowUp size={13} />
                        {s.inflow.toLocaleString()}
                      </span>
                      <span className="mx-1.5 text-muted">/</span>
                      <span className="inline-flex items-center gap-1 font-semibold text-red-500">
                        <ArrowDown size={13} />
                        {s.outflow.toLocaleString()}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}