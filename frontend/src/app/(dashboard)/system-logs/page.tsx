import PageHeader from "@/components/layout/PageHeader";
import SystemLogsPanel from "@/components/dashboard/SystemLogsPanel";

export default function SystemLogsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="System Logs"
        description="A live, read-only window into MetroFlow's own application logs -
          captured directly from the running backend process (not sample or
          mocked data). Filter by level and watch new entries stream in as the
          system runs."
      />
      <SystemLogsPanel />
    </div>
  );
}
