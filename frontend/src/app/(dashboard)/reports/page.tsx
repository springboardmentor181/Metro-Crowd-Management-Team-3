import PageHeader from "@/components/layout/PageHeader";
import ReportsPanel from "@/components/dashboard/ReportsPanel";

export default function ReportsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Reports"
        description="Operational and traffic reports generated from live ridership and
          schedule data. Switch the time window, export a station traffic report to
          CSV, or check the current on-time rate at a glance."
      />
      <ReportsPanel />
    </div>
  );
}
