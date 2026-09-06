"use client";

import {
  AlertTriangle,
  Clock3,
  CheckCircle2,
  Radio,
} from "lucide-react";

import { useState } from "react";
import { useApiData } from "@/hooks/useApiData";
import { useLiveSocket } from "@/hooks/useLiveSocket";
import { useLiveSocketContext } from "@/providers/LiveSocketProvider";
import { getCrowdDashboard } from "@/lib/api/crowd";
import { getDelayedSchedules, getDelayedSchedulesCount } from "@/lib/api/schedules";
import { useStations } from "@/hooks/useStations";
import { useSelectedState } from "@/providers/StateProvider";
import { queryKeys } from "@/lib/queryKeys";

interface AlertItem {
  key: string;
  station: string;
  message: string;
  type: "high" | "warning" | "success";
  priority: number; 
}

const MAX_ALERTS_SHOWN = 10;

const DELAYED_FETCH_LIMIT = 50;

export default function RecentAlerts() {
  const { selectedState } = useSelectedState();
  const { isConnected } = useLiveSocketContext();
  
  const crowd = useApiData(
    queryKeys.crowdDashboard,
    (signal) => getCrowdDashboard(selectedState ?? undefined, signal),
    [selectedState],
    isConnected ? 0 : 30000,
  );
  
  const delayed = useApiData(
    queryKeys.delayedSchedules,
    (signal) => getDelayedSchedules(undefined, selectedState ?? undefined, signal, DELAYED_FETCH_LIMIT),
    [selectedState],
    isConnected ? 0 : 30000,
  );
  const delayedCount = useApiData(
    `${queryKeys.delayedSchedules}-count`,
    (signal) => getDelayedSchedulesCount(undefined, selectedState ?? undefined, signal),
    [selectedState],
    isConnected ? 0 : 30000,
  );
  const { data: stations } = useStations();

  const [connected, setConnected] = useState(false);
  useLiveSocket({
    crowd_update: () => {
      setConnected(true);
      crowd.refresh();
    },
    delay_alert: () => {
      setConnected(true);
      delayed.refresh();
      delayedCount.refresh();
    },
    station_alert: () => {
      setConnected(true);
      crowd.refresh();
      delayed.refresh();
      delayedCount.refresh();
    },
  });

  const loading = crowd.loading || delayed.loading;
  const stationById = new Map((stations ?? []).map((s) => [s.id, s]));

  const crowdAlerts: AlertItem[] = (crowd.data ?? [])
    .filter((s) => s.crowd_level === "high" || s.crowd_level === "critical")
    .map((s) => ({
      key: `crowd-${s.station_id}`,
      station: s.station_name,
      message: `Passenger density is ${s.crowd_level} (${Math.round(s.occupancy_ratio * 100)}% occupancy).`,
      type: "high",
      priority: s.occupancy_ratio * 100,
    }));

  const delayAlerts: AlertItem[] = (delayed.data ?? []).map((s) => ({
    key: `delay-${s.id}`,
    station: stationById.get(s.station_id)?.station_name ?? `Station #${s.station_id}`,
    message: `Train delayed by ${s.delay_minutes} minutes.`,
    type: "warning",
    
    priority: Math.min(100, s.delay_minutes * 3),
  }));

  const alerts = [...crowdAlerts, ...delayAlerts]
    .sort((a, b) => b.priority - a.priority)
    .slice(0, MAX_ALERTS_SHOWN);

  const totalAlertCount = crowdAlerts.length + (delayedCount.data ?? delayAlerts.length);

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

      <div className="mb-8 flex items-start justify-between gap-4">

        <div>

          <h2 className="text-2xl font-bold">
            Recent Alerts
          </h2>

          <p className="mt-2 text-sm text-muted">
            Derived from live crowd and schedule data
            {totalAlertCount > MAX_ALERTS_SHOWN && (
              <> - top {MAX_ALERTS_SHOWN} most urgent of {totalAlertCount}</>
            )}
          </p>

        </div>

        {connected && (
          <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-500">
            <Radio size={12} className="animate-pulse" />
            Live
          </span>
        )}

      </div>

      {loading ? (
        <p className="text-sm text-muted">Loading...</p>
      ) : (
      <div className="space-y-6">

        {alerts.map((item) => (

          <div
            key={item.key}
            className="
            rounded-2xl
            border
            border-border
            p-5
            transition
            hover:border-primary
            "
          >

            <div className="flex justify-between">

              <div>

                <h4 className="font-semibold">
                  {item.station}
                </h4>

                <p className="mt-2 text-sm text-muted">
                  {item.message}
                </p>

              </div>

              {item.type === "high" && (
                <AlertTriangle
                  className="text-red-500"
                  size={22}
                />
              )}

              {item.type === "warning" && (
                <Clock3
                  className="text-orange-500"
                  size={22}
                />
              )}

              {item.type === "success" && (
                <CheckCircle2
                  className="text-emerald-500"
                  size={22}
                />
              )}

            </div>

          </div>

        ))}

        {alerts.length === 0 && (
          <div className="rounded-2xl border border-border p-5 text-center">
            <CheckCircle2 className="mx-auto text-emerald-500" size={22} />
            <p className="mt-3 text-sm text-muted">
              No active alerts - all stations and trains are operating normally.
            </p>
          </div>
        )}

      </div>
      )}

    </div>
  );
}