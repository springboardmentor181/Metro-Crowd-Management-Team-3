import AIInsights from "@/components/dashboard/AIInsights";
import CrowdHeatMap from "@/components/dashboard/CrowdHeatMap";
import OperationsPageShell from "@/components/operations/OperationsPageShell";

export default function PredictionRoute() {
  return (
    <OperationsPageShell
      title="Predictions"
      description="AI forecasts for crowd demand and service planning"
    >
      <div className="space-y-6">
        <section className="rounded-2xl border border-border bg-card p-5">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">
            Predictive operations
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">
            Network demand forecast
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
            Review AI-generated crowd and service recommendations before the
            next operational window.
          </p>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <AIInsights />
          <CrowdHeatMap />
        </section>
      </div>
    </OperationsPageShell>
  );
}