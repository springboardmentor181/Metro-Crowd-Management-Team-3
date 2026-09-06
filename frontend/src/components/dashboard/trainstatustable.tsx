"use client";

import { useMemo, useState } from "react";
import {
  Search,
  Circle,
  TrainFront,
  Filter,
} from "lucide-react";
import { List, type RowComponentProps } from "react-window";

import { useApiData } from "@/hooks/useApiData";
import { useLiveSocket } from "@/hooks/useLiveSocket";
import { useLiveSocketContext } from "@/providers/LiveSocketProvider";
import { useStations } from "@/hooks/useStations";
import { getSchedules } from "@/lib/api/schedules";
import { getTrains } from "@/lib/api/trains";
import { getCrowdDashboard } from "@/lib/api/crowd";
import { useSelectedState } from "@/providers/StateProvider";
import { queryKeys } from "@/lib/queryKeys";

const FALLBACK_POLL_MS = 30000;

interface TrainRow {
  id: number;
  trainNumber: string;
  station: string;
  occupancy: number;
  delay: number;
  status: "Running" | "Delayed" | "Maintenance";
}

const ROW_HEIGHT = 88;
const MAX_LIST_HEIGHT = 640;
const GRID_TEMPLATE_COLUMNS = "2fr 1.6fr 200px 120px 160px";

function TableRow({
  index,
  style,
  rows,
}: RowComponentProps<{ rows: TrainRow[] }>) {
  const train = rows[index];

  return (
    <div
      role="row"
      style={{ ...style, gridTemplateColumns: GRID_TEMPLATE_COLUMNS }}
      className="grid items-center border-b border-border transition hover:bg-muted/40"
    >
      <div role="cell" className="flex items-center gap-4 px-4 py-5">
        <div
          className="
          flex
          h-12
          w-12
          shrink-0
          items-center
          justify-center
          rounded-xl
          bg-primary/10
          "
        >
          <TrainFront
            className="text-primary"
            size={22}
          />
        </div>

        <div className="min-w-0">
          <h4 className="truncate font-semibold">
            {train.trainNumber}
          </h4>

          <p className="text-xs text-muted">
            Schedule #{train.id}
          </p>
        </div>
      </div>

      <div role="cell" className="truncate px-4 py-5 font-medium">
        {train.station}
      </div>

      <div role="cell" className="px-4 py-5">
        <div className="flex items-center gap-3">
          <div className="h-2 w-28 overflow-hidden rounded-full bg-border">
            <div
              className="h-full rounded-full bg-primary"
              style={{
                width: `${train.occupancy}%`,
              }}
            />
          </div>

          <span className="text-sm font-semibold">
            {train.occupancy}%
          </span>
        </div>
      </div>

      <div role="cell" className="px-4 py-5 text-center">
        {train.delay === 0 ? (
          <span className="font-semibold text-emerald-500">
            On Time
          </span>
        ) : (
          <span className="font-semibold text-orange-500">
            {train.delay} min
          </span>
        )}
      </div>

      <div role="cell" className="px-4 py-5">
        <div className="flex justify-center">
          <span
            className={`
            inline-flex
            items-center
            gap-2
            rounded-full
            px-4
            py-2
            text-sm
            font-semibold
            ${
              train.status === "Running"
                ? "bg-emerald-500/10 text-emerald-500"
                : train.status === "Delayed"
                ? "bg-orange-500/10 text-orange-500"
                : "bg-red-500/10 text-red-500"
            }
            `}
          >
            <Circle
              className="fill-current"
              size={8}
            />

            {train.status}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function TrainStatusTable() {
  const [search, setSearch] = useState("");
  const [delayFilter, setDelayFilter] = useState<"all" | "on_time" | "delayed">("all");
  const { selectedState } = useSelectedState();
  const { isConnected } = useLiveSocketContext();

  // schedules/crowd are pushed live over the socket (delay_alert /
  // train_position / crowd_update below) - polling on top of a
  // healthy socket was pure duplicate traffic for data already
  // arriving live, so the fixed interval now only runs while the
  // socket is down.
  const schedules = useApiData(
    queryKeys.schedules,
    (signal) => getSchedules({ state: selectedState ?? undefined }, signal),
    [selectedState],
    isConnected ? 0 : FALLBACK_POLL_MS,
  );
  // `trains` has no matching WS push, so it keeps polling regardless
  // of socket state - just at the 30s target cadence instead of 5s.
  const trains = useApiData(
    queryKeys.trains,
    (signal) => getTrains(selectedState ?? undefined, signal),
    [selectedState],
    FALLBACK_POLL_MS,
  );
  const crowd = useApiData(
    queryKeys.crowdDashboard,
    (signal) => getCrowdDashboard(selectedState ?? undefined, signal),
    [selectedState],
    isConnected ? 0 : FALLBACK_POLL_MS,
  );
  const { data: stations } = useStations();

  // Re-pull schedules/crowd the moment a delay is reported, a train
  // moves, or crowd counts change - table no longer sits frozen at
  // whatever it saw on first load.
  useLiveSocket({
    delay_alert: () => schedules.refresh(),
    train_position: () => schedules.refresh(),
    crowd_update: () => crowd.refresh(),
  });

  const loading = schedules.loading || trains.loading || crowd.loading;

  const rows = useMemo<TrainRow[]>(() => {
    const trainById = new Map((trains.data ?? []).map((t) => [t.id, t]));
    const stationById = new Map((stations ?? []).map((s) => [s.id, s]));
    const crowdByStation = new Map((crowd.data ?? []).map((c) => [c.station_id, c]));

    return (schedules.data ?? []).map((schedule) => {
      const train = trainById.get(schedule.train_id);
      const station = stationById.get(schedule.station_id);
      const occupancy = crowdByStation.get(schedule.station_id);

      const status =
        schedule.status === "delayed"
          ? "Delayed"
          : train?.status === "maintenance"
          ? "Maintenance"
          : "Running";

      return {
        id: schedule.id,
        trainNumber: train?.train_number ?? `Train #${schedule.train_id}`,
        station: station?.station_name ?? `Station #${schedule.station_id}`,
        occupancy: occupancy ? Math.round(occupancy.occupancy_ratio * 100) : 0,
        delay: schedule.delay_minutes,
        status: status as "Running" | "Delayed" | "Maintenance",
      };
    });
  }, [schedules.data, trains.data, stations, crowd.data]);

  const filtered = rows
    .filter((row) =>
      `${row.trainNumber} ${row.station}`.toLowerCase().includes(search.toLowerCase()),
    )
    .filter((row) => {
      if (delayFilter === "on_time") return row.delay === 0;
      if (delayFilter === "delayed") return row.delay > 0;
      return true;
    });

  const listHeight = Math.min(filtered.length * ROW_HEIGHT, MAX_LIST_HEIGHT) || ROW_HEIGHT;

  return (
    <section className="rounded-3xl border border-border bg-card p-8">

      <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

        <div>

          <h2 className="text-2xl font-bold">
            Live Train Status
          </h2>

          <p className="mt-2 text-muted">
            Scheduled trains and current occupancy
          </p>

        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">

          <div className="flex items-center gap-2 rounded-xl border border-border p-1">

            <Filter size={14} className="ml-2 shrink-0 text-muted" />

            {(
              [
                { key: "all", label: "All" },
                { key: "on_time", label: "On Time" },
                { key: "delayed", label: "Delayed" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setDelayFilter(opt.key)}
                className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                  delayFilter === opt.key
                    ? "bg-primary text-white"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}

          </div>

          <div className="relative w-full lg:w-96">

            <Search
              size={18}
              className="absolute left-4 top-3.5 text-muted"
            />

            <input
              placeholder="Search train or station..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="
              h-12
              w-full
              rounded-xl
              border
              border-border
              bg-background
              pl-11
              pr-4
              outline-none
              focus:border-primary
              "
            />

          </div>

        </div>

      </div>

      {loading ? (
        <p className="text-sm text-muted">Loading train status...</p>
      ) : (
      <div className="overflow-x-auto">

        <div style={{ minWidth: 640 }} role="table" aria-label="Live train status">

          <div
            role="row"
            style={{ gridTemplateColumns: GRID_TEMPLATE_COLUMNS }}
            className="grid border-b border-border"
          >
            <div role="columnheader" className="px-4 py-4 text-left font-semibold">
              Train
            </div>
            <div role="columnheader" className="px-4 py-4 text-left font-semibold">
              Station
            </div>
            <div role="columnheader" className="px-4 py-4 text-center font-semibold">
              Occupancy
            </div>
            <div role="columnheader" className="px-4 py-4 text-center font-semibold">
              Delay
            </div>
            <div role="columnheader" className="px-4 py-4 text-center font-semibold">
              Status
            </div>
          </div>

          {filtered.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted">
              {search
                ? "No trains match your search."
                : delayFilter === "on_time"
                  ? "No on-time trains right now."
                  : delayFilter === "delayed"
                    ? "No delayed trains right now."
                    : "No trains found."}
            </p>
          ) : (
            <List
              rowComponent={TableRow}
              rowCount={filtered.length}
              rowHeight={ROW_HEIGHT}
              rowProps={{ rows: filtered }}
              rowKey={(index, { rows: r }) => r[index].id}
              style={{ height: listHeight }}
              overscanCount={6}
            />
          )}

        </div>

      </div>
      )}

    </section>
  );
}