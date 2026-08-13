"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  TrainFront,
  Circle,
  RadioTower,
  BrainCircuit,
  Gauge,
} from "lucide-react";

import { useStations } from "@/hooks/useStations";
import { useApiData } from "@/hooks/useApiData";
import { getSchedules } from "@/lib/api/schedules";
import { getTrains } from "@/lib/api/trains";
import { useSelectedState } from "@/providers/StateProvider";
import type { Station } from "@/lib/api/types";

// Backend doesn't expose live GPS pings yet (no computer-vision / live
// tracking feed - see the platform spec). Station positions below are
// real (projected from lat/long); train "positions" along the line are
// illustrative, driven by each train's real next-scheduled station.
function projectStations(stations: Station[]) {
  if (stations.length === 0) return [];
  const lats = stations.map((s) => s.latitude);
  const lngs = stations.map((s) => s.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const latRange = maxLat - minLat || 1;
  const lngRange = maxLng - minLng || 1;

  return stations.map((s) => ({
    ...s,
    x: ((s.longitude - minLng) / lngRange) * 80 + 10,
    y: ((maxLat - s.latitude) / latRange) * 80 + 10,
  }));
}

export default function LiveTrainMap() {
  const { selectedState } = useSelectedState();
  const { data: stationsData } = useStations();
  const schedules = useApiData(
    () => getSchedules({ state: selectedState ?? undefined }),
    [selectedState],
  );
  const trains = useApiData(() => getTrains(selectedState ?? undefined), [selectedState]);

  const positioned = useMemo(
    () => projectStations(stationsData ?? []),
    [stationsData],
  );

  const trainSummaries = useMemo(() => {
    const stationById = new Map(positioned.map((s) => [s.id, s]));

    return (trains.data ?? []).slice(0, 3).map((train) => {
      const nextStop = (schedules.data ?? [])
        .filter((s) => s.train_id === train.id)
        .sort((a, b) => a.arrival_time.localeCompare(b.arrival_time))[0];

      const station = nextStop ? stationById.get(nextStop.station_id) : undefined;
      const status = nextStop?.status === "delayed" ? "Delayed" : "Running";

      return {
        id: train.id,
        trainNumber: train.train_number,
        status,
        nextStation: station?.station_name ?? "Unknown",
        x: station?.x ?? 50,
        y: station?.y ?? 50,
        delayMinutes: nextStop?.delay_minutes ?? 0,
      };
    });
  }, [trains.data, schedules.data, positioned]);

  const delayedTrain = trainSummaries.find((t) => t.status === "Delayed");

  return (
    <section className="rounded-3xl border border-border bg-card p-8">

      <div className="mb-8 flex items-center justify-between">

        <div>

          <h2 className="text-3xl font-bold">
            Live Train Tracking
          </h2>

          <p className="mt-2 text-muted">
            Station layout is live; train positions are illustrative until GPS tracking is integrated
          </p>

        </div>

        <div className="flex gap-3">

          <div className="rounded-xl bg-primary/10 p-3">
            <RadioTower
              className="text-primary"
              size={24}
            />
          </div>

          <div className="rounded-xl bg-violet-500/10 p-3">
            <BrainCircuit
              className="text-violet-500"
              size={24}
            />
          </div>

        </div>

      </div>

      <div className="grid gap-8 xl:grid-cols-3">

        {/* MAP */}

        <div className="xl:col-span-2">

          <div
            className="
            relative
            h-[620px]
            overflow-hidden
            rounded-3xl
            border
            border-border
            bg-gradient-to-br
            from-slate-950
            via-slate-900
            to-black
            "
          >

            <svg className="absolute inset-0 h-full w-full">
              <polyline
                points={positioned.map((s) => `${s.x}%,${s.y}%`).join(" ")}
                fill="none"
                stroke="#2563EB"
                strokeWidth="8"
                strokeLinecap="round"
              />
            </svg>

            {positioned.map((station) => (

              <div
                key={station.id}
                className="absolute"
                style={{
                  left: `${station.x}%`,
                  top: `${station.y}%`,
                  transform: "translate(-50%,-50%)",
                }}
              >

                <motion.div
                  animate={{
                    scale: [1, 1.25, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                  }}
                  className="
                  h-5
                  w-5
                  rounded-full
                  border-4
                  border-white
                  bg-green-500
                  "
                />

                <p className="mt-3 whitespace-nowrap text-xs font-semibold text-white">
                  {station.station_name}
                </p>

              </div>

            ))}

            {trainSummaries.map((train) => (

              <motion.div
                key={train.id}
                animate={{
                  y: [-8, 8, -8],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                }}
                className="absolute"
                style={{
                  left: `${train.x}%`,
                  top: `${train.y}%`,
                }}
              >

                <div
                  className={`
                  rounded-full
                  p-3

                  ${
                    train.status === "Running"
                      ? "bg-blue-600"
                      : "bg-red-600"
                  }
                  `}
                >

                  <TrainFront
                    size={22}
                    className="text-white"
                  />

                </div>

              </motion.div>

            ))}

          </div>

        </div>

        {/* LIVE PANEL */}

        <div className="space-y-6">

          {trainSummaries.map((train) => (

            <div
              key={train.id}
              className="
              rounded-2xl
              border
              border-border
              bg-background
              p-6
              "
            >

              <div className="flex justify-between">

                <div>

                  <h3 className="font-bold">
                    {train.trainNumber}
                  </h3>

                  <p className="mt-2 text-muted">
                    Next: {train.nextStation}
                  </p>

                </div>

                <Circle
                  size={14}
                  className={`
                  fill-current

                  ${
                    train.status === "Running"
                      ? "text-green-500"
                      : "text-red-500"
                  }
                  `}
                />

              </div>

              <div className="mt-6 space-y-4">

                <div className="flex justify-between">

                  <span className="text-muted">
                    Status
                  </span>

                  <strong>
                    {train.status}
                  </strong>

                </div>

                <div className="flex justify-between">

                  <span className="text-muted">
                    Delay
                  </span>

                  <strong>
                    {train.delayMinutes > 0 ? `${train.delayMinutes} min` : "On time"}
                  </strong>

                </div>

              </div>

            </div>

          ))}

          {trainSummaries.length === 0 && (
            <p className="text-sm text-muted">No train schedule data yet.</p>
          )}

          <div
            className="
            rounded-2xl
            border
            border-primary/20
            bg-primary/5
            p-6
            "
          >

            <div className="flex gap-3">

              <Gauge
                className="text-primary"
                size={24}
              />

              <div>

                <h3 className="font-bold">
                  AI Recommendation
                </h3>

                <p className="mt-3 text-sm leading-7 text-muted">
                  {delayedTrain
                    ? `${delayedTrain.trainNumber} is delayed by ${delayedTrain.delayMinutes} min near ${delayedTrain.nextStation}. Consider dispatching a standby train to avoid overcrowding.`
                    : "All tracked trains are currently running on schedule."}
                </p>

              </div>

            </div>

          </div>

        </div>

      </div>

    </section>
  );
}