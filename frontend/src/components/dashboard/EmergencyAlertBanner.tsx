"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ChevronLeft, ChevronRight, X } from "lucide-react";

import { useLiveSocket, type StationAlertPayload } from "@/hooks/useLiveSocket";
import { useApiData } from "@/hooks/useApiData";
import { useSelectedState } from "@/providers/StateProvider";
import { getAlerts } from "@/lib/api/alerts";
import { queryKeys } from "@/lib/queryKeys";
import type { Alert } from "@/lib/api/types";

interface EmergencyItem {
  alertId: number;
  stationName: string | null;
  message: string;
  availableUntil: string | null;
}

export default function EmergencyAlertBanner() {
  const { selectedState } = useSelectedState();
  const [live, setLive] = useState<EmergencyItem[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<number>>(new Set());
  const [index, setIndex] = useState(0);

  const { data: initialAlerts } = useApiData(
    `${queryKeys.alerts}:emergency-banner:${selectedState ?? "all"}`,
    (signal) => getAlerts(true, selectedState ?? undefined, signal),
    [selectedState],
  );

  const initial = useMemo<EmergencyItem[]>(
    () =>
      (initialAlerts ?? [])
        .filter((a: Alert) => a.alert_type === "emergency" && !a.is_resolved)
        .map((a: Alert) => ({
          alertId: a.id,
          stationName: null,
          message: a.message,
          availableUntil: a.available_until,
        })),
    [initialAlerts],
  );

  useLiveSocket({
    station_alert: (payload: StationAlertPayload) => {
      if (payload.alert_type !== "emergency") return;

      setLive((current) => {
        if (payload.is_resolved) {
          return current.filter((item) => item.alertId !== payload.alert_id);
        }
        const next = current.filter((item) => item.alertId !== payload.alert_id);
        return [
          {
            alertId: payload.alert_id,
            stationName: payload.station_name,
            message: payload.message,
            availableUntil: payload.available_until,
          },
          ...next,
        ];
      });
    },
  });

  const merged = useMemo<EmergencyItem[]>(() => {
    const byId = new Map<number, EmergencyItem>();
    for (const item of initial) byId.set(item.alertId, item);
    for (const item of live) byId.set(item.alertId, item);
    return Array.from(byId.values()).filter((item) => !dismissedIds.has(item.alertId));
  }, [initial, live, dismissedIds]);

  useEffect(() => {
    if (index >= merged.length) setIndex(0);
  }, [merged.length, index]);

  if (merged.length === 0) return null;

  const current = merged[Math.min(index, merged.length - 1)];

  const dismiss = () => {
    setDismissedIds((prev) => new Set(prev).add(current.alertId));
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className="sticky top-0 z-[90] overflow-hidden bg-red-600 text-white shadow-lg"
      >
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15">
            <AlertTriangle size={16} />
          </span>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold uppercase tracking-wide">
              Emergency{current.stationName ? ` · ${current.stationName}` : ""}
            </p>
            <p className="truncate text-sm text-white/90">{current.message}</p>
            {current.availableUntil && (
              <p className="text-xs text-white/75">
                Expected back by {new Date(current.availableUntil).toLocaleString()}
              </p>
            )}
          </div>

          {merged.length > 1 && (
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => setIndex((i) => (i - 1 + merged.length) % merged.length)}
                aria-label="Previous emergency"
                className="rounded-lg p-1.5 transition hover:bg-white/15"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs font-semibold text-white/80">
                {index + 1}/{merged.length}
              </span>
              <button
                type="button"
                onClick={() => setIndex((i) => (i + 1) % merged.length)}
                aria-label="Next emergency"
                className="rounded-lg p-1.5 transition hover:bg-white/15"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}

          <Link
            href="/alerts"
            className="shrink-0 rounded-lg border border-white/30 px-3 py-1.5 text-xs font-semibold transition hover:bg-white/15"
          >
            View details
          </Link>

          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss emergency banner"
            className="shrink-0 rounded-lg p-1.5 transition hover:bg-white/15"
          >
            <X size={16} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}