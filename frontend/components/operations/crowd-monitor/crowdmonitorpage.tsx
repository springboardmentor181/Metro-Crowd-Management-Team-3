"use client";

import { useState } from "react";
import { AlertTriangle, RadioTower, RefreshCw, Users } from "lucide-react";
import CrowdHeatMap from "@/components/dashboard/CrowdHeatMap";

const hotspots = [
  { station: "Rajiv Chowk", occupancy: 96, action: "Deploy platform marshals" },
  { station: "Kashmere Gate", occupancy: 84, action: "Monitor interchange flow" },
  { station: "Botanical Garden", occupancy: 74, action: "Prepare additional service" },
];

export default function CrowdMonitorPage() {
  const [updated, setUpdated] = useState("Just now");
  return <div className="space-y-6">
    <section className="flex flex-col justify-between gap-5 rounded-2xl border border-border bg-card p-5 lg:flex-row lg:items-center">
      <div><p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Live capacity signal</p><h1 className="mt-2 text-3xl font-black tracking-tight">Crowd monitor</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Inspect live passenger density, select stations on the map, and respond to crowd-risk thresholds.</p></div>
      <button onClick={() => setUpdated("Just now")} className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-3 text-sm font-bold transition hover:border-primary"><RefreshCw size={17} />Refresh · {updated}</button>
    </section>
    <section className="grid gap-4 md:grid-cols-3"><Stat icon={Users} label="Passengers in network" value="184,620" /><Stat icon={AlertTriangle} label="High-risk stations" value="1" danger /><Stat icon={RadioTower} label="Sensors reporting" value="98.4%" /></section>
    <CrowdHeatMap />
    <section className="rounded-2xl border border-border bg-card p-5"><div className="mb-5"><h2 className="text-xl font-black">Priority stations</h2><p className="mt-1 text-sm text-muted">Suggested operational response for the highest live occupancy readings.</p></div><div className="grid gap-3 lg:grid-cols-3">{hotspots.map((station) => <article key={station.station} className="rounded-xl border border-border bg-background p-4"><div className="flex items-center justify-between"><h3 className="font-black">{station.station}</h3><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${station.occupancy >= 90 ? "bg-red-500/10 text-red-500" : "bg-orange-500/10 text-orange-500"}`}>{station.occupancy}%</span></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-border"><div className="h-full rounded-full bg-primary" style={{ width: `${station.occupancy}%` }} /></div><p className="mt-3 text-sm text-muted">{station.action}</p></article>)}</div></section>
  </div>;
}

function Stat({ icon: Icon, label, value, danger = false }: { icon: typeof Users; label: string; value: string; danger?: boolean }) { return <article className="rounded-2xl border border-border bg-card p-5"><div className="flex items-center justify-between"><span className="text-sm font-bold text-muted">{label}</span><Icon className={danger ? "text-red-500" : "text-primary"} size={20} /></div><strong className="mt-4 block text-3xl">{value}</strong></article>; }
