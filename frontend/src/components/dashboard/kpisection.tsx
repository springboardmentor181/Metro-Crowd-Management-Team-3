"use client";

import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BrainCircuit,
  Clock3,
  TrainFront,
  Users,
} from "lucide-react";

import { useApiData } from "@/hooks/useApiData";
import { getCrowdDashboard } from "@/lib/api/crowd";
import { getTrains } from "@/lib/api/trains";
import { getDelayedSchedules } from "@/lib/api/schedules";
import { getPredictionInsights } from "@/lib/api/analytics";
import { useAuth } from "@/providers/AuthProvider";
import { useSelectedState } from "@/providers/StateProvider";

export default function KPISection() {
  const { profile } = useAuth();
  const { selectedState } = useSelectedState();

  const crowd = useApiData(() => getCrowdDashboard(selectedState ?? undefined), [selectedState]);
  const trains = useApiData(() => getTrains(selectedState ?? undefined), [selectedState]);
  const delayed = useApiData(
    () => getDelayedSchedules(undefined, selectedState ?? undefined),
    [selectedState],
  );
  const predictions = useApiData(
    () => getPredictionInsights(30, selectedState ?? undefined),
    [selectedState],
  );

  const loading =
    crowd.loading || trains.loading || delayed.loading || predictions.loading;

  const livePassengers = (crowd.data ?? []).reduce(
    (sum, s) => sum + s.current_count,
    0,
  );
  const activeTrains = (trains.data ?? []).filter((t) => t.is_active).length;
  const avgConfidence =
    predictions.data && predictions.data.length > 0
      ? (predictions.data.reduce((sum, p) => sum + p.confidence, 0) /
          predictions.data.length) *
        100
      : null;
  const avgDelay =
    delayed.data && delayed.data.length > 0
      ? delayed.data.reduce((sum, s) => sum + s.delay_minutes, 0) /
        delayed.data.length
      : 0;

  const stats = [
    {
      title: "Live Passengers",
      value: loading ? "--" : livePassengers.toLocaleString(),
      change: `${(crowd.data ?? []).length} stations`,
      up: true,
      icon: Users,
      color: "bg-blue-500",
    },
    {
      title: "Active Trains",
      value: loading ? "--" : String(activeTrains),
      change: `${(trains.data ?? []).length} total`,
      up: true,
      icon: TrainFront,
      color: "bg-emerald-500",
    },
    {
      title: "AI Prediction Confidence",
      value: loading || avgConfidence === null ? "--" : `${avgConfidence.toFixed(1)}%`,
      change: `${(predictions.data ?? []).length} recent`,
      up: true,
      icon: BrainCircuit,
      color: "bg-violet-500",
    },
    {
      title: "Average Delay",
      value: loading ? "--" : `${avgDelay.toFixed(1)} Min`,
      change: `${(delayed.data ?? []).length} delayed`,
      up: false,
      icon: Clock3,
      color: "bg-orange-500",
    },
  ];

  return (
    <section className="space-y-8">

      <div>

        <h1 className="text-4xl font-black">
          Dashboard
        </h1>

        <p className="mt-2 text-muted">
          Welcome back{profile ? `, ${profile.full_name}` : ""} 👋
          {selectedState ? ` — showing ${selectedState}` : " — showing all of India"}
        </p>

      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">

        {stats.map((item) => {

          const Icon = item.icon;
          const TrendIcon = item.up ? ArrowUpRight : ArrowDownRight;

          return (

            <div
              key={item.title}
              className="
              group
              relative
              overflow-hidden
              rounded-3xl
              border
              border-border
              bg-card
              p-7
              transition-all
              duration-300
              hover:-translate-y-2
              hover:shadow-2xl
              "
            >

              <div
                className={`
                absolute
                right-0
                top-0
                h-40
                w-40
                rounded-full
                ${item.color}
                opacity-10
                blur-[80px]
                `}
              />

              <div className="flex items-center justify-between">

                <div>

                  <p className="text-sm text-muted">
                    {item.title}
                  </p>

                  <h2 className="mt-3 text-4xl font-black">
                    {item.value}
                  </h2>

                </div>

                <div
                  className={`
                  flex
                  h-14
                  w-14
                  items-center
                  justify-center
                  rounded-2xl
                  ${item.color}
                  text-white
                  `}
                >

                  <Icon size={28} />

                </div>

              </div>

              <div className="mt-8 flex items-center justify-between">

                <div
                  className={`
                  flex
                  items-center
                  gap-2
                  rounded-full
                  px-3
                  py-2
                  text-sm
                  font-semibold
                  ${item.up ? "bg-emerald-500/10 text-emerald-500" : "bg-orange-500/10 text-orange-500"}
                  `}
                >

                  <TrendIcon size={16} />

                  {item.change}

                </div>

                <Activity
                  size={18}
                  className="text-muted"
                />

              </div>

            </div>

          );

        })}

      </div>
    </section>
  );
}