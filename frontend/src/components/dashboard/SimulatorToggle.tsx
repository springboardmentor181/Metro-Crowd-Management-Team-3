
"use client";

import { useEffect, useState } from "react";
import { PlayCircle, StopCircle } from "lucide-react";

import { useAuth } from "@/providers/AuthProvider";
import { getSimulatorStatus, startSimulator, stopSimulator } from "@/lib/api/admin";

export default function SimulatorToggle() {
  const { profile } = useAuth();
  const [running, setRunning] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  const canControl = profile?.role === "admin" || profile?.role === "operator";

  useEffect(() => {
    if (!canControl) return;
    getSimulatorStatus()
      .then((s) => setRunning(s.crowd_simulator_running))
      .catch(() => setRunning(null));
  }, [canControl]);

  if (!canControl || running === null) return null;

  async function toggle() {
    setBusy(true);
    try {
      const result = running ? await stopSimulator() : await startSimulator();
      setRunning(result.crowd_simulator_running);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      title={
        running
          ? "Live simulation is ON - counts are auto-fluctuating. Click to freeze."
          : "Static - counts only change from real check-ins. Click to start live simulation."
      }
      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
        running
          ? "bg-emerald-500/10 text-emerald-500"
          : "bg-muted/40 text-muted"
      }`}
    >
      {running ? <StopCircle size={14} /> : <PlayCircle size={14} />}
      {running ? "Live simulation ON" : "Static"}
    </button>
  );
}
