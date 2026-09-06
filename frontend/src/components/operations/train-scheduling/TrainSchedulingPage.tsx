"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Gauge,
  GitBranch,
  MapPin,
  PauseCircle,
  PlayCircle,
  RadioTower,
  Route,
  ShieldCheck,
  TrainFront,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

import { useApiData } from "@/hooks/useApiData";
import { useLiveSocket } from "@/hooks/useLiveSocket";
import { useLiveSocketContext } from "@/providers/LiveSocketProvider";
import { useStations } from "@/hooks/useStations";
import { useAuth } from "@/providers/AuthProvider";
import { useSelectedState } from "@/providers/StateProvider";
import { getTrains } from "@/lib/api/trains";
import {
  adjustFrequency,
  getSchedules,
  reportDelay,
} from "@/lib/api/schedules";
import { getCrowdDashboard } from "@/lib/api/crowd";
import { queryKeys } from "@/lib/queryKeys";
import type { TrainSchedule } from "@/lib/api/types";

const HOUR_BUCKETS = [
  { label: "06:00-08:00", start: 6, end: 8 },
  { label: "08:00-11:00", start: 8, end: 11 },
  { label: "11:00-17:00", start: 11, end: 17 },
  { label: "17:00-20:00", start: 17, end: 20 },
  { label: "20:00-23:00", start: 20, end: 23 },
];

function hourOf(time: string) {
  return Number(time.split(":")[0]);
}

const FALLBACK_POLL_MS = 30000;

export default function TrainSchedulingPage() {
  const { profile } = useAuth();
  const canManage = profile?.role === "admin" || profile?.role === "operator";

  const { data: stations } = useStations();
  const { selectedState } = useSelectedState();
  const { isConnected } = useLiveSocketContext();
  
  const trains = useApiData(
    queryKeys.trains,
    (signal) => getTrains(selectedState ?? undefined, signal),
    [selectedState],
    FALLBACK_POLL_MS,
  );
  
  const schedules = useApiData(
    queryKeys.schedules,
    (signal) => getSchedules({ state: selectedState ?? undefined }, signal),
    [selectedState],
    isConnected ? 0 : FALLBACK_POLL_MS,
  );
  const crowd = useApiData(
    queryKeys.crowdDashboard,
    (signal) => getCrowdDashboard(selectedState ?? undefined, signal),
    [selectedState],
    isConnected ? 0 : FALLBACK_POLL_MS,
  );

  useLiveSocket({
    delay_alert: () => schedules.refresh(),
    train_position: () => schedules.refresh(),
    crowd_update: () => crowd.refresh(),
  });

  const [busyId, setBusyId] = useState<number | null>(null);
  const [actionMessage, setActionMessage] = useState("");

  const stationName = (id: number) =>
    stations?.find((s) => s.id === id)?.station_name ?? `Station #${id}`;
  const trainNumber = (id: number) =>
    trains.data?.find((t) => t.id === id)?.train_number ?? `Train #${id}`;

  const loading = trains.loading || schedules.loading || crowd.loading;

  const activeTrains = (trains.data ?? []).filter((t) => t.is_active).length;
  const peakSchedules = (schedules.data ?? []).filter((s) => s.is_peak_hour);
  const peakHeadway =
    peakSchedules.length > 0
      ? Math.min(...peakSchedules.map((s) => s.frequency_minutes))
      : null;
  const demandLoad =
    (crowd.data ?? []).length > 0
      ? Math.max(...(crowd.data ?? []).map((c) => c.occupancy_ratio)) * 100
      : null;
  const delayedCount = (schedules.data ?? []).filter((s) => s.delay_minutes > 0).length;
  const totalCount = (schedules.data ?? []).length;
  const scheduleHealth = totalCount > 0 ? ((totalCount - delayedCount) / totalCount) * 100 : null;

  const buckets = useMemo(() => {
    const list = schedules.data ?? [];
    return HOUR_BUCKETS.map((bucket) => {
      const entries = list.filter((s) => {
        const h = hourOf(s.arrival_time);
        return h >= bucket.start && h < bucket.end;
      });
      const avgFrequency =
        entries.length > 0
          ? entries.reduce((sum, e) => sum + e.frequency_minutes, 0) / entries.length
          : null;
      const hasPeak = entries.some((e) => e.is_peak_hour);
      const proposed = avgFrequency !== null
        ? hasPeak
          ? Math.max(2, Math.round(avgFrequency * 0.7 * 10) / 10)
          : avgFrequency
        : null;

      return { ...bucket, entries: entries.length, avgFrequency, proposed, hasPeak };
    });
  }, [schedules.data]);

  const upcoming = [...(schedules.data ?? [])]
    .sort((a, b) => a.arrival_time.localeCompare(b.arrival_time))
    .slice(0, 8);

  async function handleReportDelay(schedule: TrainSchedule) {
    const input = window.prompt(
      `Report delay for ${trainNumber(schedule.train_id)} at ${stationName(schedule.station_id)} (minutes):`,
      "5",
    );
    if (input === null) return;
    const minutes = Number(input);
    if (Number.isNaN(minutes) || minutes < 0) {
      setActionMessage("Enter a valid number of minutes.");
      return;
    }

    setBusyId(schedule.id);
    try {
      await reportDelay(schedule.id, minutes);
      setActionMessage(`Delay recorded for ${trainNumber(schedule.train_id)}.`);
      schedules.refresh();
    } catch (err) {
      setActionMessage(err instanceof Error ? err.message : "Could not report delay.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleAdjustFrequency(schedule: TrainSchedule) {
    const input = window.prompt(
      `New frequency (minutes) for ${trainNumber(schedule.train_id)} at ${stationName(schedule.station_id)}:`,
      String(schedule.frequency_minutes),
    );
    if (input === null) return;
    const minutes = Number(input);
    if (Number.isNaN(minutes) || minutes <= 0) {
      setActionMessage("Enter a valid frequency in minutes.");
      return;
    }

    setBusyId(schedule.id);
    try {
      await adjustFrequency(schedule.id, minutes);
      setActionMessage(`Frequency updated for ${trainNumber(schedule.train_id)}.`);
      schedules.refresh();
    } catch (err) {
      setActionMessage(err instanceof Error ? err.message : "Could not adjust frequency.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-5 rounded-2xl border border-border bg-card p-5 lg:flex-row lg:items-center">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">
            Train Scheduling
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">
            AI assisted timetable and dispatch planning
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
            Live schedules, frequency optimization, and delay handling backed
            by MetroFlow&apos;s Scheduling Management &amp; AI Prediction
            modules.
          </p>
        </div>
        <Link
          href="/dashboard#crowd"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-white transition hover:opacity-90"
        >
          View crowd map
          <ArrowRight size={17} />
        </Link>
      </div>

      {!canManage && (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm text-muted">
          You&apos;re viewing this page in read-only mode. Sign in as an
          operator or admin to report delays or adjust frequency.
        </div>
      )}

      {actionMessage && (
        <div className="rounded-2xl border border-border bg-background p-4 text-sm">
          {actionMessage}
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric icon={TrainFront} label="Active trains" value={loading ? "--" : String(activeTrains)} note={`${trains.data?.length ?? 0} in fleet`} />
        <Metric icon={Clock3} label="Peak headway" value={loading || peakHeadway === null ? "--" : `${peakHeadway} min`} note="Shortest peak interval" />
        <Metric icon={Gauge} label="Demand load" value={loading || demandLoad === null ? "--" : `${demandLoad.toFixed(0)}%`} note="Busiest station now" />
        <Metric icon={ShieldCheck} label="Schedule health" value={loading || scheduleHealth === null ? "--" : `${scheduleHealth.toFixed(0)}%`} note={`${delayedCount} delayed / ${totalCount}`} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black">Frequency optimizer</h2>
              <p className="text-sm text-muted">AI plan based on scheduled trains and peak-hour flags.</p>
            </div>
            <CalendarClock className="text-primary" size={25} />
          </div>
          <div className="space-y-4">
            {buckets.map((slot) => (
              <article key={slot.label} className="grid gap-4 rounded-xl border border-border bg-background p-4 md:grid-cols-[140px_1fr_190px] md:items-center">
                <div>
                  <p className="text-sm font-black">{slot.label}</p>
                  <p className="mt-1 text-xs text-muted">{slot.entries} scheduled trips</p>
                </div>
                <div>
                  <div className="mb-2 flex justify-between text-xs font-bold">
                    <span>{slot.hasPeak ? "Peak window" : "Off-peak"}</span>
                    <span>{slot.entries > 0 ? `${slot.entries} trips` : "No data"}</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-border">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, slot.entries * 15)}%` }} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                  <span className="rounded-lg border border-border p-2">
                    Current <strong className="block text-sm">{slot.avgFrequency !== null ? `${slot.avgFrequency.toFixed(1)} min` : "--"}</strong>
                  </span>
                  <span className="rounded-lg bg-primary/10 p-2 text-primary">
                    Proposed <strong className="block text-sm">{slot.proposed !== null ? `${slot.proposed} min` : "--"}</strong>
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-xl font-black">Dispatch board</h2>
          <p className="text-sm text-muted">Next scheduled arrivals across the network.</p>
          <div className="mt-5 space-y-3">
            {loading && <p className="text-sm text-muted">Loading schedules...</p>}

            {!loading && upcoming.map((schedule) => (
              <article key={schedule.id} className="rounded-xl border border-border bg-background p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-black">{trainNumber(schedule.train_id)}</p>
                    <p className="mt-1 text-xs text-muted">{stationName(schedule.station_id)}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                    schedule.status === "delayed"
                      ? "bg-orange-500/10 text-orange-500"
                      : "bg-primary/10 text-primary"
                  }`}>
                    {schedule.status.replace("_", " ")}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                  <SmallStat icon={MapPin} label="Platform" value={String(schedule.platform_number)} />
                  <SmallStat icon={Clock3} label="Arrival" value={schedule.arrival_time.slice(0, 5)} />
                  <SmallStat icon={Route} label="Frequency" value={`${schedule.frequency_minutes} min`} />
                </div>
                {schedule.delay_minutes > 0 && (
                  <p className="mt-3 text-xs font-bold text-orange-500">
                    Delayed {schedule.delay_minutes} min
                  </p>
                )}
                {canManage && (
                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      disabled={busyId === schedule.id}
                      onClick={() => handleReportDelay(schedule)}
                      className="flex-1 rounded-lg border border-border px-3 py-2 text-xs font-bold transition hover:bg-muted disabled:opacity-50"
                    >
                      Report delay
                    </button>
                    <button
                      type="button"
                      disabled={busyId === schedule.id}
                      onClick={() => handleAdjustFrequency(schedule)}
                      className="flex-1 rounded-lg bg-primary/10 px-3 py-2 text-xs font-bold text-primary transition hover:bg-primary/20 disabled:opacity-50"
                    >
                      Adjust frequency
                    </button>
                  </div>
                )}
              </article>
            ))}

            {!loading && upcoming.length === 0 && (
              <p className="text-sm text-muted">No schedules found. Run the backend seed script.</p>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-lg font-black">Operating constraints</h2>
          <div className="mt-4 space-y-3">
            {[
              "Respect platform dwell limits and driver roster windows",
              "Prioritize interchange stations above 85% occupancy",
              "Keep reserve trains for breakdown and crowd spike response",
              "Balance power load before adding peak frequency",
            ].map((constraint) => (
              <div key={constraint} className="flex gap-3 rounded-xl border border-border bg-background p-3">
                <CheckCircle2 className="mt-0.5 shrink-0 text-primary" size={18} />
                <p className="text-sm leading-5">{constraint}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-lg font-black">Control actions</h2>
          <div className="mt-4 grid gap-3">
            <Action icon={PlayCircle} title="Dispatch standby train" text="Use when station occupancy crosses 90%." />
            <Action icon={PauseCircle} title="Hold train briefly" text="Smooth transfer load at interchange platforms." />
            <Action icon={GitBranch} title="Short-loop service" text="Turn trains around before low-demand terminal." />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-lg font-black">Maintenance window</h2>
          <div className="mt-4 space-y-4">
            <Action icon={Wrench} title="Scheduled inspections" text="Book maintenance during off-peak taper (20:30+)." />
            <Action icon={RadioTower} title="Signal corridor checks" text="Hold block checks until demand drops below 50%." />
            <Action icon={AlertCircle} title="Risk note" text="Avoid removing more than two standby trains before 20:30." />
          </div>
        </div>
      </section>
    </div>
  );
}

function Metric({ icon: Icon, label, value, note }: { icon: LucideIcon; label: string; value: string; note: string }) {
  return (
    <article className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between text-muted">
        <span className="text-sm font-bold">{label}</span>
        <Icon size={19} className="text-primary" />
      </div>
      <strong className="mt-4 block text-3xl">{value}</strong>
      <p className="mt-2 text-xs font-semibold text-primary">{note}</p>
    </article>
  );
}

function SmallStat({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <span className="rounded-lg border border-border p-2">
      <span className="flex items-center gap-1 text-muted">
        <Icon size={13} />
        {label}
      </span>
      <strong className="mt-1 block">{value}</strong>
    </span>
  );
}

function Action({ icon: Icon, title, text }: { icon: LucideIcon; title: string; text: string }) {
  return (
    <article className="flex gap-3 rounded-xl border border-border bg-background p-3">
      <Icon className="mt-0.5 shrink-0 text-primary" size={19} />
      <div>
        <h3 className="text-sm font-black">{title}</h3>
        <p className="mt-1 text-xs leading-5 text-muted">{text}</p>
      </div>
    </article>
  );
}
