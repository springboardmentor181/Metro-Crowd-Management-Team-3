"use client";

import { TrendingUp, TrendingDown, Users, Activity } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import LiveStatusBadge from "@/components/dashboard/LiveStatusBadge";
import { useApiData } from "@/hooks/useApiData";
import { useLiveSocket } from "@/hooks/useLiveSocket";
import { getPassengerFlowOverview } from "@/lib/api/analytics";
import { useSelectedState } from "@/providers/StateProvider";
import { queryKeys } from "@/lib/queryKeys";

const FLOW_WINDOW_HOURS = 0.5;

function KpiCard({
  icon,
  iconClass,
  label,
  value,
}: {
  icon: React.ReactNode;
  iconClass: string;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconClass}`}>
          {icon}
        </div>
        <p className="text-sm text-muted">{label}</p>
      </div>
      <p className="mt-3 text-2xl font-bold">{value}</p>
    </div>
  );
}

const fmt = (n: number) => Intl.NumberFormat("en-IN").format(Math.round(n));

export default function PassengerFlowByStation() {
  const { selectedState } = useSelectedState();

  const overview = useApiData(
    queryKeys.passengerFlowOverview,
    (signal) =>
      getPassengerFlowOverview(FLOW_WINDOW_HOURS, selectedState ?? undefined, 8, signal),
    [selectedState],
    30000,
  );

  useLiveSocket({
    crowd_update: () => overview.refresh(),
  });

  const data = overview.data;
  const chartData = (data?.top_stations ?? []).map((s) => ({
    station: s.station_name,
    Entries: s.entries,
    Exits: s.exits,
  }));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={<TrendingUp size={20} className="text-blue-500" />}
          iconClass="bg-blue-500/10"
          label="Total Passenger Inflow"
          value={data ? fmt(data.total_inflow) : "-"}
        />
        <KpiCard
          icon={<TrendingDown size={20} className="text-violet-500" />}
          iconClass="bg-violet-500/10"
          label="Total Passenger Outflow"
          value={data ? fmt(data.total_outflow) : "-"}
        />
        <KpiCard
          icon={<Users size={20} className="text-emerald-500" />}
          iconClass="bg-emerald-500/10"
          label="Net Passenger Flow"
          value={data ? fmt(data.net_flow) : "-"}
        />
        <KpiCard
          icon={<Activity size={20} className="text-orange-500" />}
          iconClass="bg-orange-500/10"
          label="Avg Predicted Occupancy"
          value={data ? `${(data.avg_predicted_occupancy * 100).toFixed(2)}%` : "-"}
        />
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">Passenger Flow by Station</h2>
            <p className="mt-1 text-sm text-muted">Top stations by passenger inflow (last 30 min)</p>
          </div>
          <LiveStatusBadge />
        </div>

        {overview.loading ? (
          <p className="mt-6 text-sm text-muted">Loading...</p>
        ) : chartData.length === 0 ? (
          <p className="mt-6 text-sm text-muted">Not enough data yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={340}>
            <AreaChart data={chartData} margin={{ top: 20, right: 12, bottom: 0, left: 8 }}>
              <defs>
                <linearGradient id="colorEntries" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563EB" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorExits" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F97316" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#F97316" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="4 4" stroke="var(--border)" />

              <XAxis
                dataKey="station"
                stroke="var(--muted)"
                tickLine={false}
                axisLine={{ stroke: "var(--muted)" }}
                interval={0}
                angle={-15}
                textAnchor="end"
                height={50}
              />

              <YAxis
                stroke="var(--muted)"
                tickLine={false}
                axisLine={{ stroke: "var(--muted)" }}
                allowDecimals={false}
                tickFormatter={(v) =>
                  Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 }).format(
                    Number(v),
                  )
                }
              />

              <Tooltip
                contentStyle={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "16px",
                }}
                labelStyle={{ color: "var(--ink)" }}
              />
              <Legend />

              <Area
                type="monotone"
                dataKey="Entries"
                stroke="#2563EB"
                strokeWidth={2.5}
                fill="url(#colorEntries)"
              />
              <Line
                type="monotone"
                dataKey="Exits"
                stroke="#F97316"
                strokeWidth={2.5}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}