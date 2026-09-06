import PageHeader from "@/components/layout/PageHeader";
import SystemStatusPanel from "@/components/dashboard/SystemStatusPanel";

export default function SystemStatusPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="System Status"
        description="Live health of MetroFlow's backend - database, cache, background
          workers (crowd simulator, train tracker) and the realtime websocket -
          read directly from the running server, not mocked."
      />
      <SystemStatusPanel />
    </div>
  );
}
