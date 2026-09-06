"use client";

import { memo, useCallback, useMemo, useState, type ComponentType } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BrainCircuit,
  Clock3,
  MousePointerClick,
  TrainFront,
  Users,
} from "lucide-react";

import {
  useGetCrowdDashboardQuery,
  useGetTrainsQuery,
  useGetDelayedSchedulesQuery,
  useGetPredictionInsightsQuery,
} from "@/store/apiSlice";
import { useApiData } from "@/hooks/useApiData";
import { getCrowdModelMetrics } from "@/lib/api/predictions";
import { queryKeys } from "@/lib/queryKeys";
import { useLiveSocket } from "@/hooks/useLiveSocket";
import { useAuth } from "@/providers/AuthProvider";
import { useSelectedState } from "@/providers/StateProvider";
import LiveTrainsListModal from "@/components/dashboard/LiveTrainsListModal";
import DashboardDateTime from "@/components/dashboard/DashboardDateTime";

const LIVE_POLL_INTERVAL_MS = 30000;

interface KPIStat {
  title: string;
  value: string;
  change: string;
  up: boolean;
  icon: ComponentType<{ size?: number; className?: string }>;
  color: string;
  onClick?: () => void;
  hint?: string;
}

const KPICard = memo(function KPICard({ item }: { item: KPIStat }) {
  const Icon = item.icon;
  const TrendIcon = item.up ? ArrowUpRight : ArrowDownRight;
  const clickable = typeof item.onClick === "function";
  const Container = clickable ? "button" : "div";

  return (
    <Container
      type={clickable ? "button" : undefined}
      onClick={clickable ? item.onClick : undefined}
      className={`
      group
      relative
      overflow-hidden
      rounded-3xl
      border
      border-border
      bg-card
      p-7
      text-left
      transition-all
      duration-300
      hover:-translate-y-2
      hover:shadow-2xl
      ${clickable ? "cursor-pointer hover:border-primary/40" : ""}
      `}
    >
      <div
        className={`
        absolute
        right-0
        top-0
        h-40
        w-40
        rounded-full
        ${item.color}
        opacity-10
        blur-[80px]
        `}
      />

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted">{item.title}</p>
          <h2 className="mt-3 text-4xl font-black">{item.value}</h2>
        </div>

        <div
          className={`
          flex
          h-14
          w-14
          items-center
          justify-center
          rounded-2xl
          ${item.color}
          text-white
          `}
        >
          <Icon size={28} />
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between">
        <div
          className={`
          flex
          items-center
          gap-2
          rounded-full
          px-3
          py-2
          text-sm
          font-semibold
          ${item.up ? "bg-emerald-500/10 text-emerald-500" : "bg-orange-500/10 text-orange-500"}
          `}
        >
          <TrendIcon size={16} />
          {item.change}
        </div>

        {clickable ? (
          <MousePointerClick size={18} className="text-primary" />
        ) : (
          <Activity size={18} className="text-muted" />
        )}
      </div>

      {item.hint && (
        <p className="mt-3 text-xs font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100">
          {item.hint}
        </p>
      )}
    </Container>
  );
});

export default function KPISection() {
  const { profile } = useAuth();
  const { selectedState } = useSelectedState();
  const [showActiveTrains, setShowActiveTrains] = useState(false);
  const router = useRouter();

  const crowd = useGetCrowdDashboardQuery(selectedState ?? undefined);
  const trains = useGetTrainsQuery(selectedState ?? undefined, {
    pollingInterval: LIVE_POLL_INTERVAL_MS,
  });
  const delayed = useGetDelayedSchedulesQuery({ state: selectedState ?? undefined });
  const predictions = useGetPredictionInsightsQuery({
    limit: 30,
    state: selectedState ?? undefined,
  });
  const { data: modelMetrics, loading: modelMetricsLoading } = useApiData(
    queryKeys.crowdModelMetrics,
    (signal) => getCrowdModelMetrics(signal),
    [],
    60000,
  );

  useLiveSocket({
    crowd_update: () => crowd.refetch(),
    delay_alert: () => delayed.refetch(),
  });

  const loading =
    crowd.isLoading || trains.isLoading || delayed.isLoading || predictions.isLoading;
  const accuracyLoading = modelMetricsLoading && !modelMetrics;

  const openActiveTrains = useCallback(() => setShowActiveTrains(true), []);
  const openModelPerformance = useCallback(() => router.push("/ai-prediction"), [router]);

  const stats = useMemo<KPIStat[]>(() => {
    const livePassengers = (crowd.data ?? []).reduce((sum, s) => sum + s.current_count, 0);
    const activeTrains = (trains.data ?? []).filter((t) => t.is_active).length;
    const modelAccuracyPct =
      modelMetrics?.available && modelMetrics.accuracy !== null
        ? modelMetrics.accuracy * 100
        : null;
    const avgDelay =
      delayed.data && delayed.data.length > 0
        ? delayed.data.reduce((sum, s) => sum + s.delay_minutes, 0) / delayed.data.length
        : 0;

    return [
      {
        title: "Live Passengers",
        value: loading ? "--" : livePassengers.toLocaleString(),
        change: `${(crowd.data ?? []).length} stations`,
        up: true,
        icon: Users,
        color: "bg-blue-500",
      },
      {
        title: "Active Trains",
        value: loading ? "--" : String(activeTrains),
        change: `${(trains.data ?? []).length} total`,
        up: true,
        icon: TrainFront,
        color: "bg-emerald-500",
        onClick: openActiveTrains,
        hint: "Tap to view live trains",
      },
      {
        title: "AI Prediction Accuracy",
        value:
          accuracyLoading || modelAccuracyPct === null
            ? "--"
            : `${modelAccuracyPct.toFixed(1)}%`,
        change: modelMetrics?.model_name
          ? modelMetrics.model_name
          : modelMetrics?.available
            ? "Live model"
            : "Heuristic fallback",
        up: true,
        icon: BrainCircuit,
        color: "bg-violet-500",
        onClick: openModelPerformance,
        hint: "Tap to view model performance",
      },
      {
        title: "Average Delay",
        value: loading ? "--" : `${avgDelay.toFixed(1)} Min`,
        change: `${(delayed.data ?? []).length} delayed`,
        up: false,
        icon: Clock3,
        color: "bg-orange-500",
      },
    ];
  }, [
    crowd.data,
    trains.data,
    delayed.data,
    loading,
    accuracyLoading,
    modelMetrics,
    openActiveTrains,
    openModelPerformance,
  ]);

  return (
    <section className="space-y-8">

      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-muted">
          Welcome back{profile ? `, ${profile.full_name}` : ""} 👋
          {selectedState ? ` — showing ${selectedState}` : " — showing all of India"}
        </p>

        <DashboardDateTime />
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <KPICard key={item.title} item={item} />
        ))}
      </div>

      {showActiveTrains && (
        <LiveTrainsListModal onClose={() => setShowActiveTrains(false)} />
      )}
    </section>
  );
}