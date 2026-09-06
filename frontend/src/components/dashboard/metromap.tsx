"use client";

import { useMemo, useState } from "react";
import {
  TrainFront,
  Users,
  TriangleAlert,
} from "lucide-react";

import { useApiData } from "@/hooks/useApiData";
import { useLiveSocket } from "@/hooks/useLiveSocket";
import { useLiveSocketContext } from "@/providers/LiveSocketProvider";
import { useStations } from "@/hooks/useStations";
import { getCrowdDashboard } from "@/lib/api/crowd";
import { queryKeys } from "@/lib/queryKeys";
import type { CrowdLevel, Station } from "@/lib/api/types";

type PositionedStation = Station & {
  x: number;
  y: number;
  current_count: number;
  crowd_level: CrowdLevel | "unknown";
};

const CROWD_COLOR: Record<string, string> = {
  low: "bg-green-500",
  moderate: "bg-orange-500",
  high: "bg-red-500",
  critical: "bg-red-500",
  unknown: "bg-slate-400",
};

const CROWD_LABEL: Record<string, string> = {
  low: "Normal",
  moderate: "Busy",
  high: "Crowded",
  critical: "Critical",
  unknown: "No data",
};

const FALLBACK_PALETTE = [
  "#3b82f6",
  "#f97316",
  "#22c55e",
  "#a855f7",
  "#ef4444",
  "#06b6d4",
];

function projectToPercent(points: { latitude: number; longitude: number }[]) {
  const lats = points.map((p) => p.latitude);
  const lngs = points.map((p) => p.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const latSpan = maxLat - minLat || 1;
  const lngSpan = maxLng - minLng || 1;

  return (lat: number, lng: number) => ({
    x: 8 + ((lng - minLng) / lngSpan) * 84,
    y: 8 + (1 - (lat - minLat) / latSpan) * 84,
  });
}

function shortLineName(fullName: string, city: string | null): string {
  const prefix = city ? `${city} Metro - ` : null;
  return prefix && fullName.startsWith(prefix) ? fullName.slice(prefix.length) : fullName;
}

export default function MetroMap() {
  const { data: allStations, loading: stationsLoading } = useStations();
  const [city, setCity] = useState<string | null>(null);

  const cities = useMemo(() => {
    const set = new Set((allStations ?? []).map((s) => s.city));
    return Array.from(set).sort();
  }, [allStations]);

  const activeCity = city ?? cities[0] ?? null;
  const { isConnected } = useLiveSocketContext();

  const { data: crowdList } = useApiData(
    queryKeys.crowdDashboard,
    (signal) => getCrowdDashboard(activeCity ?? undefined, signal),
    [activeCity],
    isConnected ? 0 : 30000,
  );

  const [liveById, setLiveById] = useState<
    Record<number, { current_count: number; crowd_level: CrowdLevel }>
  >({});

  useLiveSocket({
    crowd_update: (payload) => {
      
      setLiveById((prev) => {
        let changed = false;
        const next = { ...prev };
        for (const u of payload.updates) {
          const existing = prev[u.station_id];
          if (
            existing &&
            existing.current_count === u.current_count &&
            existing.crowd_level === u.crowd_level
          ) {
            continue;
          }
          changed = true;
          next[u.station_id] = {
            current_count: u.current_count,
            crowd_level: u.crowd_level as CrowdLevel,
          };
        }
        return changed ? next : prev;
      });
    },
  });

  const { lines, stationCount } = useMemo(() => {
    const inCity = (allStations ?? []).filter((s) => s.city === activeCity);
    const project = projectToPercent(
      inCity.length ? inCity : [{ latitude: 0, longitude: 0 }],
    );
    const crowdById = new Map((crowdList ?? []).map((c) => [c.station_id, c]));

    const positioned: PositionedStation[] = inCity.map((s) => {
      const live = liveById[s.id];
      const base = crowdById.get(s.id);
      const current_count = live?.current_count ?? base?.current_count ?? 0;
      const crowd_level = live?.crowd_level ?? base?.crowd_level ?? "unknown";
      const { x, y } = project(s.latitude, s.longitude);
      return { ...s, x, y, current_count, crowd_level };
    });

    const byLine = new Map<string, PositionedStation[]>();
    positioned.forEach((s) => {
      const key = s.line_name ?? "Unassigned";
      if (!byLine.has(key)) byLine.set(key, []);
      byLine.get(key)!.push(s);
    });

    const lineList = Array.from(byLine.entries()).map(([name, stations], i) => ({
      name,
      color: stations[0]?.line_color ?? FALLBACK_PALETTE[i % FALLBACK_PALETTE.length],
      stations: [...stations].sort((a, b) => (a.station_order ?? 0) - (b.station_order ?? 0)),
    }));

    return { lines: lineList, stationCount: positioned.length };
  }, [allStations, activeCity, crowdList, liveById]);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const selected = lines
    .flatMap((l) => l.stations)
    .find((s) => s.id === selectedId);

  return (
    <section className="rounded-3xl border border-border bg-card p-8">

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">

        <div>

          <h2 className="text-2xl font-bold">
            Metro Network
          </h2>

          <p className="mt-2 text-muted">
            {activeCity ? `${activeCity} - ${stationCount} stations across ${lines.length} line${lines.length === 1 ? "" : "s"}` : "Select a city"}
          </p>

        </div>

        {cities.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {cities.map((c) => (
              <button
                key={c}
                onClick={() => {
                  setCity(c);
                  setSelectedId(null);
                }}
                className={`
                rounded-full
                px-4
                py-1.5
                text-sm
                font-semibold
                transition
                ${
                  c === activeCity
                    ? "bg-primary text-white"
                    : "bg-background text-muted hover:text-foreground"
                }
                `}
              >
                {c}
              </button>
            ))}
          </div>
        )}

      </div>

      {lines.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-x-6 gap-y-2 border-b border-border pb-4 text-sm">
          {lines.map((l) => (
            <div key={l.name} className="flex items-center gap-2">
              <span
                className="h-1 w-6 rounded-full"
                style={{ backgroundColor: l.color }}
              />
              <span className="font-medium">{shortLineName(l.name, activeCity)}</span>
              <span className="text-muted">({l.stations.length})</span>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-8 xl:grid-cols-3">

        <div className="xl:col-span-2">

          <div
            className="
            relative
            h-[550px]
            overflow-hidden
            rounded-3xl
            border
            border-border
            bg-gradient-to-br
            from-slate-950
            to-slate-900
            "
          >

            {stationsLoading && (
              <p className="absolute inset-0 flex items-center justify-center text-muted">
                Loading stations...
              </p>
            )}

            {!stationsLoading && stationCount === 0 && (
              <p className="absolute inset-0 flex items-center justify-center text-muted">
                No stations for this city.
              </p>
            )}

            <svg
              className="pointer-events-none absolute inset-0 h-full w-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              {lines.map((l) => (
                <polyline
                  key={l.name}
                  points={l.stations.map((s) => `${s.x},${s.y}`).join(" ")}
                  fill="none"
                  stroke={l.color}
                  strokeWidth={0.6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={0.85}
                />
              ))}
            </svg>

            {lines.map((l) =>
              l.stations.map((station) => (
                <button
                  key={station.id}
                  title={`${station.station_name} (${shortLineName(l.name, activeCity)})`}
                  onClick={() => setSelectedId(station.id)}
                  className="group absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${station.x}%`, top: `${station.y}%` }}
                >

                  <div
                    className={`
                    h-3
                    w-3
                    rounded-full
                    border-2
                    shadow
                    transition
                    group-hover:scale-150

                    ${station.id === selectedId ? "scale-150 border-white" : "border-slate-900"}
                    `}
                    style={{ backgroundColor: l.color }}
                  />

                  {station.id === selectedId && (
                    <p
                      className="
                      absolute
                      left-1/2
                      top-4
                      -translate-x-1/2
                      whitespace-nowrap
                      rounded-md
                      bg-slate-900
                      px-2
                      py-0.5
                      text-xs
                      font-semibold
                      text-white
                      shadow
                      "
                    >
                      {station.station_name}
                    </p>
                  )}

                </button>
              )),
            )}

          </div>

          <p className="mt-3 text-xs text-muted">
            Hover a dot to see its name, click for full details. Line colour = real line; dot colour matches its line, ring = crowd status.
          </p>

        </div>

        <div>

          <div
            className="
            rounded-3xl
            border
            border-border
            bg-background
            p-6
            "
          >

            {selected ? (

              <>

                <div className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{
                      backgroundColor: lines.find((l) => l.stations.some((s) => s.id === selected.id))?.color,
                    }}
                  />
                  <span className="text-sm font-medium text-muted">
                    {selected.line_name ? shortLineName(selected.line_name, activeCity) : "No line assigned"}
                  </span>
                </div>

                <h3 className="mt-1 text-2xl font-bold">
                  {selected.station_name}
                </h3>

                <div className="mt-8 space-y-6">

                  <Info
                    icon={<Users size={20} />}
                    title="Occupancy"
                    value={
                      selected.capacity > 0
                        ? `${Math.round((selected.current_count / selected.capacity) * 100)}%`
                        : "—"
                    }
                  />

                  <Info
                    icon={<TrainFront size={20} />}
                    title="Passengers"
                    value={`${selected.current_count}`}
                  />

                  <Info
                    icon={<TriangleAlert size={20} />}
                    title="Status"
                    value={CROWD_LABEL[selected.crowd_level] ?? "No data"}
                  />

                </div>

                <div className="mt-8 h-3 overflow-hidden rounded-full bg-border">
                  <div
                    className={`h-full ${CROWD_COLOR[selected.crowd_level] ?? CROWD_COLOR.unknown}`}
                    style={{
                      width: `${
                        selected.capacity > 0
                          ? Math.min(100, Math.round((selected.current_count / selected.capacity) * 100))
                          : 0
                      }%`,
                    }}
                  />
                </div>

              </>

            ) : (

              <div className="flex h-[350px] items-center justify-center">
                <p className="text-muted">
                  Select a station to see its details
                </p>
              </div>

            )}

          </div>

        </div>

      </div>

    </section>
  );
}

function Info({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        {icon}
        <span>{title}</span>
      </div>
      <strong>{value}</strong>
    </div>
  );
}
