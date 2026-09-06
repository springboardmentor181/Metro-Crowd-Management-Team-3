"use client";

import { useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Circle, Clock3, MapPin, X } from "lucide-react";

import { useStations } from "@/hooks/useStations";
import { useGetTrainRoutesQuery } from "@/store/apiSlice";
import CrowdHeatMap from "@/components/dashboard/CrowdHeatMap";
import LiveTrainMap from "@/components/dashboard/LiveTrainMap";
import StationAnalyticsPanel from "@/components/dashboard/StationAnalyticsPanel";
import LiveStatusBadge from "@/components/dashboard/LiveStatusBadge";
import { useFocusedStation } from "@/providers/FocusedStationProvider";
import { useSelectedState } from "@/providers/StateProvider";
import type { LiveTrainPosition } from "@/lib/api/types";

interface Props {
  train: LiveTrainPosition;
  onClose: () => void;
}

export default function TrainLiveDetailModal({ train, onClose }: Props) {
  const { data: stations } = useStations();
  const { setFocusedStation, setLiveLocationOn } = useFocusedStation();
  const { selectedState } = useSelectedState();

  const fromStation = useMemo(
    () => (stations ?? []).find((s) => s.id === train.from_station_id) ?? null,
    [stations, train.from_station_id],
  );
  const toStation = useMemo(
    () => (stations ?? []).find((s) => s.id === train.to_station_id) ?? null,
    [stations, train.to_station_id],
  );

  // Authoritative path for THIS train - the same station_ids the map/ETA
  // logic already relies on - rather than a single station's line_name,
  // which can go missing and silently widen the view to every station.
  const { data: routesData } = useGetTrainRoutesQuery(selectedState ?? undefined);
  const trainRouteStationIds = useMemo(
    () => routesData?.find((r) => r.train_id === train.train_id)?.station_ids ?? null,
    [routesData, train.train_id],
  );

  useEffect(() => {
    const anchor = fromStation ?? toStation;
    if (!anchor) return;
    setFocusedStation({
      id: anchor.id,
      name: anchor.station_name,
      city: anchor.city,
      latitude: anchor.latitude,
      longitude: anchor.longitude,
      line_name: anchor.line_name,
      line_color: anchor.line_color,
      station_order: anchor.station_order,
    });
    setLiveLocationOn(true);
    
  }, [fromStation?.id, toStation?.id]);

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

  const isDelayed = train.status === "Delayed" || train.delay_minutes > 0;

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[110] flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm sm:p-8"
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
                <h2 className="text-2xl font-black">{train.train_number}</h2>
                <span
                  className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                    isDelayed
                      ? "bg-orange-500/10 text-orange-500"
                      : "bg-emerald-500/10 text-emerald-500"
                  }`}
                >
                  <Circle size={8} className="fill-current" />
                  {train.status}
                </span>
                <span className="flex items-center gap-1.5 rounded-full bg-muted/20 px-2.5 py-1 text-xs font-semibold text-muted">
                  <Clock3 size={12} />
                  {train.delay_minutes > 0 ? `${train.delay_minutes} min delay` : "On time"}
                </span>
              </div>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
                <MapPin size={13} />
                {train.from_station_name ?? "Unknown"} → {train.to_station_name ?? "Unknown"} · Live train view
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
            <StationAnalyticsPanel
              stationId={toStation?.id ?? fromStation?.id ?? null}
              stationName={toStation?.station_name ?? fromStation?.station_name}
            />
            <CrowdHeatMap
              trainRouteStationIds={trainRouteStationIds}
              preferredStationId={toStation?.id ?? fromStation?.id ?? null}
            />
            <LiveTrainMap onlyTrainId={train.train_id} />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}