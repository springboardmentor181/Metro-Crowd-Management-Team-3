// src/components/dashboard/CrowdHeatMap.tsx

"use client";

import { useState } from "react";
import {
  Users,
  Activity,
  AlertTriangle,
  Info,
} from "lucide-react";

interface HeatPoint {
  id: number;
  station: string;
  x: number;
  y: number;
  occupancy: number;
  passengers: number;
}

const stations: HeatPoint[] = [
  {
    id: 1,
    station: "Rajiv Chowk",
    x: 48,
    y: 26,
    occupancy: 96,
    passengers: 18250,
  },
  {
    id: 2,
    station: "Kashmere Gate",
    x: 62,
    y: 14,
    occupancy: 84,
    passengers: 13620,
  },
  {
    id: 3,
    station: "Central Secretariat",
    x: 61,
    y: 41,
    occupancy: 68,
    passengers: 9420,
  },
  {
    id: 4,
    station: "Noida Sector 18",
    x: 82,
    y: 71,
    occupancy: 58,
    passengers: 7210,
  },
  {
    id: 5,
    station: "Dwarka",
    x: 12,
    y: 82,
    occupancy: 34,
    passengers: 4120,
  },
  {
    id: 6,
    station: "Botanical Garden",
    x: 92,
    y: 82,
    occupancy: 74,
    passengers: 10510,
  },
];

function getColor(value: number) {
  if (value >= 90) return "#ef4444";
  if (value >= 70) return "#f97316";
  if (value >= 50) return "#facc15";
  return "#10b981";
}

function getSize(value: number) {
  return value / 4 + 16;
}

export default function CrowdHeatMap() {
  const [selected, setSelected] =
    useState<HeatPoint | null>(stations[0]);

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

            <svg
              className="absolute inset-0 h-full w-full"
            >
              <line
                x1="12%"
                y1="82%"
                x2="48%"
                y2="26%"
                stroke="#2563eb"
                strokeWidth="6"
              />

              <line
                x1="48%"
                y1="26%"
                x2="61%"
                y2="41%"
                stroke="#2563eb"
                strokeWidth="6"
              />

              <line
                x1="61%"
                y1="41%"
                x2="82%"
                y2="71%"
                stroke="#2563eb"
                strokeWidth="6"
              />

              <line
                x1="48%"
                y1="26%"
                x2="62%"
                y2="14%"
                stroke="#2563eb"
                strokeWidth="6"
              />

              <line
                x1="82%"
                y1="71%"
                x2="92%"
                y2="82%"
                stroke="#2563eb"
                strokeWidth="6"
              />
            </svg>

            {stations.map((station) => (
              <button
                key={station.id}
                onClick={() => setSelected(station)}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: `${station.x}%`,
                  top: `${station.y}%`,
                }}
              >
                <div
                  className="absolute rounded-full blur-xl opacity-50"
                  style={{
                    width: getSize(station.occupancy) * 2,
                    height: getSize(station.occupancy) * 2,
                    background: getColor(
                      station.occupancy
                    ),
                    transform:
                      "translate(-50%,-50%)",
                    left: "50%",
                    top: "50%",
                  }}
                />

                <div
                  className="relative rounded-full border-4 border-white transition hover:scale-125"
                  style={{
                    width: getSize(
                      station.occupancy
                    ),
                    height: getSize(
                      station.occupancy
                    ),
                    background: getColor(
                      station.occupancy
                    ),
                  }}
                />

                <p className="mt-3 whitespace-nowrap text-xs font-semibold text-white">
                  {station.station}
                </p>
              </button>
            ))}
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
                    value={selected.station}
                  />

                  <InfoRow
                    icon={<Users size={18} />}
                    label="Passengers"
                    value={selected.passengers.toLocaleString()}
                  />

                  <InfoRow
                    icon={<Activity size={18} />}
                    label="Occupancy"
                    value={`${selected.occupancy}%`}
                  />

                </div>

                <div className="mt-8">

                  <div className="mb-3 flex justify-between">

                    <span>Capacity</span>

                    <strong>
                      {selected.occupancy}%
                    </strong>

                  </div>

                  <div className="h-3 overflow-hidden rounded-full bg-border">

                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${selected.occupancy}%`,
                        background: getColor(
                          selected.occupancy
                        ),
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
                        Increase train frequency if
                        occupancy exceeds 85%.
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
                AI updates the heatmap every 30
                seconds.
              </p>

            </div>

          </div>

        </div>

      </div>

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