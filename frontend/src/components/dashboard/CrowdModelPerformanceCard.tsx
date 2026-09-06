"use client";

import { Cpu, Lightbulb, Loader2 } from "lucide-react";

import { useApiData } from "@/hooks/useApiData";
import { getCrowdModelMetrics } from "@/lib/api/predictions";
import { queryKeys } from "@/lib/queryKeys";

const POLL_MS = 5_000; 

const MODEL_ORDER = ["random_forest", "xgboost"];

function pct(value: number | null | undefined) {
  if (value === null || value === undefined) return "-";
  return `${(value * 100).toFixed(1)}%`;
}

export default function CrowdModelPerformanceCard() {
  const { data: metrics, loading } = useApiData(queryKeys.crowdModelMetrics, getCrowdModelMetrics, [], POLL_MS);

  const modelEntries = MODEL_ORDER
    .filter((key) => metrics?.models?.[key])
    .map((key) => [key, metrics!.models[key]] as const);

  return (
    <section className="rounded-3xl border border-border bg-card p-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Cpu size={22} />
        </div>
        <div>
          <h2 className="text-xl font-bold">Model performance</h2>
          <p className="mt-1 text-sm text-muted">
            {metrics?.trained_rows && metrics?.test_rows
              ? `Production model trained on ${metrics.trained_rows.toLocaleString()} rows \u00b7 tested on ${metrics.test_rows.toLocaleString()} rows`
              : "Crowd/demand model, evaluated on held-out test rows"}
          </p>
        </div>
      </div>

      {loading && !metrics ? (
        <div className="flex items-center gap-2 py-8 text-sm text-muted">
          <Loader2 size={16} className="animate-spin" />
          Loading model metrics...
        </div>
      ) : !metrics?.available || modelEntries.length === 0 ? (
        <p className="py-8 text-sm text-muted">
          No trained model is currently loaded - the API is serving heuristic
          predictions instead.
        </p>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2">
            {modelEntries.map(([key, m]) => {
              const isWinner = metrics.model_name === m.model_name;
              const stats = [
                { label: "Accuracy", value: pct(m.accuracy) },
                { label: "Macro-F1", value: m.macro_f1?.toFixed(4) ?? "-" },
                { label: "Critical recall", value: pct(m.critical_recall) },
              ];
              return (
                <div
                  key={key}
                  className={`rounded-2xl border-2 bg-background p-6 ${
                    isWinner ? "border-emerald-500/40" : "border-border"
                  }`}
                >
                  <div className="mb-5 flex items-center gap-2">
                    <span className="text-lg font-bold">{m.model_name}</span>
                    {isWinner && (
                      <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-500">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="space-y-3">
                    {stats.map((stat) => (
                      <div
                        key={stat.label}
                        className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-card px-5 py-4"
                      >
                        <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                          {stat.label}
                        </span>
                        <span className="whitespace-nowrap text-2xl font-black tabular-nums">
                          {stat.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4 text-sm text-blue-500">
            <Lightbulb size={18} className="mt-0.5 shrink-0" />
            <p>
              <span className="font-bold">
                {metrics.model_name ?? "Random Forest"} Critical
              </span>{" "}
              is the active production crowd model. It achieves{" "}
              <span className="font-bold">{pct(metrics.accuracy)} accuracy</span>,{" "}
              <span className="font-bold">
                {metrics.macro_f1?.toFixed(4) ?? "-"} Macro-F1
              </span>{" "}
              and{" "}
              <span className="font-bold">{pct(metrics.critical_recall)} Critical recall</span>{" "}
              on the untouched final test set.
            </p>
          </div>
        </>
      )}
    </section>
  );
}
