"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Circle, TrainFront, X } from "lucide-react";
import { List, type RowComponentProps } from "react-window";

import { useApiData } from "@/hooks/useApiData";
import { useLiveSocket } from "@/hooks/useLiveSocket";
import { useLiveSocketContext } from "@/providers/LiveSocketProvider";
import { useContainerWidth } from "@/hooks/useContainerWidth";
import { getLiveTrainPositions } from "@/lib/api/trains";
import { useSelectedState } from "@/providers/StateProvider";
import { useFocusedStation } from "@/providers/FocusedStationProvider";
import { queryKeys } from "@/lib/queryKeys";
import LiveStatusBadge from "@/components/dashboard/LiveStatusBadge";
import TrainLiveDetailModal from "@/components/dashboard/TrainLiveDetailModal";
import type { LiveTrainPosition } from "@/lib/api/types";

interface Props {
  onClose: () => void;
}

const CARD_ROW_HEIGHT = 190;
const CARD_MIN_WIDTH = 300;
const MAX_LIST_HEIGHT = 560;
const DEFAULT_VISIBLE_TRAINS = 6;

const TrainCard = memo(function TrainCard({ train, onSelect }: { train: LiveTrainPosition; onSelect: (t: LiveTrainPosition) => void }) {
  const isDelayed = train.status === "Delayed" || train.delay_minutes > 0;
  return (
    <button
      type="button"
      onClick={() => onSelect(train)}
      className="
      group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border
      bg-card p-5 text-left transition-all duration-200
      hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl
      "
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="rounded-xl bg-primary/10 p-2.5">
            <TrainFront className="text-primary" size={18} />
          </div>
          <h3 className="font-bold">{train.train_number}</h3>
        </div>
        <span
          className={`flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold ${
            isDelayed
              ? "bg-orange-500/10 text-orange-500"
              : "bg-emerald-500/10 text-emerald-500"
          }`}
        >
          <Circle size={7} className="fill-current" />
          {train.status}
        </span>
      </div>

      <p className="mt-4 truncate text-sm text-muted">
        {train.from_station_name ?? "Unknown"} → {train.to_station_name ?? "Unknown"}
      </p>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full bg-primary transition-all duration-700"
          style={{ width: `${Math.round(train.progress_ratio * 100)}%` }}
        />
      </div>

      <div className="mt-3 flex items-center justify-between text-xs">
        <span className="text-muted">
          {Math.round(train.progress_ratio * 100)}% en route
        </span>
        <span className={isDelayed ? "font-semibold text-orange-500" : "text-muted"}>
          {train.delay_minutes > 0 ? `${train.delay_minutes} min delay` : "On time"}
        </span>
      </div>
    </button>
  );
});

type GridRowProps = RowComponentProps<{
  chunks: LiveTrainPosition[][];
  columns: number;
  onSelect: (t: LiveTrainPosition) => void;
}>;

const GridRowContent = memo(function GridRowContent({
  index,
  style,
  chunks,
  columns,
  onSelect,
}: GridRowProps) {
  const rowTrains = chunks[index];
  return (
    <div
      style={{ ...style, gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      className="grid gap-4 pb-4"
    >
      {rowTrains.map((train) => (
        <TrainCard key={train.train_id} train={train} onSelect={onSelect} />
      ))}
    </div>
  );
});

function GridRow(props: GridRowProps) {
  return <GridRowContent {...props} />;
}

export default function LiveTrainsListModal({ onClose }: Props) {
  const { selectedState } = useSelectedState();
  const { setFocusedStation, setLiveLocationOn } = useFocusedStation();
  const { isConnected } = useLiveSocketContext();

  const initial = useApiData(
    queryKeys.liveTrainPositions,
    (signal) => getLiveTrainPositions(selectedState ?? undefined, signal),
    [selectedState],
    isConnected ? 0 : 30000,
  );

  const [liveById, setLiveById] = useState<Record<number, LiveTrainPosition>>({});

  // The /ws/monitor socket is a single global channel - it broadcasts
  // train_position updates for EVERY train in EVERY city, not just the
  // one currently selected. Without this guard, the first socket push
  // after opening the modal merges all nationwide trains into liveById,
  // even though `initial.data` (and the KPI card) are correctly scoped
  // to `selectedState`. Track which train ids actually belong to the
  // current filter and drop anything else before it ever reaches state.
  const validTrainIdsRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    const validIds = new Set((initial.data ?? []).map((p) => p.train_id));
    validTrainIdsRef.current = validIds;
    setLiveById((prev) => {
      let changed = false;
      const next: Record<number, LiveTrainPosition> = {};
      for (const [idStr, pos] of Object.entries(prev)) {
        if (validIds.has(Number(idStr))) {
          next[Number(idStr)] = pos;
        } else {
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [initial.data]);

  useLiveSocket({
    train_position: (payload) => {
      
      setLiveById((prev) => {
        let changed = false;
        const next = { ...prev };
        for (const u of payload.updates) {
          if (!validTrainIdsRef.current.has(u.train_id)) continue;
          const existing = prev[u.train_id];
          if (
            existing &&
            existing.progress_ratio === u.progress_ratio &&
            existing.status === u.status &&
            existing.delay_minutes === u.delay_minutes &&
            existing.eta_seconds === u.eta_seconds &&
            existing.from_station_id === u.from_station_id &&
            existing.to_station_id === u.to_station_id
          ) {
            continue;
          }
          changed = true;
          next[u.train_id] = {
            train_id: u.train_id,
            train_number: u.train_number,
            from_station_id: u.from_station_id,
            from_station_name: u.from_station_name,
            to_station_id: u.to_station_id,
            to_station_name: u.to_station_name,
            progress_ratio: u.progress_ratio,
            delay_minutes: u.delay_minutes,
            status: u.status,
            eta_seconds: u.eta_seconds,
            segment_duration_seconds: u.segment_duration_seconds,
            direction: u.direction,
          };
        }
        return changed ? next : prev;
      });
    },
  });

  const trains = useMemo(() => {
    const byId = new Map<number, LiveTrainPosition>();
    for (const p of initial.data ?? []) byId.set(p.train_id, p);
    for (const p of Object.values(liveById)) byId.set(p.train_id, p);
    return Array.from(byId.values()).sort((a, b) => a.train_number.localeCompare(b.train_number));
  }, [initial.data, liveById]);

  const [selectedTrain, setSelectedTrain] = useState<LiveTrainPosition | null>(null);
  const { ref: gridRef, width: gridWidth } = useContainerWidth<HTMLDivElement>();

  const columns = gridWidth > 0 ? Math.max(1, Math.min(3, Math.floor(gridWidth / CARD_MIN_WIDTH))) : 3;

  // Active Trains expand/collapse: show a handful by default, let the user
  // reveal the rest on demand instead of dumping every train at once.
  const [expanded, setExpanded] = useState(false);
  const canExpand = trains.length > DEFAULT_VISIBLE_TRAINS;

  useEffect(() => {
    if (!canExpand && expanded) setExpanded(false);
  }, [canExpand, expanded]);

  const toggleExpanded = useCallback(() => setExpanded((prev) => !prev), []);

  const visibleTrains = useMemo(
    () => (expanded ? trains : trains.slice(0, DEFAULT_VISIBLE_TRAINS)),
    [trains, expanded],
  );

  const chunks = useMemo(() => {
    const out: LiveTrainPosition[][] = [];
    for (let i = 0; i < visibleTrains.length; i += columns) {
      out.push(visibleTrains.slice(i, i + columns));
    }
    return out;
  }, [visibleTrains, columns]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !selectedTrain) onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose, selectedTrain]);

  function closeAll() {
    setSelectedTrain(null);
    setFocusedStation(null);
    onClose();
  }

  function closeTrainDetail() {
    setSelectedTrain(null);
    setFocusedStation(null);
    setLiveLocationOn(false);
  }

  if (typeof document === "undefined") return null;

  return createPortal(
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm sm:p-8"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeAll();
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="my-4 w-full max-w-5xl overflow-hidden rounded-3xl border border-border bg-background shadow-2xl"
          >
            <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-border bg-card/95 px-6 py-5 backdrop-blur">
              <div>
                <h2 className="text-2xl font-black">Active Trains</h2>
                <p className="mt-1 text-sm text-muted">
                  {trains.length} train{trains.length === 1 ? "" : "s"} running right now - tap one for
                  its full live view.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <LiveStatusBadge />
                {canExpand && !expanded && (
                  <button
                    type="button"
                    onClick={toggleExpanded}
                    className="flex items-center gap-1.5 whitespace-nowrap rounded-xl border border-primary/30 bg-primary/10 px-3.5 py-2 text-xs font-semibold text-primary transition-all duration-200 hover:bg-primary/20 sm:text-sm"
                  >
                    View All Active Trains
                    <ChevronDown size={14} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={closeAll}
                  title="Close"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-muted transition hover:text-foreground"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="p-6">
              {initial.loading ? (
                <p className="text-sm text-muted">Loading active trains...</p>
              ) : trains.length === 0 ? (
                <p className="text-sm text-muted">No active trains right now.</p>
              ) : (
                <>
                  {canExpand && (
                    <p className="mb-4 text-xs text-muted">
                      Showing {visibleTrains.length} of {trains.length} trains.
                    </p>
                  )}

                  <div ref={gridRef}>
                    <List
                      rowComponent={GridRow}
                      rowCount={chunks.length}
                      rowHeight={CARD_ROW_HEIGHT}
                      rowProps={{ chunks, columns, onSelect: setSelectedTrain }}
                      rowKey={(index, { chunks: c }) => c[index].map((t) => t.train_id).join("-")}
                      style={{ height: Math.min(chunks.length * CARD_ROW_HEIGHT, MAX_LIST_HEIGHT) }}
                      overscanCount={4}
                    />
                  </div>

                  {canExpand && expanded && (
                    <div className="mt-6 flex justify-center">
                      <button
                        type="button"
                        onClick={toggleExpanded}
                        className="flex items-center gap-1.5 rounded-xl border border-border bg-background px-5 py-2.5 text-sm font-semibold text-foreground transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary hover:shadow-lg"
                      >
                        <ChevronUp size={16} />
                        Show Less
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {selectedTrain && (
        <TrainLiveDetailModal train={selectedTrain} onClose={closeTrainDetail} />
      )}
    </>,
    document.body,
  );
}