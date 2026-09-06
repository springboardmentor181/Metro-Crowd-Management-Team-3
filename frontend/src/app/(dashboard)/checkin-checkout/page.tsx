import PageHeader from "@/components/layout/PageHeader";
import CheckInOutCard from "@/components/dashboard/CheckInOutCard";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function CheckInCheckOutPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Check In / Check Out"
        description="Start and end your journey here. Checking in bumps the
          source station's live crowd count immediately; checking out moves
          that count over to your destination and shows the fare - the same
          flow that feeds the Crowd Monitoring dashboard in real time."
      />
      <ErrorBoundary label="the check-in card">
        <CheckInOutCard />
      </ErrorBoundary>
    </div>
  );
}
