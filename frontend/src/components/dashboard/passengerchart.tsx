"use client";

import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useStations } from "@/hooks/useStations";
import { getTrafficPattern } from "@/lib/api/predictions";

interface HourPoint {
  hour: string;
  passengers: number;
}

export default function PassengerChart() {
  const { data: stations, loading: stationsLoading } = useStations();
  const [data, setData] = useState<HourPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!stations || stations.length === 0) return;

    let cancelled = false;

    Promise.all(stations.map((s) => getTrafficPattern(s.id)))
      .then((patterns) => {
        if (cancelled) return;

        const totals = new Array(24).fill(0);
        patterns.forEach((pattern) => {
          pattern.hourly_forecast.forEach((point) => {
            totals[point.hour] += point.predicted_count;
          });
        });

        setData(
          totals.map((value, hour) => ({
            hour: `${hour.toString().padStart(2, "0")}:00`,
            passengers: value,
          })),
        );
        setLoading(false);
      })
      .catch(() => setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [stations]);

  const isLoading = stationsLoading || loading;

  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-7">
      <div className="mb-6 flex items-center justify-between gap-4">

        <div>

          <h2 className="text-2xl font-bold">
            Passenger Analytics
          </h2>

          <p className="mt-2 text-muted">
            Today&apos;s Predicted Traffic (All Stations, 24hr)
          </p>

        </div>

        <div className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white">
          AI Forecast
        </div>

      </div>

      {isLoading ? (
        <p className="text-sm text-muted">Loading forecast...</p>
      ) : (
      <ResponsiveContainer width="100%" height={360}>
        <AreaChart
          data={data}
          margin={{
            top: 12,
            right: 12,
            bottom: 0,
            left: 28,
          }}
        >

          <defs>

            <linearGradient
              id="colorPassenger"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor="#2563EB"
                stopOpacity={0.8}
              />

              <stop
                offset="100%"
                stopColor="#2563EB"
                stopOpacity={0}
              />

            </linearGradient>

          </defs>

          <CartesianGrid
            strokeDasharray="4 4"
            stroke="#374151"
          />

          <XAxis
            dataKey="hour"
            stroke="#94A3B8"
            tickLine={false}
            axisLine={{
              stroke: "#94A3B8",
            }}
          />

          <YAxis
            stroke="#94A3B8"
            width={92}
            tickMargin={12}
            tickLine={false}
            axisLine={{
              stroke: "#94A3B8",
            }}
            allowDecimals={false}
            tickFormatter={(value) =>
              Intl.NumberFormat("en-IN", {
                notation: "compact",
                maximumFractionDigits: 1,
              }).format(Number(value))
            }
          />

          <Tooltip
            contentStyle={{
              background: "#111827",
              border: "1px solid #1F2937",
              borderRadius: "16px",
            }}
            labelStyle={{
              color: "#fff",
            }}
          />

          <Area
            type="monotone"
            dataKey="passengers"
            stroke="#2563EB"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorPassenger)"
          />

        </AreaChart>

      </ResponsiveContainer>
      )}

    </div>
  );
}