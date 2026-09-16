"use client";

import { motion } from "framer-motion";
import {
  TrainFront,
  ArrowRight,
  MapPinned,
} from "lucide-react";
import Link from "next/link";

const metroLines = [
  {
    name: "Blue Line",
    city: "Delhi Metro",
    stations: 58,
    passengers: "820K",
    color: "from-blue-600 to-cyan-500",
  },
  {
    name: "Yellow Line",
    city: "Delhi Metro",
    stations: 49,
    passengers: "690K",
    color: "from-yellow-400 to-orange-500",
  },
  {
    name: "Purple Line",
    city: "Bengaluru Metro",
    stations: 37,
    passengers: "410K",
    color: "from-violet-500 to-fuchsia-500",
  },
  {
    name: "Green Line",
    city: "Mumbai Metro",
    stations: 34,
    passengers: "360K",
    color: "from-green-500 to-emerald-500",
  },
  {
    name: "Red Line",
    city: "Kolkata Metro",
    stations: 31,
    passengers: "280K",
    color: "from-red-500 to-rose-500",
  },
  {
    name: "Aqua Line",
    city: "Noida Metro",
    stations: 21,
    passengers: "170K",
    color: "from-cyan-500 to-sky-500",
  },
];

export default function MetroLines() {
  return (
    <section className="section bg-muted/20">

      <div className="container">

        <div className="mb-16 text-center">

          <span className="badge">

            Connected Networks

          </span>

          <h2 className="heading mt-6">

            Smart Metro Coverage Across India

          </h2>

          <p className="subtitle mt-6 mx-auto">

            MetroFlow AI brings multiple metro
            networks together into one intelligent
            monitoring platform with live analytics,
            crowd prediction and operational insights.

          </p>

        </div>

        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">

          {metroLines.map((line, index) => (

            <motion.div
              key={line.name}
              initial={{
                opacity: 0,
                y: 40,
              }}
              whileInView={{
                opacity: 1,
                y: 0,
              }}
              viewport={{
                once: true,
              }}
              transition={{
                delay: index * 0.08,
              }}
              whileHover={{
                y: -10,
              }}
              className="overflow-hidden rounded-3xl border border-border bg-card shadow-lg"
            >

              <div
                className={`h-2 bg-gradient-to-r ${line.color}`}
              />

              <div className="p-8">

                <div
                  className={`mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r ${line.color} text-white`}
                >
                  <TrainFront size={30} />
                </div>

                <h3 className="text-2xl font-bold">

                  {line.name}

                </h3>

                <p className="mt-2 text-muted">

                  {line.city}

                </p>

                <div className="mt-8 space-y-5">

                  <div className="flex items-center justify-between">

                    <span className="text-muted">

                      Stations

                    </span>

                    <span className="font-bold">

                      {line.stations}

                    </span>

                  </div>

                  <div className="flex items-center justify-between">

                    <span className="text-muted">

                      Daily Passengers

                    </span>

                    <span className="font-bold">

                      {line.passengers}

                    </span>

                  </div>

                </div>

                <Link
                  href="/stations"
                  className="mt-8 inline-flex items-center gap-2 font-semibold text-blue-600"
                >

                  View Network

                  <ArrowRight size={18} />

                </Link>

              </div>

            </motion.div>

          ))}

        </div>

        <motion.div
          initial={{
            opacity: 0,
            y: 30,
          }}
          whileInView={{
            opacity: 1,
            y: 0,
          }}
          viewport={{
            once: true,
          }}
          className="mt-20 rounded-[36px] border border-border bg-card p-10 shadow-xl"
        >

          <div className="flex flex-col items-center justify-between gap-8 lg:flex-row">

            <div className="flex items-center gap-5">

              <div className="rounded-2xl bg-blue-500/10 p-5">

                <MapPinned
                  size={34}
                  className="text-blue-600"
                />

              </div>

              <div>

                <h3 className="text-2xl font-bold">

                  Unified Metro Intelligence Platform

                </h3>

                <p className="mt-2 text-muted">

                  One dashboard for every station,
                  every train and every passenger.

                </p>

              </div>

            </div>

            <Link
              href="/dashboard"
              className="btn btn-primary"
            >

              Explore Dashboard

              <ArrowRight size={18} />

            </Link>

          </div>

        </motion.div>

      </div>

    </section>
  );
}