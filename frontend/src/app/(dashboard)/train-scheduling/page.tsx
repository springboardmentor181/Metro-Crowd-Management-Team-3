import PageHeader from "@/components/layout/PageHeader";
import TrainSchedulingPage from "@/components/operations/train-scheduling/TrainSchedulingPage";

export default function Page() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Train Scheduling"
        description="AI assisted timetable and dispatch planning"
      />
      <TrainSchedulingPage />
    </div>
  );
}