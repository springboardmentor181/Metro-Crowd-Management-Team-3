"use client";

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
import { getCrowdDashboard } from "@/lib/api/crowd";
import { useSelectedState } from "@/providers/StateProvider";

const colors = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#3b82f6",
  "#10b981",
  "#06b6d4",
];

export default function StationOccupancyChart() {
  const { selectedState } = useSelectedState();
  const { data, loading } = useApiData(
    () => getCrowdDashboard(selectedState ?? undefined),
    [selectedState],
  );

  const chartData = (data ?? [])
    .map((s) => ({
      station: s.station_name,
      occupancy: Math.round(s.occupancy_ratio * 100),
    }))
    .sort((a, b) => b.occupancy - a.occupancy);

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
            stroke="#374151"
          />

          <XAxis
            dataKey="station"
            stroke="#94A3B8"
          />

          <YAxis
            stroke="#94A3B8"
          />

          <Tooltip
            cursor={{
              fill: "rgba(59,130,246,.08)",
            }}
            contentStyle={{
              background: "#111827",
              border: "1px solid #1f2937",
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