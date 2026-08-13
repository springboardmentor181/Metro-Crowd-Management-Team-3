// src/components/dashboard/CrowdHeatMap.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Users,
  Activity,
  AlertTriangle,
  Info,
} from "lucide-react";

import { useApiData } from "@/hooks/useApiData";
import { getCrowdHeatmap } from "@/lib/api/crowd";
import { getRecommendations } from "@/lib/api/predictions";
import { useSelectedState } from "@/providers/StateProvider";
import type { CrowdHeatmapPoint, SmartRecommendation } from "@/lib/api/types";

function getColor(value: number) {
  if (value >= 90) return "#ef4444";
  if (value >= 70) return "#f97316";
  if (value >= 50) return "#facc15";
  return "#10b981";
}

function getSize(value: number) {
  return value / 4 + 16;
}

function projectPositions(points: CrowdHeatmapPoint[]) {
  if (points.length === 0) return [];

  const lats = points.map((p) => p.latitude);
  const lngs = points.map((p) => p.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const latRange = maxLat - minLat || 1;
  const lngRange = maxLng - minLng || 1;

  return points.map((point) => ({
    ...point,
    x: ((point.longitude - minLng) / lngRange) * 80 + 10,
    // Higher latitude should render further up the screen.
    y: ((maxLat - point.latitude) / latRange) * 80 + 10,
  }));
}

export default function CrowdHeatMap({
  onSelectStation,
}: {
  onSelectStation?: (station: { id: number; name: string } | null) => void;
} = {}) {
  const { selectedState } = useSelectedState();
  const { data, loading, error } = useApiData(
    () => getCrowdHeatmap(selectedState ?? undefined),
    [selectedState],
  );
  const positioned = useMemo(() => projectPositions(data ?? []), [data]);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [recommendations, setRecommendations] = useState<SmartRecommendation[]>([]);

  const effectiveSelectedId = selectedId ?? positioned[0]?.station_id ?? null;
  const selected = positioned.find((p) => p.station_id === effectiveSelectedId);

  useEffect(() => {
    onSelectStation?.(
      selected ? { id: selected.station_id, name: selected.station_name } : null,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.station_id]);

  useEffect(() => {
    if (!selected) return;
    getRecommendations(selected.station_id)
      .then(setRecommendations)
      .catch(() => setRecommendations([]));
  }, [selected]);

  return (
    <section className="rounded-3xl border border-border bg-card p-8">

      <div className="mb-8 flex items-center justify-between">

        <div>

          <h2 className="text-2xl font-bold">
            Crowd Heat Map
          </h2>

          <p className="mt-2 text-muted">
            Live passenger density across stations
          </p>

        </div>

        <div className="rounded-xl bg-primary/10 p-3">

          <Activity
            className="text-primary"
            size={28}
          />

        </div>

      </div>

      {error && (
        <p className="mb-6 rounded-xl bg-red-500/10 p-3 text-sm text-red-500">{error}</p>
      )}

      {loading ? (
        <p className="text-sm text-muted">Loading live crowd data...</p>
      ) : (data ?? []).length === 0 ? (
        <p className="text-sm text-muted">
          No crowd data for {selectedState ?? "this selection"} yet.
        </p>
      ) : (
      <div className="grid gap-8 xl:grid-cols-3">

        {/* Heat Map */}

        <div className="xl:col-span-2">

          <div
            className="
            relative
            h-[560px]
            overflow-hidden
            rounded-3xl
            border
            border-border
            bg-gradient-to-br
            from-slate-950
            via-slate-900
            to-black
            "
          >

            <svg className="absolute inset-0 h-full w-full">
              {positioned.slice(1).map((station, index) => {
                const prev = positioned[index];
                return (
                  <line
                    key={station.station_id}
                    x1={`${prev.x}%`}
                    y1={`${prev.y}%`}
                    x2={`${station.x}%`}
                    y2={`${station.y}%`}
                    stroke="#2563eb"
                    strokeWidth="6"
                  />
                );
              })}
            </svg>

            {positioned.map((station) => {
              const occupancy = station.occupancy_ratio * 100;
              return (
                <button
                  key={station.station_id}
                  onClick={() => setSelectedId(station.station_id)}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{
                    left: `${station.x}%`,
                    top: `${station.y}%`,
                  }}
                >
                  <div
                    className="absolute rounded-full blur-xl opacity-50"
                    style={{
                      width: getSize(occupancy) * 2,
                      height: getSize(occupancy) * 2,
                      background: getColor(occupancy),
                      transform: "translate(-50%,-50%)",
                      left: "50%",
                      top: "50%",
                    }}
                  />

                  <div
                    className="relative rounded-full border-4 border-white transition hover:scale-125"
                    style={{
                      width: getSize(occupancy),
                      height: getSize(occupancy),
                      background: getColor(occupancy),
                    }}
                  />

                  <p className="mt-3 whitespace-nowrap text-xs font-semibold text-white">
                    {station.station_name}
                  </p>
                </button>
              );
            })}
          </div>

        </div>

        {/* Details */}

        <div>

          <div className="rounded-3xl border border-border bg-background p-6">

            <h3 className="text-xl font-bold">
              Station Details
            </h3>

            {selected && (
              <>

                <div className="mt-8 space-y-5">

                  <InfoRow
                    icon={<Users size={18} />}
                    label="Station"
                    value={selected.station_name}
                  />

                  <InfoRow
                    icon={<Users size={18} />}
                    label="Passengers"
                    value={selected.current_count.toLocaleString()}
                  />

                  <InfoRow
                    icon={<Activity size={18} />}
                    label="Occupancy"
                    value={`${(selected.occupancy_ratio * 100).toFixed(0)}%`}
                  />

                </div>

                <div className="mt-8">

                  <div className="mb-3 flex justify-between">

                    <span>Capacity</span>

                    <strong>
                      {(selected.occupancy_ratio * 100).toFixed(0)}%
                    </strong>

                  </div>

                  <div className="h-3 overflow-hidden rounded-full bg-border">

                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${selected.occupancy_ratio * 100}%`,
                        background: getColor(selected.occupancy_ratio * 100),
                      }}
                    />

                  </div>

                </div>

                <div
                  className="
                  mt-8
                  rounded-2xl
                  border
                  border-orange-500/20
                  bg-orange-500/10
                  p-5
                  "
                >

                  <div className="flex gap-3">

                    <AlertTriangle
                      className="text-orange-500"
                      size={22}
                    />

                    <div>

                      <h4 className="font-semibold">
                        AI Recommendation
                      </h4>

                      <p className="mt-2 text-sm text-muted leading-7">
                        {recommendations[0]?.detail ??
                          "No anomalies detected for this station right now."}
                      </p>

                    </div>

                  </div>

                </div>

              </>
            )}

          </div>

          <div className="mt-6 rounded-3xl border border-border bg-background p-6">

            <h3 className="mb-6 font-bold">
              Legend
            </h3>

            <Legend color="#10b981" text="0 - 49%" />

            <Legend color="#facc15" text="50 - 69%" />

            <Legend color="#f97316" text="70 - 89%" />

            <Legend color="#ef4444" text="90% +" />

            <div className="mt-8 flex items-start gap-3 rounded-2xl bg-primary/5 p-4">

              <Info
                className="text-primary"
                size={18}
              />

              <p className="text-sm text-muted">
                Live data from MetroFlow&apos;s crowd monitoring API.
              </p>

            </div>

          </div>

        </div>

      </div>
      )}

    </section>
  );
}

function Legend({
  color,
  text,
}: {
  color: string;
  text: string;
}) {
  return (
    <div className="mb-4 flex items-center gap-3">

      <div
        className="h-4 w-4 rounded-full"
        style={{
          background: color,
        }}
      />

      <span>{text}</span>

    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between">

      <div className="flex items-center gap-3">

        {icon}

        <span>{label}</span>

      </div>

      <strong>{value}</strong>

    </div>
  );
}