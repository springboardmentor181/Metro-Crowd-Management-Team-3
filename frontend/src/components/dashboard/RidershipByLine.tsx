"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { useApiData } from "@/hooks/useApiData";
import { useDebouncedRefresh } from "@/hooks/useDebouncedRefresh";
import { useLiveSocket } from "@/hooks/useLiveSocket";
import { getPassengerFlowOverview } from "@/lib/api/analytics";
import { useSelectedState } from "@/providers/StateProvider";
import { queryKeys } from "@/lib/queryKeys";

const FALLBACK_COLORS = [
  "#2563EB", "#8B5CF6", "#F97316", "#22C55E", "#EF4444",
  "#EAB308", "#EC4899", "#06B6D4", "#84CC16", "#F59E0B",
];

export default function RidershipByLine() {
  const { selectedState } = useSelectedState();

  const overview = useApiData(
    queryKeys.passengerFlowOverview,
    (signal) => getPassengerFlowOverview(24, selectedState ?? undefined, 8, signal),
    [selectedState],
    30000,
  );

  const debouncedOverviewRefresh = useDebouncedRefresh(overview.refresh);
  useLiveSocket({
    crowd_update: debouncedOverviewRefresh,
  });

  const lines = overview.data?.ridership_by_line ?? [];

  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-7">
      <h2 className="text-xl font-bold">Ridership by Line</h2>
      <p className="mt-1 text-sm text-muted">Passenger inflow by metro line</p>

      {overview.loading ? (
        <p className="mt-6 text-sm text-muted">Loading...</p>
      ) : lines.length === 0 ? (
        <p className="mt-6 text-sm text-muted">Not enough data yet.</p>
      ) : (
        <ResponsiveContainer width="100%" height={340}>
          <PieChart>
            <Pie
              data={lines}
              dataKey="passenger_count"
              nameKey="line_name"
              innerRadius={70}
              outerRadius={110}
              paddingAngle={2}
            >
              {lines.map((line, i) => (
                <Cell
                  key={line.line_name}
                  fill={line.color || FALLBACK_COLORS[i % FALLBACK_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "16px",
              }}
              labelStyle={{ color: "var(--ink)" }}
              formatter={(value) => Intl.NumberFormat("en-IN").format(Number(value ?? 0))}
            />
            <Legend
              layout="horizontal"
              verticalAlign="bottom"
              wrapperStyle={{ fontSize: 12 }}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}