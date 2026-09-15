"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Clock,
  Gauge,
  Info,
  RefreshCw,
  Sparkles,
} from "lucide-react";

import { useApiData } from "@/hooks/useApiData";
import { useDebouncedRefresh } from "@/hooks/useDebouncedRefresh";
import { useLiveSocket } from "@/hooks/useLiveSocket";
import { useLiveSocketContext } from "@/providers/LiveSocketProvider";
import { getInflowOutflow, getStationAnalytics, getStationMonitor } from "@/lib/api/crowd";
import { predictCrowd } from "@/lib/api/predictions";
import { queryKeys } from "@/lib/queryKeys";
import type {
  InflowOutflow,
  Prediction,
  StationAnalytics,
  StationMonitorEntry,
} from "@/lib/api/types";

interface Props {
  stationId: number | null;
  stationName?: string;
  /** Optional: called when the person wants to hand control back to
   * auto-rotation after a manual pick (see the "Auto-rotate" button
   * that only appears while `stationId` is set). Wire this to
   * whatever clears the parent's selected-station state. */
  onResumeAutoRotate?: () => void;
}

// Matches the backend's CROWD_HISTORY_INTERVAL_SECONDS default
// (app/core/config.py) - how often a fresh crowd_logs row lands for a
// station once the live simulator is running. Also reused as the
// auto-rotation cadence below, so "next update" and "next station"
// stay in sync at a glance. Only used to word these cards, not as an
// exact server-confirmed countdown - if the backend's .env overrides
// CROWD_HISTORY_INTERVAL_SECONDS, this is an approximation.
const HISTORY_INTERVAL_SECONDS = 60;
const ROTATE_INTERVAL_MS = HISTORY_INTERVAL_SECONDS * 1000;

export default function StationAnalyticsPanel({
  stationId,
  stationName,
  onResumeAutoRotate,
}: Props) {
  const { isConnected } = useLiveSocketContext();

  // A station picked on the map (stationId prop set by the parent) is
  // always a manual pick and wins. With nothing manually picked, the
  // panel auto-rotates through active stations on its own every 60s
  // instead of just sitting empty - see the effect below.
  const isManual = stationId !== null;

  // Bulk snapshot (inflow/outflow already computed server-side per
  // station - see StationMonitorEntry) used to pick which station to
  // rotate to next. Only fetched in auto mode; a manual pick doesn't
  // need this list at all.
  const monitorQuery = useApiData<StationMonitorEntry[]>(
    queryKeys.stationMonitor,
    (signal) => getStationMonitor(undefined, 24, signal),
    [],
    isManual ? 0 : ROTATE_INTERVAL_MS,
  );
  const monitorEntriesRef = useRef<StationMonitorEntry[]>([]);
  useEffect(() => {
    monitorEntriesRef.current = monitorQuery.data ?? [];
  }, [monitorQuery.data]);

  const [autoStation, setAutoStation] = useState<{ id: number; name: string } | null>(null);
  const rotationIndexRef = useRef(0);

  // Prefers stations that already have a real inflow/outflow signal
  // (i.e. enough crowd readings to compute a delta from - see the
  // "correct outflow inflow" requirement) so auto-rotation doesn't
  // keep landing on stations that only show the "not ready yet" card.
  // Falls back to whatever the monitor returned if none qualify yet
  // (e.g. right after a fresh deploy, before any station has 2
  // readings).
  const pickNextAutoStation = useCallback(() => {
    const entries = monitorEntriesRef.current;
    if (entries.length === 0) return;
    const withFlow = entries.filter((e) => e.inflow > 0 || e.outflow > 0);
    const pool = withFlow.length > 0 ? withFlow : entries;
    const next = pool[rotationIndexRef.current % pool.length];
    rotationIndexRef.current += 1;
    setAutoStation({ id: next.station_id, name: next.station_name });
  }, []);

  useEffect(() => {
    if (isManual) return;
    pickNextAutoStation();
    const id = setInterval(pickNextAutoStation, ROTATE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [isManual, pickNextAutoStation]);

  // Also re-pick as soon as the monitor list first arrives (or later
  // refreshes) if auto-rotation hasn't landed on a station yet, so a
  // slow first load doesn't leave the panel empty for a full 60s.
  useEffect(() => {
    if (isManual || autoStation !== null) return;
    pickNextAutoStation();
  }, [isManual, autoStation, monitorQuery.data, pickNextAutoStation]);

  const effectiveStationId = stationId ?? autoStation?.id ?? null;
  const effectiveStationName = stationName ?? autoStation?.name;

  const hasStation = effectiveStationId !== null;
  const analyticsQuery = useApiData<StationAnalytics | null>(
    queryKeys.stationAnalytics,
    (signal) =>
      effectiveStationId === null
        ? Promise.resolve(null)
        : getStationAnalytics(effectiveStationId, signal),
    [effectiveStationId],
    !hasStation || isConnected ? 0 : 30000,
  );
  const flowQuery = useApiData<InflowOutflow | null>(
    queryKeys.inflowOutflow,
    (signal) =>
      effectiveStationId === null
        ? Promise.resolve(null)
        : getInflowOutflow(effectiveStationId, 24, signal),
    [effectiveStationId],
    !hasStation || isConnected ? 0 : 30000,
  );
  // AI-predicted crowd count for this station right now - same model
  // the live simulator itself uses to weight check-ins (see
  // app/ai_engine/prediction/crowd_predictor.py), just surfaced
  // directly here instead of only driving the simulator behind the
  // scenes. Polls independently of the live socket since a prediction
  // is a forecast, not something crowd_update ever pushes.
  const predictionQuery = useApiData<Prediction | null>(
    queryKeys.stationCrowdPrediction,
    () =>
      effectiveStationId === null
        ? Promise.resolve(null)
        : predictCrowd(effectiveStationId),
    [effectiveStationId],
    hasStation ? 60000 : 0,
  );
  const { data: analytics, loading: analyticsLoading } = analyticsQuery;
  const { data: flow, loading: flowLoading } = flowQuery;
  const { data: prediction, loading: predictionLoading } = predictionQuery;

  const debouncedAnalyticsRefresh = useDebouncedRefresh(analyticsQuery.refresh);
  const debouncedFlowRefresh = useDebouncedRefresh(flowQuery.refresh);

  // Drives the "Next update" card below: the last moment a
  // crowd_update for THIS station arrived over the live socket, and a
  // 1s ticking clock to count seconds elapsed since then.
  const [lastUpdateAt, setLastUpdateAt] = useState<number>(() => Date.now());
  const [secondsSinceUpdate, setSecondsSinceUpdate] = useState(0);

  useLiveSocket({
    crowd_update: (payload) => {
      if (payload.updates.some((u) => u.station_id === effectiveStationId)) {
        debouncedAnalyticsRefresh();
        debouncedFlowRefresh();
        setLastUpdateAt(Date.now());
        setSecondsSinceUpdate(0);
      }
    },
  });

  // Reset the clock whenever the displayed station changes (manual
  // pick or an auto-rotation hop), so the countdown doesn't carry
  // over from whichever station was showing before.
  useEffect(() => {
    setLastUpdateAt(Date.now());
    setSecondsSinceUpdate(0);
  }, [effectiveStationId]);

  useEffect(() => {
    const id = setInterval(() => {
      setSecondsSinceUpdate(Math.floor((Date.now() - lastUpdateAt) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [lastUpdateAt]);

  if (effectiveStationId === null) {
    return (
      <section className="rounded-3xl border border-border bg-card p-8">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Station Analytics</h2>
          <div className="rounded-xl bg-primary/10 p-3">
            <BarChart3 className="text-primary" size={28} />
          </div>
        </div>
        <p className="text-sm text-muted">
          Waiting for live station data to start auto-rotating every{" "}
          {HISTORY_INTERVAL_SECONDS} seconds...
        </p>
      </section>
    );
  }

  const loading = analyticsLoading || flowLoading;

  // Inflow/Outflow is a DELTA between two consecutive crowd_logs
  // readings in the window (see crowd_service.crowd_flow_aggregate on
  // the backend) - with 0 or 1 samples there's nothing to diff yet,
  // so a "0" there doesn't mean "no passengers moved", it means "not
  // enough readings yet" and used to be shown as a plain, misleading
  // 0. Those two cards are hidden until there's an actual delta to
  // show; Average/Peak occupancy only need 1 sample so they keep
  // showing as soon as any reading exists.
  const hasFlowTrend = !!flow && flow.samples >= 2;

  const secondsUntilNext = Math.max(0, HISTORY_INTERVAL_SECONDS - secondsSinceUpdate);
  const displayStationName = effectiveStationName ?? "this station";

  return (
    <section className="rounded-3xl border border-border bg-card p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Station Analytics</h2>
          <p className="mt-2 text-muted">
            {displayStationName} - last 24 hours
            {!isManual && (
              <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                Auto-rotating every {HISTORY_INTERVAL_SECONDS}s
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isManual && onResumeAutoRotate && (
            <button
              type="button"
              onClick={onResumeAutoRotate}
              className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-medium text-muted transition hover:text-foreground"
            >
              <RefreshCw size={14} />
              Auto-rotate
            </button>
          )}
          <div className="rounded-xl bg-primary/10 p-3">
            <BarChart3 className="text-primary" size={28} />
          </div>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted">Loading station analytics...</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {hasFlowTrend && flow && (
            <>
              <StatCard
                icon={<ArrowUpRight className="text-emerald-500" size={20} />}
                label="Inflow (24h)"
                value={flow.inflow.toLocaleString()}
              />
              <StatCard
                icon={<ArrowDownRight className="text-red-500" size={20} />}
                label="Outflow (24h)"
                value={flow.outflow.toLocaleString()}
              />
            </>
          )}
          <StatCard
            icon={<Gauge className="text-primary" size={20} />}
            label="Average occupancy"
            value={analytics ? analytics.average_count_24h.toLocaleString() : "-"}
          />
          <StatCard
            icon={<Gauge className="text-orange-500" size={20} />}
            label="Peak occupancy"
            value={analytics ? analytics.peak_count_24h.toLocaleString() : "-"}
          />
        </div>
      )}

      {!loading && flow && !hasFlowTrend && (
        <div className="mt-6 flex gap-3 rounded-xl bg-primary/5 p-4 text-sm text-muted">
          <Info className="mt-0.5 shrink-0 text-primary" size={16} />
          <div>
            <p className="font-semibold text-foreground">
              Inflow/Outflow for {displayStationName} isn&apos;t ready yet
            </p>

            <p className="mt-1">
              {flow.samples === 0 ? (
                <>No crowd readings recorded for this station in the last 24h yet.</>
              ) : (
                <>
                  Only {flow.samples} crowd reading recorded for this station in the
                  last 24h. Inflow/Outflow needs at least 2 readings to calculate a
                  trend, since it&apos;s the difference between consecutive readings -
                  a single reading has nothing to compare against yet.
                </>
              )}
            </p>

            <p className="mt-1">
              Turn on the live simulator (<code>ENABLE_SIMULATOR=True</code> in the
              backend&apos;s <code>.env</code>) so a new AI-predicted reading lands for
              every active station roughly every {HISTORY_INTERVAL_SECONDS} seconds.
              {!isManual && (
                <> Auto-rotation already skips stations like this one whenever a station with real flow data is available.</>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Next update - always shown once a station is displayed, tells
          the person exactly which station this timer is for, how soon
          its next live reading should land, and (in auto mode) when
          the panel will hop to a different station. */}
      <div className="mt-4 flex gap-3 rounded-xl border border-border bg-background p-4 text-sm">
        <Clock className="mt-0.5 shrink-0 text-primary" size={16} />
        <div>
          <p className="font-semibold text-foreground">
            Next update for {displayStationName}
          </p>
          <p className="mt-1 text-muted">
            {secondsUntilNext > 0 ? (
              <>
                Expected in about <strong className="text-foreground">{secondsUntilNext}s</strong>.
              </>
            ) : (
              <>Due any moment now.</>
            )}{" "}
            The live simulator writes a fresh AI-predicted crowd reading for every
            active station roughly every {HISTORY_INTERVAL_SECONDS} seconds; this
            panel updates itself the instant {displayStationName}&apos;s reading
            arrives over the live feed, no manual refresh needed.
            {!isManual && (
              <>
                {" "}This panel will also move on to a different station automatically
                in that same window - click any station on the map above to stay on
                one station instead.
              </>
            )}
          </p>
        </div>
      </div>

      {/* AI Prediction - the model's own forecast for this station,
          right now, separate from the historical stats above. */}
      <div className="mt-4 flex gap-3 rounded-xl border border-border bg-background p-4 text-sm">
        <Sparkles className="mt-0.5 shrink-0 text-primary" size={16} />
        <div className="w-full">
          <p className="font-semibold text-foreground">
            AI prediction for {displayStationName}
          </p>
          {predictionLoading ? (
            <p className="mt-1 text-muted">Running the crowd model...</p>
          ) : prediction ? (
            <>
              <p className="mt-1 text-muted">
                Predicted count right now:{" "}
                <strong className="text-foreground">
                  {Math.round(prediction.predicted_value).toLocaleString()}
                </strong>
                {typeof prediction.confidence === "number" && (
                  <> · confidence ~{Math.round(prediction.confidence * 100)}%</>
                )}
              </p>
              <p className="mt-1 text-muted">
                Model: {prediction.model_version ?? "unknown"}. This is a live forecast
                from the AI engine, refreshed independently of the historical stats
                above - it can move ahead of the next crowd reading landing.
              </p>
            </>
          ) : (
            <p className="mt-1 text-muted">
              No prediction available for {displayStationName} right now.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-background p-5">
      <div className="mb-3 flex items-center gap-2">
        {icon}
        <span className="text-sm text-muted">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}