import PageHeader from "@/components/layout/PageHeader";
import SystemStatusPanel from "@/components/dashboard/SystemStatusPanel";
import SystemLogsPanel from "@/components/dashboard/SystemLogsPanel";

export default function SystemStatusPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="System Status & Logs"
        description="Live health of MetroFlow's backend - database, cache, background
          workers (crowd simulator, train tracker) and the realtime websocket -
          read directly from the running server, not mocked. Below that, a
          live, read-only window into the application's own logs, captured
          directly from the running backend process."
      />

      <section className="space-y-6">
        <h2 className="text-lg font-bold text-muted">System Status</h2>
        <SystemStatusPanel />
      </section>

      <section className="space-y-6">
        <h2 className="text-lg font-bold text-muted">System Logs</h2>
        <SystemLogsPanel />
      </section>
    </div>
  );
}
