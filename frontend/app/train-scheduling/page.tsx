import TrainSchedulingPage from "@/components/operations/train-scheduling/TrainSchedulingPage";
import OperationsPageShell from "@/components/operations/OperationsPageShell";

export default function TrainSchedulingRoute() {
  return (
    <OperationsPageShell
      title="Train Scheduling"

      description="AI-assisted timetable and dispatch planning"
    >
      <TrainSchedulingPage />
    </OperationsPageShell>
  );
}
