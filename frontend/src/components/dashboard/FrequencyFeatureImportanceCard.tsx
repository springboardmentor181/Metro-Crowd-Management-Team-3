"use client";

import { Layers, Lightbulb, Loader2 } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useApiData } from "@/hooks/useApiData";
import { getFrequencyModelMetrics } from "@/lib/api/predictions";
import { queryKeys } from "@/lib/queryKeys";

const POLL_MS = 5_000;

const MODEL_ORDER = ["random_forest", "xgboost"];
const MODEL_COLORS: Record<string, string> = {
  random_forest: "#2563EB",
  xgboost: "#F59E0B",
};

function featureLabel(feature: string) {
  return feature
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function FrequencyFeatureImportanceCard() {
  const { data: metrics, loading } = useApiData(queryKeys.frequencyModelMetrics, getFrequencyModelMetrics, [], POLL_MS);

  const modelEntries = MODEL_ORDER
    .filter((key) => metrics?.models?.[key]?.feature_importance?.length)
    .map((key) => [key, metrics!.models[key]] as const);

  return (
    <section className="rounded-3xl border border-border bg-card p-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Layers size={18} />
        </div>
        <div>
          <h2 className="text-base font-bold">Frequency feature importance</h2>
          <p className="mt-0.5 text-xs text-muted">
            Which time/station signals drive the frequency model most
          </p>
        </div>
      </div>

      {loading && !metrics ? (
        <div className="flex items-center gap-2 py-6 text-sm text-muted">
          <Loader2 size={16} className="animate-spin" />
          Loading feature importance...
        </div>
      ) : !metrics?.available || modelEntries.length === 0 ? (
        <p className="py-6 text-sm text-muted">
          No trained model is currently loaded - feature importance needs a
          real model to evaluate.
        </p>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {modelEntries.map(([key, m]) => {
              const isWinner = metrics.model_name === m.model_name;
              const chartData = [...m.feature_importance]
                .reverse()
                .map((f) => ({ name: featureLabel(f.feature), importance: f.importance }));
              return (
                <div
                  key={key}
                  className={`rounded-xl border bg-background p-3 ${
                    isWinner ? "border-emerald-500/40" : "border-border"
                  }`}
                >
                  <div className="mb-1.5 flex items-center gap-2 px-1">
                    <p className="text-xs font-bold">{m.model_name}</p>
                    {isWinner && (
                      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-500">
                        Active
                      </span>
                    )}
                  </div>
                  <ResponsiveContainer width="100%" height={170}>
                    <BarChart
                      data={chartData}
                      layout="vertical"
                      margin={{ top: 2, right: 20, bottom: 2, left: 4 }}
                    >
                      <CartesianGrid strokeDasharray="4 4" stroke="var(--border)" horizontal={false} />
                      <XAxis
                        type="number"
                        stroke="var(--muted)"
                        tickLine={false}
                        axisLine={{ stroke: "var(--muted)" }}
                        tick={{ fontSize: 10 }}
                        tickFormatter={(v) => `${Math.round(v * 100)}%`}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={132}
                        stroke="var(--muted)"
                        tickLine={false}
                        axisLine={false}
                        interval={0}
                        tick={{ fontSize: 10 }}
                      />
                      <Tooltip
                        formatter={(value) => [`${(Number(value) * 100).toFixed(1)}%`, "Importance"]}
                        contentStyle={{
                          background: "var(--surface)",
                          border: "1px solid var(--border)",
                          borderRadius: 12,
                          color: "var(--ink)",
                          fontSize: 12,
                        }}
                      />
                      <Bar dataKey="importance" fill={MODEL_COLORS[key] ?? "#2563EB"} radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              );
            })}
          </div>

          {metrics.feature_importance[0] && (
            <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-blue-500/20 bg-blue-500/10 p-3 text-xs text-blue-500">
              <Lightbulb size={16} className="mt-0.5 shrink-0" />
              <p>
                <span className="font-bold">{featureLabel(metrics.feature_importance[0].feature)}</span> is
                the most influential feature in the production{" "}
                {metrics?.model_name ?? "Random Forest"} frequency model.
                Random Forest and XGBoost are shown side by side so you can
                compare how each weighs the same signals.
              </p>
            </div>
          )}
        </>
      )}
    </section>
  );
}