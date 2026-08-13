"use client";

import { TriangleAlert } from "lucide-react";

import { useSelectedState } from "@/providers/StateProvider";

export default function InsufficientDataBanner() {
  const { selectedState, currentStateInfo, loading } = useSelectedState();

  if (loading || !selectedState) return null;

  const hasSufficientData = currentStateInfo?.has_sufficient_data ?? false;
  if (hasSufficientData) return null;

  const stationCount = currentStateInfo?.station_count ?? 0;

  return (
    <div className="flex items-start gap-4 rounded-3xl border border-amber-500/30 bg-amber-500/10 p-6">

      <TriangleAlert
        className="mt-0.5 shrink-0 text-amber-500"
        size={24}
      />

      <div>

        <h3 className="font-bold text-amber-500">
          Not enough data for {selectedState} yet
        </h3>

        <p className="mt-2 text-sm text-muted">
          Only {stationCount} seeded station{stationCount === 1 ? "" : "s"} found for{" "}
          {selectedState}, which isn&apos;t enough for the crowd/train models to give
          reliable predictions. Add more real station, passenger-flow, and
          train-operations rows for this state to{" "}
          <code className="rounded bg-background px-1.5 py-0.5 text-xs">datasets/</code>{" "}
          and re-run the seed script, then this dashboard will populate with real
          numbers.
        </p>

      </div>

    </div>
  );
}