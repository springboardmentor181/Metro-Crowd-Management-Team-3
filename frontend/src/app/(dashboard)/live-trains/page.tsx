import PageHeader from "@/components/layout/PageHeader";
import InsufficientDataBanner from "@/components/dashboard/InsufficientDataBanner";
import LiveTrainMap from "@/components/dashboard/LiveTrainMap";
import TrainFrequencyChart from "@/components/dashboard/TrainFrequencyChart";
import TrainStatusTable from "@/components/dashboard/TrainStatusTable";

export default function LiveTrainsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Live Trains & Scheduling"
        description="Real-time position and status of every train in service,
          plus the current train-frequency plan. Combines live GPS/status
          data with the Scheduling Management Module's peak-hour and
          frequency-adjustment logic, so you can see both where trains are
          right now and how often they're running."
      />
      <InsufficientDataBanner />
      <LiveTrainMap />
      <TrainFrequencyChart />
      <TrainStatusTable />
    </div>
  );
}
