// src/components/dashboard/MetroMap.tsx

"use client";

import { useState } from "react";
import {
  TrainFront,
  Users,
  TriangleAlert,
} from "lucide-react";

interface Station {
  id: number;
  name: string;
  x: number;
  y: number;
  crowd: number;
  status: "Normal" | "Busy" | "Crowded";
}

const stations: Station[] = [
  {
    id: 1,
    name: "Dwarka",
    x: 8,
    y: 80,
    crowd: 38,
    status: "Normal",
  },
  {
    id: 2,
    name: "Rajouri Garden",
    x: 22,
    y: 65,
    crowd: 58,
    status: "Busy",
  },
  {
    id: 3,
    name: "Karol Bagh",
    x: 37,
    y: 48,
    crowd: 72,
    status: "Busy",
  },
  {
    id: 4,
    name: "Rajiv Chowk",
    x: 50,
    y: 30,
    crowd: 95,
    status: "Crowded",
  },
  {
    id: 5,
    name: "Central Secretariat",
    x: 65,
    y: 48,
    crowd: 74,
    status: "Busy",
  },
  {
    id: 6,
    name: "Noida Sector 18",
    x: 82,
    y: 70,
    crowd: 61,
    status: "Normal",
  },
];

export default function MetroMap() {
  const [selected, setSelected] = useState<Station | null>(null);

  return (
    <section className="rounded-3xl border border-border bg-card p-8">

      <div className="mb-8 flex items-center justify-between">

        <div>

          <h2 className="text-2xl font-bold">
            Metro Network
          </h2>

          <p className="mt-2 text-muted">
            Click on any station
          </p>

        </div>

        <div className="flex gap-4 text-sm">

          <Legend color="bg-green-500" title="Normal" />

          <Legend color="bg-orange-500" title="Busy" />

          <Legend color="bg-red-500" title="Crowded" />

        </div>

      </div>

      <div className="grid gap-8 xl:grid-cols-3">

        <div className="xl:col-span-2">

          <div
            className="
            relative
            h-[550px]
            rounded-3xl
            border
            border-border
            bg-gradient-to-br
            from-slate-950
            to-slate-900
            "
          >

            <svg
              className="absolute inset-0 h-full w-full"
            >
              <line
                x1="8%"
                y1="80%"
                x2="82%"
                y2="70%"
                stroke="#2563EB"
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
                  className={`
                  flex
                  h-7
                  w-7
                  items-center
                  justify-center
                  rounded-full
                  border-4
                  border-white
                  shadow-xl
                  transition
                  hover:scale-125

                  ${
                    station.status === "Crowded"
                      ? "bg-red-500"
                      : station.status === "Busy"
                      ? "bg-orange-500"
                      : "bg-green-500"
                  }
                  `}
                />

                <p
                  className="
                  mt-2
                  whitespace-nowrap
                  text-xs
                  font-semibold
                  text-white
                  "
                >
                  {station.name}
                </p>

              </button>

            ))}

          </div>

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

                <h3 className="text-2xl font-bold">

                  {selected.name}

                </h3>

                <div className="mt-8 space-y-6">

                  <Info
                    icon={<Users size={20} />}
                    title="Crowd"
                    value={`${selected.crowd}%`}
                  />

                  <Info
                    icon={<TrainFront size={20} />}
                    title="Train"
                    value="Running"
                  />

                  <Info
                    icon={<TriangleAlert size={20} />}
                    title="Status"
                    value={selected.status}
                  />

                </div>

                <div
                  className="
                  mt-8
                  h-3
                  overflow-hidden
                  rounded-full
                  bg-border
                  "
                >

                  <div
                    className={`
                    h-full
                    ${
                      selected.status === "Crowded"
                        ? "bg-red-500"
                        : selected.status === "Busy"
                        ? "bg-orange-500"
                        : "bg-green-500"
                    }
                    `}
                    style={{
                      width: `${selected.crowd}%`,
                    }}
                  />

                </div>

              </>

            ) : (

              <div className="flex h-[350px] items-center justify-center">

                <p className="text-muted">
                  Select a station
                </p>

              </div>

            )}

          </div>

        </div>

      </div>

    </section>
  );
}

function Legend({

color,

title,

}:{

color:string;

title:string;

}){

return(

<div className="flex items-center gap-2">

<div className={`h-3 w-3 rounded-full ${color}`} />

<span>{title}</span>

</div>

);

}

function Info({

icon,

title,

value,

}:{

icon:React.ReactNode;

title:string;

value:string;

}){

return(

<div className="flex items-center justify-between">

<div className="flex items-center gap-3">

{icon}

<span>{title}</span>

</div>

<strong>{value}</strong>

</div>

);

}