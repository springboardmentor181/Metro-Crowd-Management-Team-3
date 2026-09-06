"use client";

import { useState } from "react";
import { RefreshCcw, Radio, Terminal } from "lucide-react";

import { useApiData } from "@/hooks/useApiData";
import { getSystemLogs } from "@/lib/api/admin";
import { queryKeys } from "@/lib/queryKeys";

const LEVELS = ["ALL", "INFO", "WARNING", "ERROR", "CRITICAL", "DEBUG"] as const;

const LEVEL_STYLES: Record<string, string> = {
  INFO: "bg-blue-500/10 text-blue-500",
  WARNING: "bg-amber-500/10 text-amber-500",
  ERROR: "bg-red-500/10 text-red-500",
  CRITICAL: "bg-red-600/15 text-red-600",
  DEBUG: "bg-slate-500/10 text-slate-500",
};

export default function SystemLogsPanel() {
  const [level, setLevel] = useState<(typeof LEVELS)[number]>("ALL");

  const { data, loading, error, refresh } = useApiData(
    queryKeys.systemLogs,
    (signal) => getSystemLogs(200, level === "ALL" ? undefined : level, signal),
    [level],
    10000,
  );

  const logs = data?.logs ?? [];

  return (
    <section className="rounded-3xl border border-border bg-card p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">System Logs</h2>
          <p className="mt-2 text-sm text-muted">
            Real, live application log records straight from the running server process -
            not sample data. Auto-refreshes every 10s.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-500">
            <Radio size={12} className="animate-pulse" />
            Live
          </span>
          <button
            onClick={refresh}
            className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-semibold text-muted transition hover:border-primary hover:text-primary"
          >
            <RefreshCcw size={14} />
            Refresh
          </button>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {LEVELS.map((lvl) => (
          <button
            key={lvl}
            onClick={() => setLevel(lvl)}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
              level === lvl
                ? "border-primary bg-primary text-white"
                : "border-border text-muted hover:border-primary hover:text-primary"
            }`}
          >
            {lvl}
            {data && lvl !== "ALL" && data.counts[lvl] ? ` (${data.counts[lvl]})` : ""}
          </button>
        ))}
      </div>

      {loading && !data && <p className="text-sm text-muted">Loading logs...</p>}
      {error && !data && <p className="text-sm text-red-500">{error}</p>}

      {data && logs.length === 0 && (
        <div className="rounded-2xl border border-border p-8 text-center">
          <Terminal className="mx-auto text-muted" size={22} />
          <p className="mt-3 text-sm text-muted">
            No log records yet at this level - the buffer fills as the server runs and logs
            things.
          </p>
        </div>
      )}

      {logs.length > 0 && (
        <div className="max-h-[600px] space-y-2 overflow-y-auto rounded-2xl border border-border bg-background p-4 font-mono text-xs">
          {logs.map((entry) => (
            <div
              key={entry.id}
              className="flex flex-wrap items-start gap-3 border-b border-border/60 py-2 last:border-b-0"
            >
              <span className="shrink-0 text-muted">
                {new Date(entry.timestamp).toLocaleTimeString()}
              </span>
              <span
                className={`shrink-0 rounded px-1.5 py-0.5 font-semibold ${
                  LEVEL_STYLES[entry.level] ?? "bg-muted/10 text-muted"
                }`}
              >
                {entry.level}
              </span>
              <span className="shrink-0 text-muted">{entry.logger}</span>
              <span className="min-w-0 flex-1 break-words">{entry.message}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
