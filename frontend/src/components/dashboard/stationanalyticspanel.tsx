// src/components/dashboard/StationAnalyticsPanel.tsx

"use client";

import { ArrowDownRight, ArrowUpRight, BarChart3, Gauge } from "lucide-react";

import { useApiData } from "@/hooks/useApiData";
import { getInflowOutflow, getStationAnalytics } from "@/lib/api/crowd";

interface Props {
  stationId: number | null;
  stationName?: string;
}

export default function StationAnalyticsPanel({ stationId, stationName }: Props) {
  const { data: analytics, loading: analyticsLoading } = useApiData(
    () => getStationAnalytics(stationId as number),
    [stationId],
  );
  const { data: flow, loading: flowLoading } = useApiData(
    () => getInflowOutflow(stationId as number, 24),
    [stationId],
  );

  if (stationId === null) return null;

  const loading = analyticsLoading || flowLoading;

  return (
    <section className="rounded-3xl border border-border bg-card p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Station Analytics</h2>
          <p className="mt-2 text-muted">
            {stationName ?? "Selected station"} - last 24 hours
          </p>
        </div>
        <div className="rounded-xl bg-primary/10 p-3">
          <BarChart3 className="text-primary" size={28} />
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted">Loading station analytics...</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={<ArrowUpRight className="text-emerald-500" size={20} />}
            label="Inflow (24h)"
            value={flow ? flow.inflow.toLocaleString() : "-"}
          />
          <StatCard
            icon={<ArrowDownRight className="text-red-500" size={20} />}
            label="Outflow (24h)"
            value={flow ? flow.outflow.toLocaleString() : "-"}
          />
          <StatCard
            icon={<Gauge className="text-primary" size={20} />}
            label="Average occupancy"
            value={analytics ? analytics.average_count_24h.toLocaleString() : "-"}
          />
          <StatCard
            icon={<Gauge className="text-orange-500" size={20} />}
            label="Peak occupancy"
            value={analytics ? analytics.peak_count_24h.toLocaleString() : "-"}
          />
        </div>
      )}

      {!loading && flow && flow.samples < 3 && (
        <p className="mt-6 rounded-xl bg-primary/5 p-4 text-sm text-muted">
          Only {flow.samples} crowd reading{flow.samples === 1 ? "" : "s"} recorded
          for this station in the last 24h, so these numbers will look flat.
          Turn on the live simulator (<code>ENABLE_SIMULATOR=True</code> in the
          backend&apos;s <code>.env</code>) so a new AI-predicted reading lands
          every 30 seconds and this panel fills in with real trend data.
        </p>
      )}
    </section>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-background p-5">
      <div className="mb-3 flex items-center gap-2">
        {icon}
        <span className="text-sm text-muted">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}