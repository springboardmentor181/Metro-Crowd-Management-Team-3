import CrowdMonitorPage from "@/components/operations/crowd-monitor/crowdmonitorpage";
import OperationsPageShell from "@/components/operations/OperationsPageShell";

export default function CrowdMonitorRoute() {
  return (
    <OperationsPageShell
      title="Crowd Monitor"
      description="Live station occupancy and crowd-risk monitoring"
    >
      <CrowdMonitorPage />
    </OperationsPageShell>
  );
}
