"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Button } from "@/components/ui/Button";
import { useApiData } from "@/hooks/useApiData";
import { useDebouncedRefresh } from "@/hooks/useDebouncedRefresh";
import { useLiveSocket } from "@/hooks/useLiveSocket";
import { getAggregateTrafficPattern } from "@/lib/api/predictions";
import { queryKeys } from "@/lib/queryKeys";
import { useSelectedState } from "@/providers/StateProvider";

interface HourPoint {
  hour: string;
  passengers: number;
}

export default function PassengerChart() {
  const { selectedState } = useSelectedState();

  const forecast = useApiData(
    queryKeys.trafficPattern,
    (signal) => getAggregateTrafficPattern(selectedState ?? undefined, signal),
    [selectedState],
    60000,
  );

  const debouncedForecastRefresh = useDebouncedRefresh(forecast.refresh);
  useLiveSocket({
    crowd_update: debouncedForecastRefresh,
    delay_alert: debouncedForecastRefresh,
  });

  const data: HourPoint[] = useMemo(() => {
    if (!forecast.data) return [];
    return forecast.data.hourly_forecast
      .slice()
      .sort((a, b) => a.hour - b.hour)
      .map((point) => ({
        hour: `${point.hour.toString().padStart(2, "0")}:00`,
        passengers: point.predicted_count,
      }));
  }, [forecast.data]);

  const showError = forecast.error && data.length === 0;
  const showLoading = forecast.loading && data.length === 0 && !showError;

  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-7">
      <div className="mb-6 flex items-center justify-between gap-4">

        <div>

          <h2 className="text-2xl font-bold">
            Passenger Analytics
          </h2>

          <p className="mt-2 text-muted">
            {selectedState
              ? `Today's Predicted Traffic (${selectedState}, 24hr)`
              : "Today's Predicted Traffic (All Stations, 24hr)"}
          </p>

        </div>

        <div className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white">
          AI Forecast
        </div>

      </div>

      {showError ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
          <p className="text-sm text-muted">
            Couldn&apos;t load the forecast right now - the prediction service may be slow or unreachable.
          </p>
          <Button onClick={forecast.refresh} variant="secondary" size="sm">
            Retry
          </Button>
        </div>
      ) : showLoading ? (
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
            stroke="var(--border)"
          />

          <XAxis
            dataKey="hour"
            stroke="var(--muted)"
            tickLine={false}
            axisLine={{
              stroke: "var(--muted)",
            }}
          />

          <YAxis
            stroke="var(--muted)"
            width={92}
            tickMargin={12}
            tickLine={false}
            axisLine={{
              stroke: "var(--muted)",
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
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "16px",
            }}
            labelStyle={{
              color: "var(--ink)",
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
