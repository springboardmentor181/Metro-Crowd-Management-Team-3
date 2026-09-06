"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, X } from "lucide-react";

import CrowdHeatMap from "@/components/dashboard/CrowdHeatMap";
import LiveTrainMap from "@/components/dashboard/LiveTrainMap";
import StationAnalyticsPanel from "@/components/dashboard/StationAnalyticsPanel";
import LiveStatusBadge from "@/components/dashboard/LiveStatusBadge";
import type { Station } from "@/lib/api/types";

interface Props {
  station: Station;
  onClose: () => void;
}

export default function StationLiveDetailModal({ station, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm sm:p-8"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.98 }}
          transition={{ duration: 0.2 }}
          className="my-4 w-full max-w-6xl overflow-hidden rounded-3xl border border-border bg-background shadow-2xl"
        >
          <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-border bg-card/95 px-6 py-5 backdrop-blur">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black">{station.station_name}</h2>
                {station.line_name && (
                  <span
                    className="rounded-full px-2.5 py-1 text-xs font-semibold"
                    style={{
                      background: `${station.line_color ?? "#3b82f6"}22`,
                      color: station.line_color ?? "#3b82f6",
                    }}
                  >
                    {station.line_name}
                  </span>
                )}
              </div>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
                <MapPin size={13} />
                {station.city} · Live station view - updates in real time
              </p>
            </div>

            <div className="flex items-center gap-3">
              <LiveStatusBadge />
              <button
                type="button"
                onClick={onClose}
                title="Close"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background text-muted transition hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="space-y-8 p-6">
            <StationAnalyticsPanel stationId={station.id} stationName={station.station_name} />
            <CrowdHeatMap />
            <LiveTrainMap />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}
