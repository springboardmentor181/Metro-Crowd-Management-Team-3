"use client";

import {
  Database,
  Server,
  Radio,
  Cpu,
  RefreshCcw,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

import { useApiData } from "@/hooks/useApiData";
import { getSystemStatus } from "@/lib/api/admin";
import { queryKeys } from "@/lib/queryKeys";

type StatusTone = "online" | "offline" | "warning";

function ToneDot({ tone }: { tone: StatusTone }) {
  const color =
    tone === "online" ? "bg-emerald-500" : tone === "warning" ? "bg-amber-500" : "bg-red-500";
  return (
    <span className="relative flex h-2.5 w-2.5">
      {tone === "online" && (
        <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${color} opacity-60`} />
      )}
      <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${color}`} />
    </span>
  );
}

function StatusRow({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: StatusTone;
}) {
  return (
    <div className="flex items-center justify-between border-t border-border py-3 first:border-t-0 first:pt-0">
      <div className="flex items-center gap-3 text-sm text-muted">
        {icon}
        <span>{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <ToneDot tone={tone} />
        <span
          className={`text-sm font-semibold ${
            tone === "online"
              ? "text-emerald-500"
              : tone === "warning"
                ? "text-amber-500"
                : "text-red-500"
          }`}
        >
          {value}
        </span>
      </div>
    </div>
  );
}

export default function SystemStatusPanel() {
  const { data, loading, error, refresh } = useApiData(
    queryKeys.systemStatus,
    (signal) => getSystemStatus(signal),
    [],
    15000,
  );

  return (
    <section className="rounded-3xl border border-border bg-card p-8">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">System Status</h2>
          <p className="mt-2 text-sm text-muted">
            Live snapshot of the database, cache, background workers and realtime socket -
            read straight from the running server, refreshed every 15s.
          </p>
        </div>
        <button
          onClick={refresh}
          className="flex shrink-0 items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-semibold text-muted transition hover:border-primary hover:text-primary"
        >
          <RefreshCcw size={14} />
          Refresh
        </button>
      </div>

      {loading && !data && <p className="text-sm text-muted">Checking system status...</p>}
      {error && !data && <p className="text-sm text-red-500">{error}</p>}

      {data && (
        <>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-border p-5">
              <h3 className="mb-2 text-sm font-bold text-muted">Core Services</h3>
              <StatusRow
                icon={<Database size={18} />}
                label="Database"
                value={data.database.connected ? "Connected" : "Unreachable"}
                tone={data.database.connected ? "online" : "offline"}
              />
              <StatusRow
                icon={<Server size={18} />}
                label="Cache (Redis)"
                value={
                  data.redis.connected
                    ? "Connected"
                    : data.redis.state === "disabled"
                      ? "Disabled"
                      : "Unreachable"
                }
                tone={
                  data.redis.connected
                    ? "online"
                    : data.redis.state === "disabled"
                      ? "warning"
                      : "offline"
                }
              />
              <StatusRow
                icon={<Radio size={18} />}
                label="WebSocket"
                value={`${data.websocket_connections} connected`}
                tone={data.websocket_connections > 0 ? "online" : "warning"}
              />
            </div>

            <div className="rounded-2xl border border-border p-5">
              <h3 className="mb-2 text-sm font-bold text-muted">Background Workers</h3>
              <StatusRow
                icon={<Cpu size={18} />}
                label="Crowd Simulator"
                value={data.scheduler.crowd_simulator.state}
                tone={data.crowd_simulator_running ? "online" : "warning"}
              />
              <StatusRow
                icon={<Cpu size={18} />}
                label="Train Tracker"
                value={data.scheduler.train_tracker.state}
                tone={data.train_tracker_running ? "online" : "warning"}
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-6 rounded-2xl bg-primary/5 p-5 text-sm text-muted">
            <span>
              <strong className="text-foreground">{data.app_name}</strong> v{data.app_version}
            </span>
            <span className="flex items-center gap-2">
              {data.log_counts.ERROR > 0 || data.log_counts.CRITICAL > 0 ? (
                <AlertTriangle size={16} className="text-amber-500" />
              ) : (
                <CheckCircle2 size={16} className="text-emerald-500" />
              )}
              {data.log_counts.ERROR + data.log_counts.CRITICAL} error(s) in recent logs
            </span>
            <span>Last checked {new Date(data.timestamp).toLocaleTimeString()}</span>
          </div>
        </>
      )}
    </section>
  );
}
