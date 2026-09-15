"use client";

import { useState } from "react";

import PageHeader from "@/components/layout/PageHeader";
import InsufficientDataBanner from "@/components/dashboard/InsufficientDataBanner";
import CheckInOutCard from "@/components/dashboard/CheckInOutCard";
import CrowdHeatMap from "@/components/dashboard/CrowdHeatMap";
import CrowdDensityGradientMap from "@/components/dashboard/CrowdDensityGradientMap";
import MetroMap from "@/components/dashboard/MetroMap";
import StationAnalyticsPanel from "@/components/dashboard/StationAnalyticsPanel";

export default function CrowdMonitorPage() {
  const [selected, setSelected] = useState<{ id: number; name: string } | null>(
    null,
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Crowd Monitoring"
        description="Live passenger density across every station, built from
          ticketing and check-in/check-out data. Tracks station-wise
          occupancy against capacity, flags congestion as it develops, and
          feeds the crowd heatmap below so operators can spot overcrowding
          before it becomes a safety issue."
      />
      <InsufficientDataBanner />
      <div id="checkin-checkout">
        <CheckInOutCard />
      </div>
      <CrowdHeatMap onSelectStation={setSelected} />
      <CrowdDensityGradientMap />
      <MetroMap />
      <StationAnalyticsPanel
        stationId={selected?.id ?? null}
        stationName={selected?.name}
        onResumeAutoRotate={() => setSelected(null)}
      />
    </div>
  );
}