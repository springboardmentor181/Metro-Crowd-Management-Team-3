"use client";

import { useState } from "react";

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

const trains = [
  { id: "MF-204", line: "Blue", from: "Dwarka", to: "Noida Electronic City", platform: "2", arrival: "08:42", headway: "2.5 min", load: 91, action: "Add standby rake" },
  { id: "MF-118", line: "Yellow", from: "Samaypur Badli", to: "HUDA City Centre", platform: "1", arrival: "08:45", headway: "3 min", load: 86, action: "Hold 30 sec" },
  { id: "MF-332", line: "Magenta", from: "Janakpuri West", to: "Botanical Garden", platform: "3", arrival: "08:49", headway: "4 min", load: 72, action: "Normal run" },
  { id: "MF-421", line: "Violet", from: "Kashmere Gate", to: "Raja Nahar Singh", platform: "4", arrival: "08:54", headway: "5 min", load: 64, action: "Skip hold" },
];

const optimization = [
  { slot: "06:00-07:30", demand: 54, current: "8 min", proposed: "6 min", extra: 6 },
  { slot: "07:30-10:00", demand: 94, current: "4 min", proposed: "2.5 min", extra: 18 },
  { slot: "10:00-16:30", demand: 66, current: "6 min", proposed: "5 min", extra: 8 },
  { slot: "16:30-20:30", demand: 98, current: "4 min", proposed: "2 min", extra: 22 },
  { slot: "20:30-23:30", demand: 47, current: "9 min", proposed: "8 min", extra: 4 },
];

const constraints = [
  "Respect platform dwell limits and driver roster windows",
  "Prioritize interchange stations above 85% occupancy",
  "Keep reserve trains for breakdown and crowd spike response",
  "Balance power load before adding peak frequency",
];

export default function TrainSchedulingPage() {
  const [planStatus, setPlanStatus] = useState("Refresh plan");
  const [appliedAction, setAppliedAction] = useState<string | null>(null);

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
            Frontend preview for frequency optimization, platform allocation,
            dispatch decisions, maintenance windows, and schedule health.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setPlanStatus("Plan refreshed")}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border bg-background px-4 text-sm font-bold transition hover:border-primary"
          >
            {planStatus}
          </button>
          <Link
            href="/crowd-monitor"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-white transition hover:opacity-90"
          >
            View crowd map
            <ArrowRight size={17} />
          </Link>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric icon={TrainFront} label="Active trains" value="632" note="42 standby ready" />
        <Metric icon={Clock3} label="Peak headway" value="2 min" note="Evening peak plan" />
        <Metric icon={Gauge} label="Demand load" value="96%" note="Blue line pressure" />
        <Metric icon={ShieldCheck} label="Schedule health" value="92%" note="Stable operations" />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black">Frequency optimizer</h2>
              <p className="text-sm text-muted">Static AI plan based on crowd load and route capacity.</p>
            </div>
            <CalendarClock className="text-primary" size={25} />
          </div>
          <div className="space-y-4">
            {optimization.map((slot) => (
              <article key={slot.slot} className="grid gap-4 rounded-xl border border-border bg-background p-4 md:grid-cols-[140px_1fr_190px] md:items-center">
                <div>
                  <p className="text-sm font-black">{slot.slot}</p>
                  <p className="mt-1 text-xs text-muted">{slot.extra} extra trainsets</p>
                </div>
                <div>
                  <div className="mb-2 flex justify-between text-xs font-bold">
                    <span>Demand</span>
                    <span>{slot.demand}%</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-border">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${slot.demand}%` }} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                  <span className="rounded-lg border border-border p-2">
                    Current <strong className="block text-sm">{slot.current}</strong>
                  </span>
                  <span className="rounded-lg bg-primary/10 p-2 text-primary">
                    Proposed <strong className="block text-sm">{slot.proposed}</strong>
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-xl font-black">Dispatch board</h2>
          <div className="mt-5 space-y-3">
            {trains.map((train) => (
              <article key={train.id} className="rounded-xl border border-border bg-background p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-black">{train.id}</p>
                    <p className="mt-1 text-xs text-muted">{train.from} to {train.to}</p>
                  </div>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                    {train.line}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                  <SmallStat icon={MapPin} label="Platform" value={train.platform} />
                  <SmallStat icon={Clock3} label="Arrival" value={train.arrival} />
                  <SmallStat icon={Route} label="Headway" value={train.headway} />
                </div>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <span className="text-xs font-bold text-muted">Load {train.load}%</span>
                  <strong className="text-sm">{train.action}</strong>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-lg font-black">Operating constraints</h2>
          <div className="mt-4 space-y-3">
            {constraints.map((constraint) => (
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
            <Action icon={PlayCircle} title="Dispatch standby train" text="Use when station occupancy crosses 90%." applied={appliedAction === "Dispatch standby train"} onApply={() => setAppliedAction("Dispatch standby train")} />
            <Action icon={PauseCircle} title="Hold train briefly" text="Smooth transfer load at interchange platforms." applied={appliedAction === "Hold train briefly"} onApply={() => setAppliedAction("Hold train briefly")} />
            <Action icon={GitBranch} title="Short-loop service" text="Turn trains around before low-demand terminal." applied={appliedAction === "Short-loop service"} onApply={() => setAppliedAction("Short-loop service")} />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-lg font-black">Maintenance window</h2>
          <div className="mt-4 space-y-4">
            <Action icon={Wrench} title="Rake MF-019" text="Inspection booked at 23:45 after off-peak taper." />
            <Action icon={RadioTower} title="Signal corridor" text="Yellow line block check held until demand drops." />
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

function Action({ icon: Icon, title, text, applied, onApply }: { icon: LucideIcon; title: string; text: string; applied?: boolean; onApply?: () => void }) {
  return (
    <article className="flex gap-3 rounded-xl border border-border bg-background p-3">
      <Icon className="mt-0.5 shrink-0 text-primary" size={19} />
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-black">{title}</h3>
        <p className="mt-1 text-xs leading-5 text-muted">{text}</p>
        {onApply && (
          <button
            type="button"
            onClick={onApply}
            disabled={applied}
            className="mt-3 rounded-lg border border-border bg-card px-3 py-2 text-xs font-bold transition hover:border-primary disabled:cursor-default disabled:border-emerald-500/30 disabled:text-emerald-500"
          >
            {applied ? "Applied" : "Apply action"}
          </button>
        )}
      </div>
    </article>
  );
}
