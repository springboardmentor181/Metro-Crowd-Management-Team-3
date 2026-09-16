
"use client";

import {
  Activity,
  AlertTriangle,
  BrainCircuit,
  Clock3,
  TrainFront,
  Users,
} from "lucide-react";

import { useApiData } from "@/hooks/useApiData";
import { useDebouncedRefresh } from "@/hooks/useDebouncedRefresh";
import { useLiveSocket } from "@/hooks/useLiveSocket";
import { useLiveSocketContext } from "@/providers/LiveSocketProvider";
import { getPredictionInsights } from "@/lib/api/analytics";
import { useStations } from "@/hooks/useStations";
import { useSelectedState } from "@/providers/StateProvider";
import { queryKeys } from "@/lib/queryKeys";
import type { Prediction, PredictionType } from "@/lib/api/types";

function relativeTime(iso: string | null) {
  if (!iso) return "just now";
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.max(0, Math.round(diffMs / 60000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  return `${hours} hr ago`;
}

function describe(prediction: Prediction, stationName: string) {
  switch (prediction.prediction_type) {
    case "crowd":
      return `${stationName} crowd forecast: ~${Math.round(prediction.predicted_value)} passengers (${Math.round(prediction.confidence * 100)}% confidence).`;
    case "demand":
      return `${stationName} demand forecast updated: ~${Math.round(prediction.predicted_value)} passengers expected.`;
    case "delay":
      return `${stationName} delay prediction: ~${prediction.predicted_value.toFixed(1)} min expected.`;
    case "frequency":
      return `${stationName} frequency recommendation: ${prediction.predicted_value} min interval.`;
    default:
      return `${stationName} prediction updated.`;
  }
}

function iconFor(type: PredictionType) {
  switch (type) {
    case "crowd":
    case "demand":
      return <Users size={20} className="text-orange-500" />;
    case "delay":
      return <AlertTriangle size={20} className="text-red-500" />;
    case "frequency":
      return <TrainFront size={20} className="text-blue-500" />;
    default:
      return <BrainCircuit size={20} className="text-violet-500" />;
  }
}

function titleFor(type: PredictionType) {
  switch (type) {
    case "crowd":
      return "Crowd Prediction Generated";
    case "demand":
      return "Demand Forecast Generated";
    case "delay":
      return "Delay Prediction Generated";
    case "frequency":
      return "Frequency Recommendation Generated";
    default:
      return "AI Prediction Updated";
  }
}

const FALLBACK_POLL_MS = 30000;

export default function ActivityTimeline() {
  const { selectedState } = useSelectedState();
  const { isConnected } = useLiveSocketContext();
  const predictionsQuery = useApiData(
    queryKeys.predictionInsights,
    (signal) => getPredictionInsights(15, selectedState ?? undefined, signal),
    [selectedState],
    
    isConnected ? 0 : FALLBACK_POLL_MS,
  );
  const { data: predictions, loading } = predictionsQuery;
  const { data: stations } = useStations();

  const debouncedPredictionsRefresh = useDebouncedRefresh(predictionsQuery.refresh);
  useLiveSocket({
    crowd_update: debouncedPredictionsRefresh,
    delay_alert: debouncedPredictionsRefresh,
    station_alert: debouncedPredictionsRefresh,
  });

  const stationById = new Map((stations ?? []).map((s) => [s.id, s]));

  return (
    <section className="rounded-3xl border border-border bg-card p-8">

      <div className="mb-8 flex items-center justify-between">

        <div>

          <h2 className="text-2xl font-bold">
            Activity Timeline
          </h2>

          <p className="mt-2 text-muted">
            Latest AI predictions generated
          </p>

        </div>

        <Activity
          className="text-primary"
          size={30}
        />

      </div>

      {loading ? (
        <p className="text-sm text-muted">Loading activity...</p>
      ) : (
      <div className="relative">

        <div
          className="
          absolute
          left-[18px]
          top-2
          h-full
          w-[2px]
          bg-border
          "
        />

        <div className="space-y-8">

          {(predictions ?? []).map((item) => {
            const stationName = stationById.get(item.station_id)?.station_name ?? `Station #${item.station_id}`;

            return (
            <div
              key={item.id}
              className="relative flex gap-5"
            >

              <div
                className="
                relative
                z-10
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-full
                border
                border-border
                bg-background
                "
              >

                {iconFor(item.prediction_type)}

              </div>

              <div className="flex-1">

                <div
                  className="
                  rounded-2xl
                  border
                  border-border
                  bg-background
                  p-5
                  transition
                  hover:border-primary
                  "
                >

                  <div className="flex items-center justify-between">

                    <h3 className="font-semibold">
                      {titleFor(item.prediction_type)}
                    </h3>

                    <div className="flex items-center gap-2 text-xs text-muted">

                      <Clock3 size={14} />

                      {relativeTime(item.target_datetime)}

                    </div>

                  </div>

                  <p className="mt-3 text-sm leading-7 text-muted">
                    {describe(item, stationName)}
                  </p>

                </div>

              </div>

            </div>
            );
          })}

          {(!predictions || predictions.length === 0) && (
            <p className="text-sm text-muted">No AI activity recorded yet.</p>
          )}

        </div>

      </div>
      )}

    </section>
  );
}
