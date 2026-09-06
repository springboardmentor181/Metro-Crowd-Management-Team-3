import dynamic from "next/dynamic";

import KPISection from "@/components/dashboard/KPISection";
import InsufficientDataBanner from "@/components/dashboard/InsufficientDataBanner";
import DashboardSectionSkeleton from "@/components/dashboard/DashboardSectionSkeleton";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const LiveStationsPanel = dynamic(() => import("@/components/dashboard/LiveStationsPanel"), {
  loading: () => <DashboardSectionSkeleton heightClass="h-96" />,
});

const PassengerChart = dynamic(() => import("@/components/dashboard/PassengerChart"), {
  loading: () => <DashboardSectionSkeleton heightClass="h-96" />,
});

const RecentAlerts = dynamic(() => import("@/components/dashboard/RecentAlerts"), {
  loading: () => <DashboardSectionSkeleton heightClass="h-96" />,
});

const CrowdHeatMap = dynamic(() => import("@/components/dashboard/CrowdHeatMap"), {
  loading: () => <DashboardSectionSkeleton heightClass="h-96" />,
});

const CrowdDensityGradientMap = dynamic(
  () => import("@/components/dashboard/CrowdDensityGradientMap"),
  { loading: () => <DashboardSectionSkeleton heightClass="h-96" /> },
);

const LiveStationMonitor = dynamic(
  () => import("@/components/dashboard/LiveStationMonitor"),
  { loading: () => <DashboardSectionSkeleton heightClass="h-96" /> },
);

const TrainFrequencyChart = dynamic(() => import("@/components/dashboard/TrainFrequencyChart"), {
  loading: () => <DashboardSectionSkeleton heightClass="h-[520px]" />,
});

const LiveTrainMap = dynamic(() => import("@/components/dashboard/LiveTrainMap"), {
  loading: () => <DashboardSectionSkeleton heightClass="h-[700px]" />,
});

const StationOccupancyChart = dynamic(
  () => import("@/components/dashboard/StationOccupancyChart"),
  { loading: () => <DashboardSectionSkeleton heightClass="h-96" /> },
);

const AIInsights = dynamic(() => import("@/components/dashboard/AIInsights"), {
  loading: () => <DashboardSectionSkeleton heightClass="h-96" />,
});

const ActivityTimeline = dynamic(() => import("@/components/dashboard/ActivityTimeline"), {
  loading: () => <DashboardSectionSkeleton heightClass="h-96" />,
});

const TrainStatusTable = dynamic(() => import("@/components/dashboard/TrainStatusTable"), {
  loading: () => <DashboardSectionSkeleton heightClass="h-[420px]" />,
});

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <KPISection />

      <InsufficientDataBanner />

      <ErrorBoundary label="live stations">
        <LiveStationsPanel />
      </ErrorBoundary>

      <section className="grid gap-8 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <ErrorBoundary label="the passenger chart">
            <PassengerChart />
          </ErrorBoundary>
        </div>

        <ErrorBoundary label="recent alerts">
          <RecentAlerts />
        </ErrorBoundary>
      </section>

      <ErrorBoundary label="the crowd heatmap">
        <CrowdHeatMap />
      </ErrorBoundary>

      <ErrorBoundary label="the crowd density heatmap">
        <CrowdDensityGradientMap />
      </ErrorBoundary>

      <ErrorBoundary label="the live station monitor">
        <LiveStationMonitor />
      </ErrorBoundary>

      <ErrorBoundary label="the train frequency chart">
        <TrainFrequencyChart />
      </ErrorBoundary>

      <ErrorBoundary label="the live train map">
        <LiveTrainMap />
      </ErrorBoundary>

      <section className="grid gap-8 xl:grid-cols-2">
        <ErrorBoundary label="station occupancy">
          <StationOccupancyChart />
        </ErrorBoundary>
        <ErrorBoundary label="AI insights">
          <AIInsights />
        </ErrorBoundary>
      </section>

      <ErrorBoundary label="the activity timeline">
        <ActivityTimeline />
      </ErrorBoundary>

      <ErrorBoundary label="train status">
        <TrainStatusTable />
      </ErrorBoundary>
    </div>
  );
}
