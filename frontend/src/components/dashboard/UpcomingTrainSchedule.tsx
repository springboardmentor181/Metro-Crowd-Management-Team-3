"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { useApiData } from "@/hooks/useApiData";
import { getUpcomingSchedules } from "@/lib/api/schedules";
import { useSelectedState } from "@/providers/StateProvider";
import { queryKeys } from "@/lib/queryKeys";
import type { ScheduleStatus } from "@/lib/api/types";

type StatusFilter = "all" | ScheduleStatus;

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "on_time", label: "On Time" },
  { value: "delayed", label: "Delayed" },
];

function formatTime(value: string) {
  const [h, m] = value.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

function statusMeta(status: ScheduleStatus, delayMinutes: number) {
  if (status === "delayed") {
    return {
      label: delayMinutes > 0 ? `Delayed ${delayMinutes}m` : "Delayed",
      dot: "bg-red-500",
      text: "text-red-500",
    };
  }
  if (status === "cancelled") {
    return { label: "Cancelled", dot: "bg-red-600", text: "text-red-600" };
  }
  if (status === "completed") {
    return { label: "Completed", dot: "bg-slate-400", text: "text-muted" };
  }
  return { label: "On Time", dot: "bg-emerald-500", text: "text-emerald-500" };
}

export default function UpcomingTrainSchedule() {
  const { selectedState } = useSelectedState();
  const [status, setStatus] = useState<StatusFilter>("all");

  const { data, loading, error } = useApiData(
    queryKeys.upcomingSchedules,
    (signal) =>
      getUpcomingSchedules(
        selectedState ?? undefined,
        status === "all" ? undefined : status,
        20,
        signal,
      ),
    [selectedState, status],
    30000,
  );

  const rows = useMemo(() => data ?? [], [data]);

  return (
    <section className="rounded-3xl border border-border bg-card p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Upcoming Train Schedule</h2>
          <p className="mt-2 text-sm text-muted">
            {selectedState ?? "All cities"} - next departures, live from the timetable.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as StatusFilter)}
            className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground outline-none transition hover:border-primary focus:border-primary"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <Link
            href="/train-scheduling"
            className="text-xs font-semibold text-primary hover:underline"
          >
            View Full Schedule
          </Link>
        </div>
      </div>

      {loading && !data && <p className="text-sm text-muted">Loading schedule...</p>}
      {error && !data && <p className="text-sm text-red-500">{error}</p>}

      {data && rows.length === 0 && (
        <p className="text-sm text-muted">
          No {status === "all" ? "" : `${status.replace("_", " ")} `}departures found for{" "}
          {selectedState ?? "this selection"}.
        </p>
      )}

      {rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs font-semibold uppercase tracking-wide text-muted">
                <th className="pb-3">Train</th>
                <th className="pb-3">Line</th>
                <th className="pb-3">From</th>
                <th className="pb-3">To</th>
                <th className="pb-3">Time</th>
                <th className="pb-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const meta = statusMeta(row.status, row.delay_minutes);
                return (
                  <tr key={row.id} className="border-b border-border/60 last:border-b-0">
                    <td className="py-3.5 font-bold">{row.train_number}</td>
                    <td className="py-3.5">
                      <span className="inline-flex items-center gap-1.5 font-medium">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ background: row.line_color ?? "#94a3b8" }}
                        />
                        {row.line_name ?? "-"}
                      </span>
                    </td>
                    <td className="py-3.5 text-muted">{row.from_station_name}</td>
                    <td className="py-3.5 text-muted">{row.to_station_name ?? "Terminal"}</td>
                    <td className="py-3.5 font-semibold">{formatTime(row.departure_time)}</td>
                    <td className="py-3.5 text-right">
                      <span className="inline-flex items-center gap-1.5">
                        <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
                        <span className={`font-medium ${meta.text}`}>{meta.label}</span>
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