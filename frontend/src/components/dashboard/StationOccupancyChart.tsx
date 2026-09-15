"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useApiData } from "@/hooks/useApiData";
import { useLiveSocket } from "@/hooks/useLiveSocket";
import { useLiveSocketContext } from "@/providers/LiveSocketProvider";
import { getCrowdDashboard } from "@/lib/api/crowd";
import { useSelectedState } from "@/providers/StateProvider";
import { queryKeys } from "@/lib/queryKeys";

const colors = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#3b82f6",
  "#10b981",
  "#06b6d4",
];

const TOP_N_STATIONS = 15;

export default function StationOccupancyChart() {
  const { selectedState } = useSelectedState();
  const { isConnected } = useLiveSocketContext();
  
  const { data, loading } = useApiData(
    queryKeys.crowdDashboard,
    (signal) => getCrowdDashboard(selectedState ?? undefined, signal),
    [selectedState],
    isConnected ? 0 : 30000,
  );

  const [liveById, setLiveById] = useState<Record<number, { current_count: number; crowd_level: string }>>({});

  useEffect(() => {
    setLiveById({});
  }, [data]);

  useLiveSocket({
    crowd_update: (payload) => {
      setLiveById((prev) => {
        const next = { ...prev };
        for (const u of payload.updates) {
          next[u.station_id] = {
            current_count: u.current_count,
            crowd_level: u.crowd_level,
          };
        }
        return next;
      });
    },
  });

  const sortedData = useMemo(() => {
    return (data ?? [])
      .map((s) => {
        const live = liveById[s.station_id];
        const count = live ? live.current_count : s.current_count;
        const ratio = s.capacity > 0 ? count / s.capacity : s.occupancy_ratio;

        return {
          station: s.station_name,
          occupancy: Math.round(Math.min(ratio, 1) * 100),
        };
      })
      .sort((a, b) => b.occupancy - a.occupancy);
  }, [data, liveById]);

  const chartData = sortedData.slice(0, TOP_N_STATIONS);
  const hiddenCount = sortedData.length - chartData.length;

  return (
    <div
      className="
      rounded-3xl
      border
      border-border
      bg-card
      p-8
      "
    >
      <div className="mb-8">

        <h2 className="text-2xl font-bold">
          Station Occupancy
        </h2>

        <p className="mt-2 text-muted">
          Live Crowd Distribution
          {hiddenCount > 0 && (
            <span className="ml-2 text-xs text-muted/70">
              (Top {TOP_N_STATIONS} by occupancy - {hiddenCount} more station
              {hiddenCount === 1 ? "" : "s"} not shown)
            </span>
          )}
        </p>

      </div>

      {loading ? (
        <p className="text-sm text-muted">Loading...</p>
      ) : (
      <ResponsiveContainer
        width="100%"
        height={350}
      >
        <BarChart data={chartData}>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border)"
          />

          <XAxis
            dataKey="station"
            stroke="var(--muted)"
          />

          <YAxis
            stroke="var(--muted)"
          />

          <Tooltip
            cursor={{
              fill: "rgba(59,130,246,.08)",
            }}
            contentStyle={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "16px",
            }}
          />

          <Bar
            dataKey="occupancy"
            radius={[8, 8, 0, 0]}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={entry.station}
                fill={colors[index % colors.length]}
              />
            ))}
          </Bar>

        </BarChart>

      </ResponsiveContainer>
      )}

    </div>
  );
}
