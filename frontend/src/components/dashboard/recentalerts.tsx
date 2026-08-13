"use client";

import {
  AlertTriangle,
  Clock3,
  CheckCircle2,
} from "lucide-react";

import { useApiData } from "@/hooks/useApiData";
import { getCrowdDashboard } from "@/lib/api/crowd";
import { getDelayedSchedules } from "@/lib/api/schedules";
import { useStations } from "@/hooks/useStations";
import { useSelectedState } from "@/providers/StateProvider";

interface AlertItem {
  key: string;
  station: string;
  message: string;
  type: "high" | "warning" | "success";
}

export default function RecentAlerts() {
  const { selectedState } = useSelectedState();
  const crowd = useApiData(() => getCrowdDashboard(selectedState ?? undefined), [selectedState]);
  const delayed = useApiData(
    () => getDelayedSchedules(undefined, selectedState ?? undefined),
    [selectedState],
  );
  const { data: stations } = useStations();

  const loading = crowd.loading || delayed.loading;
  const stationById = new Map((stations ?? []).map((s) => [s.id, s]));

  const crowdAlerts: AlertItem[] = (crowd.data ?? [])
    .filter((s) => s.crowd_level === "high" || s.crowd_level === "critical")
    .map((s) => ({
      key: `crowd-${s.station_id}`,
      station: s.station_name,
      message: `Passenger density is ${s.crowd_level} (${Math.round(s.occupancy_ratio * 100)}% occupancy).`,
      type: "high",
    }));

  const delayAlerts: AlertItem[] = (delayed.data ?? []).map((s) => ({
    key: `delay-${s.id}`,
    station: stationById.get(s.station_id)?.station_name ?? `Station #${s.station_id}`,
    message: `Train delayed by ${s.delay_minutes} minutes.`,
    type: "warning",
  }));

  const alerts = [...crowdAlerts, ...delayAlerts].slice(0, 6);

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
          Recent Alerts
        </h2>

        <p className="mt-2 text-sm text-muted">
          Derived from live crowd and schedule data
        </p>

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