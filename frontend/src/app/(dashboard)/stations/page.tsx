import PageHeader from "@/components/layout/PageHeader";
import InsufficientDataBanner from "@/components/dashboard/InsufficientDataBanner";
import StationOccupancyChart from "@/components/dashboard/StationOccupancyChart";

export default function StationsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Stations"
        description="Station-wise occupancy and performance across the metro
          network - capacity, current load, and how each station compares
          to the others. Backs the Crowd Monitoring and Scheduling modules,
          which reference stations by id for every prediction and alert."
      />
      <InsufficientDataBanner />
      <StationOccupancyChart />
    </div>
  );
}