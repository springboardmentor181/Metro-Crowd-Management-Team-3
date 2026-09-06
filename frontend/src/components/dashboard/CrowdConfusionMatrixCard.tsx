"use client";

import { Grid3x3, Lightbulb, Loader2 } from "lucide-react";

import { useApiData } from "@/hooks/useApiData";
import { getCrowdModelMetrics } from "@/lib/api/predictions";
import { queryKeys } from "@/lib/queryKeys";

const POLL_MS = 5_000; 

const MODEL_ORDER = ["random_forest", "xgboost"];

function label(cls: string) {
  return cls.charAt(0).toUpperCase() + cls.slice(1);
}

export default function CrowdConfusionMatrixCard() {
  const { data: metrics, loading } = useApiData(queryKeys.crowdModelMetrics, getCrowdModelMetrics, [], POLL_MS);

  const modelEntries = MODEL_ORDER
    .filter((key) => metrics?.models?.[key]?.classes?.length)
    .map((key) => [key, metrics!.models[key]] as const);

  return (
    <section className="rounded-3xl border border-border bg-card p-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Grid3x3 size={22} />
        </div>
        <div>
          <h2 className="text-xl font-bold">Confusion matrix</h2>
          <p className="mt-1 text-sm text-muted">
            Predicted vs actual crowd level - final test set
          </p>
        </div>
      </div>

      {loading && !metrics ? (
        <div className="flex items-center gap-2 py-8 text-sm text-muted">
          <Loader2 size={16} className="animate-spin" />
          Loading confusion matrix...
        </div>
      ) : !metrics?.available || modelEntries.length === 0 ? (
        <p className="py-8 text-sm text-muted">
          No trained model is currently loaded - a confusion matrix needs a
          real model to evaluate.
        </p>
      ) : (
        <>
          <div className="grid gap-6 xl:grid-cols-2">
            {modelEntries.map(([key, m]) => {
              const isWinner = metrics.model_name === m.model_name;
              const classes = m.classes ?? [];
              const matrix = m.confusion_matrix ?? [];
              const maxValue = Math.max(1, ...matrix.flat());
              return (
                <div
                  key={key}
                  className={`rounded-2xl border-2 bg-background p-5 ${
                    isWinner ? "border-emerald-500/40" : "border-border"
                  }`}
                >
                  <div className="mb-3 flex items-center gap-2">
                    <p className="text-base font-bold">{m.model_name}</p>
                    {isWinner && (
                      <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-500">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[360px] border-collapse text-center text-sm">
                      <thead>
                        <tr>
                          <th className="p-2 text-left text-xs uppercase tracking-wide text-muted">
                            Actual {"\u2193"} / Pred {"\u2192"}
                          </th>
                          {classes.map((cls) => (
                            <th
                              key={cls}
                              className="p-2 text-xs font-semibold uppercase tracking-wide text-muted"
                            >
                              {label(cls)}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {classes.map((rowCls, rowIdx) => (
                          <tr key={rowCls} className="border-t border-border">
                            <td className="p-2 text-left font-semibold">{label(rowCls)}</td>
                            {classes.map((colCls, colIdx) => {
                              const value = matrix[rowIdx]?.[colIdx] ?? 0;
                              const isDiagonal = rowIdx === colIdx;
                              const intensity = value / maxValue;
                              return (
                                <td key={colCls} className="p-1.5">
                                  <div
                                    className={`rounded-xl py-3 font-bold ${
                                      isDiagonal
                                        ? "bg-primary text-white"
                                        : value > 0
                                          ? "bg-primary/10 text-foreground"
                                          : "text-muted"
                                    }`}
                                    style={
                                      isDiagonal
                                        ? { opacity: 0.55 + intensity * 0.45 }
                                        : undefined
                                    }
                                  >
                                    {value.toLocaleString()}
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4 text-sm text-blue-500">
            <Lightbulb size={18} className="mt-0.5 shrink-0" />
            <p>
              The production {metrics.model_name ?? "Random Forest"} model
              achieves{" "}
              <span className="font-bold">
                {metrics.critical_recall !== null
                  ? `${(metrics.critical_recall * 100).toFixed(2)}%`
                  : "-"}
              </span>{" "}
              recall for the Critical class, helping identify high-risk
              crowding conditions for operational intervention. Random Forest
              and XGBoost are shown side by side for comparison.
            </p>
          </div>
        </>
      )}
    </section>
  );
}
