import dynamic from "next/dynamic";

import PageHeader from "@/components/layout/PageHeader";
import DashboardSectionSkeleton from "@/components/dashboard/DashboardSectionSkeleton";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import TrainSchedulingPage from "@/components/operations/train-scheduling/TrainSchedulingPage";

const UpcomingTrainSchedule = dynamic(
  () => import("@/components/dashboard/UpcomingTrainSchedule"),
  { loading: () => <DashboardSectionSkeleton heightClass="h-96" /> },
);

export default function Page() {
  return (
    <div className="space-y-8">
      <ErrorBoundary label="the upcoming train schedule">
        <UpcomingTrainSchedule />
      </ErrorBoundary>

      <PageHeader
        title="Train Scheduling"
        description="AI assisted timetable and dispatch planning"
      />
      <TrainSchedulingPage />
    </div>
  );
}