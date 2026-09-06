"use client";

import { useState } from "react";
import { Download, FileBarChart, TrendingUp, Clock3, CheckCircle2 } from "lucide-react";

import { useApiData } from "@/hooks/useApiData";
import { getTrafficReport, getOperationalSummary } from "@/lib/api/analytics";
import { useSelectedState } from "@/providers/StateProvider";
import { queryKeys } from "@/lib/queryKeys";

const WINDOW_OPTIONS = [6, 24, 72] as const;

function toCsv(
  rows: { station_id: number; station_name: string; average_count: number; peak_count: number }[],
) {
  const header = "Station,Average Count,Peak Count";
  const body = rows
    .map((r) => `${JSON.stringify(r.station_name)},${r.average_count},${r.peak_count}`)
    .join("\n");
  return `${header}\n${body}`;
}

function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ReportsPanel() {
  const { selectedState } = useSelectedState();
  const [hours, setHours] = useState<(typeof WINDOW_OPTIONS)[number]>(24);

  const traffic = useApiData(
    queryKeys.trafficReport,
    (signal) => getTrafficReport(hours, selectedState ?? undefined, signal),
    [hours, selectedState],
  );

  const summary = useApiData(
    queryKeys.operationalSummary,
    (signal) => getOperationalSummary(selectedState ?? undefined, signal),
    [selectedState],
  );

  const loading = traffic.loading || summary.loading;

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-border bg-card p-8">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Operational Report</h2>
            <p className="mt-2 text-sm text-muted">
              Generated from live ridership and schedule data for the selected window.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {WINDOW_OPTIONS.map((h) => (
              <button
                key={h}
                onClick={() => setHours(h)}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
                  hours === h
                    ? "border-primary bg-primary text-white"
                    : "border-border text-muted hover:border-primary hover:text-primary"
                }`}
              >
                {h}h
              </button>
            ))}
            <button
              disabled={!traffic.data}
              onClick={() =>
                traffic.data &&
                downloadCsv(
                  `metroflow-traffic-report-${hours}h.csv`,
                  toCsv(traffic.data.stations),
                )
              }
              className="flex items-center gap-2 rounded-full border border-border px-3.5 py-1.5 text-xs font-semibold text-muted transition hover:border-primary hover:text-primary disabled:opacity-40"
            >
              <Download size={14} />
              Export CSV
            </button>
          </div>
        </div>

        {loading && !summary.data && <p className="text-sm text-muted">Building report...</p>}

        {summary.data && (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <ReportStat
              icon={<FileBarChart size={20} />}
              label="Active Stations"
              value={summary.data.active_stations.toLocaleString()}
            />
            <ReportStat
              icon={<TrendingUp size={20} />}
              label="Scheduled Trips"
              value={summary.data.total_scheduled_trips.toLocaleString()}
            />
            <ReportStat
              icon={<Clock3 size={20} />}
              label="Currently Delayed"
              value={summary.data.currently_delayed.toLocaleString()}
            />
            <ReportStat
              icon={<CheckCircle2 size={20} />}
              label="On-time Rate"
              value={`${(summary.data.on_time_rate * 100).toFixed(1)}%`}
            />
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-border bg-card p-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h3 className="text-xl font-bold">Station Traffic - last {hours}h</h3>
          {traffic.data?.busiest_station && (
            <span className="rounded-full bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary">
              Busiest: {traffic.data.busiest_station.station_name}
            </span>
          )}
        </div>

        {traffic.data && traffic.data.stations.length === 0 && (
          <p className="text-sm text-muted">No traffic recorded in this window yet.</p>
        )}

        {traffic.data && traffic.data.stations.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-muted">
                  <th className="pb-3 font-semibold">Station</th>
                  <th className="pb-3 font-semibold">Average Count</th>
                  <th className="pb-3 font-semibold">Peak Count</th>
                </tr>
              </thead>
              <tbody>
                {traffic.data.stations.map((row) => (
                  <tr key={row.station_id} className="border-b border-border/60 last:border-b-0">
                    <td className="py-3 font-medium">{row.station_name}</td>
                    <td className="py-3 text-muted">{Math.round(row.average_count).toLocaleString()}</td>
                    <td className="py-3 text-muted">{row.peak_count.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {traffic.data && (
          <p className="mt-6 text-xs text-muted">
            Report generated {new Date(traffic.data.generated_at).toLocaleString()} -
            {" "}
            {traffic.data.currently_delayed_schedules} schedule(s) currently delayed.
          </p>
        )}
      </section>
    </div>
  );
}

function ReportStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border p-5">
      <div className="flex items-center justify-between text-muted">
        <span className="text-xs font-semibold">{label}</span>
        {icon}
      </div>
      <p className="mt-4 text-2xl font-bold">{value}</p>
    </div>
  );
}
