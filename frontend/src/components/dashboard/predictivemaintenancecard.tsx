"use client";

import { useState, type FormEvent } from "react";
import { Gauge, Loader2, Wrench } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { useApiData } from "@/hooks/useApiData";
import { getTrains } from "@/lib/api/trains";
import { predictMaintenance } from "@/lib/api/predictions";
import { useSelectedState } from "@/providers/StateProvider";
import type { HealthStatus, MaintenanceResponse } from "@/lib/api/types";

function errorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === "object" && "response" in err) {
    const detail = (err as { response?: { data?: { detail?: string } } })
      .response?.data?.detail;
    if (detail) return detail;
  }
  return err instanceof Error ? err.message : fallback;
}

const STATUS_STYLES: Record<HealthStatus, { label: string; className: string }> = {
  healthy: { label: "Healthy", className: "border-emerald-500/40 bg-emerald-500/10 text-emerald-500" },
  warning: { label: "Warning", className: "border-amber-500/40 bg-amber-500/10 text-amber-500" },
  critical: { label: "Critical", className: "border-red-500/40 bg-red-500/10 text-red-500" },
};

// Reasonable defaults so the form is usable immediately - roughly the
// median healthy reading from the real predictive_maintenance.csv.
const DEFAULT_READING = {
  compressor_pressure_bar: 8.5,
  motor_current_amp: 13.0,
  oil_temperature_c: 52,
  vibration_amplitude_mm: 0.49,
  air_leakage_flow: 2.5,
  operating_hours: 1200,
};

const FIELDS: { key: keyof typeof DEFAULT_READING; label: string; step: string }[] = [
  { key: "compressor_pressure_bar", label: "Compressor pressure (bar)", step: "0.01" },
  { key: "motor_current_amp", label: "Motor current (amp)", step: "0.01" },
  { key: "oil_temperature_c", label: "Oil temperature (\u00b0C)", step: "0.1" },
  { key: "vibration_amplitude_mm", label: "Vibration amplitude (mm)", step: "0.001" },
  { key: "air_leakage_flow", label: "Air leakage flow", step: "0.01" },
  { key: "operating_hours", label: "Operating hours", step: "1" },
];

export default function PredictiveMaintenanceCard() {
  const { selectedState } = useSelectedState();
  const { data: trains, loading: trainsLoading } = useApiData(
    () => getTrains(selectedState ?? undefined),
    [selectedState],
  );

  const [trainId, setTrainId] = useState<number | "">("");
  const [reading, setReading] = useState(DEFAULT_READING);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MaintenanceResponse | null>(null);

  function updateField(key: keyof typeof DEFAULT_READING, value: string) {
    setReading((prev) => ({ ...prev, [key]: value === "" ? 0 : Number(value) }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!trainId) {
      setError("Pick a train first.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await predictMaintenance({ train_id: trainId, ...reading });
      setResult(response);
    } catch (err) {
      setError(errorMessage(err, "Could not get a maintenance prediction."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="rounded-3xl border border-border bg-card p-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Wrench size={22} />
        </div>
        <div>
          <h2 className="text-xl font-bold">Predictive Maintenance</h2>
          <p className="mt-1 text-sm text-muted">
            Enter a train&apos;s current sensor readings to estimate its
            remaining useful life, from the real predictive_maintenance.csv
            model.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-semibold">Train</label>
          <select
            value={trainId}
            onChange={(e) => setTrainId(e.target.value ? Number(e.target.value) : "")}
            disabled={trainsLoading}
            className="h-12 w-full max-w-sm rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-primary disabled:opacity-60"
          >
            <option value="">
              {trainsLoading ? "Loading trains..." : "Select a train"}
            </option>
            {(trains ?? []).map((t) => (
              <option key={t.id} value={t.id}>
                {t.train_number}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FIELDS.map((field) => (
            <div key={field.key} className="space-y-2">
              <label className="text-sm font-semibold">{field.label}</label>
              <input
                type="number"
                step={field.step}
                value={reading[field.key]}
                onChange={(e) => updateField(field.key, e.target.value)}
                className="h-12 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-primary"
              />
            </div>
          ))}
        </div>

        {error && (
          <p className="rounded-xl bg-red-500/10 p-3 text-sm text-red-500">{error}</p>
        )}

        <Button type="submit" disabled={submitting}>
          {submitting ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Gauge size={16} />
          )}
          {submitting ? "Predicting..." : "Predict Remaining Life"}
        </Button>
      </form>

      {result && (
        <div
          className={`mt-6 rounded-2xl border p-6 ${STATUS_STYLES[result.health_status].className}`}
        >
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide">
                {STATUS_STYLES[result.health_status].label}
              </p>
              <p className="mt-1 text-3xl font-black text-foreground">
                {result.predicted_remaining_useful_life_hrs.toLocaleString()} hrs
              </p>
              <p className="mt-1 text-sm text-muted">estimated remaining useful life</p>
            </div>
            <p className="text-xs text-muted">model: {result.model_version}</p>
          </div>
        </div>
      )}
    </section>
  );
}