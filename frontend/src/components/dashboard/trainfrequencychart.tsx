"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Clock3,
  Gauge,
  TrainFront,
} from "lucide-react";

import { useApiData } from "@/hooks/useApiData";
import { getSchedules } from "@/lib/api/schedules";
import { getTrains } from "@/lib/api/trains";
import { getCrowdDashboard } from "@/lib/api/crowd";
import { useSelectedState } from "@/providers/StateProvider";

export default function TrainFrequencyChart() {
  const { selectedState } = useSelectedState();
  const schedules = useApiData(
    () => getSchedules({ state: selectedState ?? undefined }),
    [selectedState],
  );
  const trains = useApiData(() => getTrains(selectedState ?? undefined), [selectedState]);
  const crowd = useApiData(
    () => getCrowdDashboard(selectedState ?? undefined),
    [selectedState],
  );

  const loading = schedules.loading || trains.loading || crowd.loading;

  // Average scheduled frequency (minutes) grouped by arrival hour.
  const byHour = new Map<number, number[]>();
  (schedules.data ?? []).forEach((s) => {
    const hour = Number(s.arrival_time.split(":")[0]);
    const list = byHour.get(hour) ?? [];
    list.push(s.frequency_minutes);
    byHour.set(hour, list);
  });

  const frequencyData = Array.from(byHour.entries())
    .sort(([a], [b]) => a - b)
    .map(([hour, values]) => ({
      time: `${hour.toString().padStart(2, "0")}:00`,
      frequency: Number(
        (values.reduce((sum, v) => sum + v, 0) / values.length).toFixed(1),
      ),
    }));

  const peakSchedules = (schedules.data ?? []).filter((s) => s.is_peak_hour);
  const peakInterval =
    peakSchedules.length > 0
      ? Math.min(...peakSchedules.map((s) => s.frequency_minutes))
      : null;
  const activeTrains = (trains.data ?? []).filter((t) => t.is_active).length;
  const demandLoad =
    (crowd.data ?? []).length > 0
      ? Math.max(...(crowd.data ?? []).map((c) => c.occupancy_ratio)) * 100
      : null;

  const recommendations = [
    {
      label: "Peak interval",
      value: peakInterval !== null ? `${peakInterval} min` : "--",
      icon: Clock3,
    },
    {
      label: "Active trains",
      value: String(activeTrains),
      icon: TrainFront,
    },
    {
      label: "Peak demand load",
      value: demandLoad !== null ? `${demandLoad.toFixed(0)}%` : "--",
      icon: Gauge,
    },
  ];

  return (
    <section className="rounded-3xl border border-border bg-card p-8">
      <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            Train Frequency Optimization
          </h2>

          <p className="mt-2 text-muted">
            Scheduled interval by hour, across all stations
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {recommendations.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.label}
                className="rounded-2xl border border-border bg-background px-4 py-3"
              >
                <div className="flex items-center gap-2 text-primary">
                  <Icon size={17} />
                  <span className="text-xs font-semibold">
                    {item.label}
                  </span>
                </div>

                <strong className="mt-2 block text-xl">
                  {item.value}
                </strong>
              </div>
            );
          })}
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted">Loading schedule data...</p>
      ) : (
      <ResponsiveContainer
        width="100%"
        height={360}
      >
        <AreaChart data={frequencyData}>
          <defs>
            <linearGradient
              id="blueLineFrequency"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor="#6f853f"
                stopOpacity={0.75}
              />
              <stop
                offset="100%"
                stopColor="#6f853f"
                stopOpacity={0.05}
              />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="4 4"
            stroke="var(--border)"
          />
          <XAxis
            dataKey="time"
            stroke="var(--muted)"
          />
          <YAxis
            stroke="var(--muted)"
            label={{
              value: "Minutes",
              angle: -90,
              position: "insideLeft",
            }}
          />
          <Tooltip
            contentStyle={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "14px",
              color: "var(--ink)",
            }}
          />
          <Area
            type="monotone"
            dataKey="frequency"
            name="Scheduled Interval (min)"
            stroke="#6f853f"
            strokeWidth={3}
            fill="url(#blueLineFrequency)"
          />
        </AreaChart>
      </ResponsiveContainer>
      )}
    </section>
  );
}