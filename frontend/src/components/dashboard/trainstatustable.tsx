// src/components/dashboard/TrainStatusTable.tsx

"use client";

import { useMemo, useState } from "react";
import {
  Search,
  Circle,
  TrainFront,
} from "lucide-react";

import { useApiData } from "@/hooks/useApiData";
import { useStations } from "@/hooks/useStations";
import { getSchedules } from "@/lib/api/schedules";
import { getTrains } from "@/lib/api/trains";
import { getCrowdDashboard } from "@/lib/api/crowd";
import { useSelectedState } from "@/providers/StateProvider";

export default function TrainStatusTable() {
  const [search, setSearch] = useState("");
  const { selectedState } = useSelectedState();

  const schedules = useApiData(
    () => getSchedules({ state: selectedState ?? undefined }),
    [selectedState],
  );
  const trains = useApiData(() => getTrains(selectedState ?? undefined), [selectedState]);
  const crowd = useApiData(() => getCrowdDashboard(selectedState ?? undefined), [selectedState]);
  const { data: stations } = useStations();

  const loading = schedules.loading || trains.loading || crowd.loading;

  const rows = useMemo(() => {
    const trainById = new Map((trains.data ?? []).map((t) => [t.id, t]));
    const stationById = new Map((stations ?? []).map((s) => [s.id, s]));
    const crowdByStation = new Map((crowd.data ?? []).map((c) => [c.station_id, c]));

    return (schedules.data ?? []).map((schedule) => {
      const train = trainById.get(schedule.train_id);
      const station = stationById.get(schedule.station_id);
      const occupancy = crowdByStation.get(schedule.station_id);

      const status =
        schedule.status === "delayed"
          ? "Delayed"
          : train?.status === "maintenance"
          ? "Maintenance"
          : "Running";

      return {
        id: schedule.id,
        trainNumber: train?.train_number ?? `Train #${schedule.train_id}`,
        station: station?.station_name ?? `Station #${schedule.station_id}`,
        occupancy: occupancy ? Math.round(occupancy.occupancy_ratio * 100) : 0,
        delay: schedule.delay_minutes,
        status: status as "Running" | "Delayed" | "Maintenance",
      };
    });
  }, [schedules.data, trains.data, stations, crowd.data]);

  const filtered = rows.filter((row) =>
    `${row.trainNumber} ${row.station}`.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <section className="rounded-3xl border border-border bg-card p-8">

      <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

        <div>

          <h2 className="text-2xl font-bold">
            Live Train Status
          </h2>

          <p className="mt-2 text-muted">
            Scheduled trains and current occupancy
          </p>

        </div>

        <div className="relative w-full lg:w-96">

          <Search
            size={18}
            className="absolute left-4 top-3.5 text-muted"
          />

          <input
            placeholder="Search train or station..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="
            h-12
            w-full
            rounded-xl
            border
            border-border
            bg-background
            pl-11
            pr-4
            outline-none
            focus:border-primary
            "
          />

        </div>

      </div>

      {loading ? (
        <p className="text-sm text-muted">Loading train status...</p>
      ) : (
      <div className="overflow-x-auto">

        <table className="w-full">

          <thead>

            <tr className="border-b border-border">

              <th className="px-4 py-4 text-left font-semibold">
                Train
              </th>

              <th className="px-4 py-4 text-left">
                Station
              </th>

              <th className="px-4 py-4 text-center">
                Occupancy
              </th>

              <th className="px-4 py-4 text-center">
                Delay
              </th>

              <th className="px-4 py-4 text-center">
                Status
              </th>

            </tr>

          </thead>

          <tbody>

            {filtered.map((train) => (

              <tr
                key={train.id}
                className="border-b border-border transition hover:bg-muted/40"
              >

                <td className="px-4 py-5">

                  <div className="flex items-center gap-4">

                    <div
                      className="
                      flex
                      h-12
                      w-12
                      items-center
                      justify-center
                      rounded-xl
                      bg-primary/10
                      "
                    >

                      <TrainFront
                        className="text-primary"
                        size={22}
                      />

                    </div>

                    <div>

                      <h4 className="font-semibold">
                        {train.trainNumber}
                      </h4>

                      <p className="text-xs text-muted">
                        Schedule #{train.id}
                      </p>

                    </div>

                  </div>

                </td>

                <td className="px-4 py-5 font-medium">
                  {train.station}
                </td>

                <td className="px-4 py-5">

                  <div className="flex items-center gap-3">

                    <div className="h-2 w-28 overflow-hidden rounded-full bg-border">

                      <div
                        className="h-full rounded-full bg-primary"
                        style={{
                          width: `${train.occupancy}%`,
                        }}
                      />

                    </div>

                    <span className="text-sm font-semibold">
                      {train.occupancy}%
                    </span>

                  </div>

                </td>

                <td className="px-4 py-5 text-center">

                  {train.delay === 0 ? (
                    <span className="font-semibold text-emerald-500">
                      On Time
                    </span>
                  ) : (
                    <span className="font-semibold text-orange-500">
                      {train.delay} min
                    </span>
                  )}

                </td>

                <td className="px-4 py-5">

                  <div className="flex justify-center">

                    <span
                      className={`
                      inline-flex
                      items-center
                      gap-2
                      rounded-full
                      px-4
                      py-2
                      text-sm
                      font-semibold
                      ${
                        train.status === "Running"
                          ? "bg-emerald-500/10 text-emerald-500"
                          : train.status === "Delayed"
                          ? "bg-orange-500/10 text-orange-500"
                          : "bg-red-500/10 text-red-500"
                      }
                      `}
                    >

                      <Circle
                        className="fill-current"
                        size={8}
                      />

                      {train.status}

                    </span>

                  </div>

                </td>

              </tr>

            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted">
                  No trains match your search.
                </td>
              </tr>
            )}

          </tbody>

        </table>

      </div>
      )}

    </section>
  );
}
