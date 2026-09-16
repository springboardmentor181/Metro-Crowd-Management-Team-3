"use client";

import { Lightbulb, Loader2, Timer } from "lucide-react";

import { useApiData } from "@/hooks/useApiData";
import { getDelayModelMetrics } from "@/lib/api/predictions";
import { queryKeys } from "@/lib/queryKeys";

// Trained-model evaluation metrics only change when a model is retrained -
// polling every 5s (the old value) fired 8x on the AI Prediction page alone
// (4 crowd + 2 delay + 2 frequency cards), causing excessive duplicate
// network requests for data that is effectively static minute-to-minute.
// Aligned with the same metrics' poll interval already used elsewhere
// (KPISection's crowdModelMetrics poll).
const POLL_MS = 60_000;

const MODEL_ORDER = ["random_forest", "xgboost"];
// Sept 2026 retrains save candidates as "random_forest_tuned" /
// "xgboost_tuned" (see crowd_metrics.py DISPLAY_NAMES) - strip that
// suffix before matching MODEL_ORDER so newly retrained models still
// show up here instead of silently falling back to the "no trained
// model" empty state.
const baseModelKey = (key: string) => key.replace(/_tuned$/, "");

function statsFor(m: { mae: number | null; mape_pct: number | null; r2: number | null }) {
  return [
    { label: "MAE", value: m.mae !== null && m.mae !== undefined ? `${m.mae.toLocaleString()} min` : "-" },
    { label: "MAPE", value: m.mape_pct !== null && m.mape_pct !== undefined ? `${m.mape_pct}%` : "-" },
    { label: "R\u00b2", value: m.r2 !== null && m.r2 !== undefined ? m.r2.toFixed(4) : "-" },
  ];
}

export default function DelayModelMetricsCard() {
  const { data: metrics, loading } = useApiData(queryKeys.delayModelMetrics, getDelayModelMetrics, [], POLL_MS);

  const modelEntries = Object.entries(metrics?.models ?? {})
    .sort(
      ([a], [b]) =>
        MODEL_ORDER.indexOf(baseModelKey(a)) - MODEL_ORDER.indexOf(baseModelKey(b)),
    );

  return (
    <section className="rounded-3xl border border-border bg-card p-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Timer size={22} />
        </div>
        <div>
          <h2 className="text-xl font-bold">Delay prediction regression</h2>
          <p className="mt-1 text-sm text-muted">
            {metrics?.trained_rows && metrics?.test_rows
              ? `Production model trained on ${metrics.trained_rows.toLocaleString()} rows \u00b7 tested on ${metrics.test_rows.toLocaleString()} rows`
              : "How close predicted arrival delay lands to actual delay minutes"}
          </p>
        </div>
      </div>

      {loading && !metrics ? (
        <div className="flex items-center gap-2 py-8 text-sm text-muted">
          <Loader2 size={16} className="animate-spin" />
          Loading delay regression metrics...
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
              return (
                <div key={key} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">{m.model_name}</span>
                    {isWinner && (
                      <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-500">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {statsFor(m).map((stat) => (
                      <div
                        key={stat.label}
                        className="rounded-2xl border border-border bg-background p-4 text-center"
                      >
                        <p className="text-xl font-black">{stat.value}</p>
                        <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-muted">
                          {stat.label}
                        </p>
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
              The production {metrics.model_name ?? "Random Forest"} delay model
              achieves an MAE of <span className="font-bold">{metrics.mae} minutes</span>
              {metrics.mape_pct !== null && metrics.mape_pct !== undefined && (
                <>
                  , MAPE of <span className="font-bold">{metrics.mape_pct}%</span>
                </>
              )}{" "}
              and R{"\u00b2"} of <span className="font-bold">{metrics.r2}</span> - shown
              alongside the runner-up candidate above for comparison.
            </p>
          </div>
        </>
      )}
    </section>
  );
}