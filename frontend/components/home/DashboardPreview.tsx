"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BrainCircuit,
  Activity,
  Users,
  TrainFront,
  BellRing,
} from "lucide-react";

const cards = [
  {
    icon: Activity,
    title: "Live Crowd",
    value: "42%",
    color: "bg-blue-500",
  },
  {
    icon: TrainFront,
    title: "Running Trains",
    value: "852",
    color: "bg-cyan-500",
  },
  {
    icon: Users,
    title: "Passengers",
    value: "2.4M",
    color: "bg-violet-500",
  },
  {
    icon: BellRing,
    title: "Alerts",
    value: "07",
    color: "bg-red-500",
  },
];

export default function DashboardPreview() {
  return (
    <section className="section bg-muted/20">

      <div className="container">

        <div className="mx-auto mb-16 max-w-3xl text-center">

          <span className="badge">

            Dashboard Preview

          </span>

          <h2 className="heading mt-6">

            Everything In One
            Intelligent Dashboard

          </h2>

          <p className="subtitle mt-6">

            Monitor trains, passengers, crowd density,
            AI predictions, alerts and analytics from
            a single operational dashboard.

          </p>

        </div>

        <div className="grid items-center gap-20 lg:grid-cols-2">

          <motion.div
            initial={{
              opacity: 0,
              x: -60,
            }}
            whileInView={{
              opacity: 1,
              x: 0,
            }}
            viewport={{
              once: true,
            }}
            transition={{
              duration: .6,
            }}
          >

            <div className="overflow-hidden rounded-[34px] border border-border shadow-2xl">

              <Image
                src="/images/dashboard/dashboard-preview.png"
                alt="MetroFlow Dashboard"
                width={1200}
                height={800}
                className="w-full object-cover"
              />

            </div>

          </motion.div>

          <motion.div
            initial={{
              opacity: 0,
              x: 60,
            }}
            whileInView={{
              opacity: 1,
              x: 0,
            }}
            viewport={{
              once: true,
            }}
            transition={{
              duration: .6,
            }}
          >

            <span className="badge">

              <BrainCircuit
                size={16}
              />

              AI Dashboard

            </span>

            <h2 className="heading mt-6">

              Real-Time Operational
              Intelligence

            </h2>

            <p className="subtitle mt-6">

              MetroFlow Dashboard gives operators
              a complete live overview of stations,
              passenger movement, train operations,
              AI insights and emergency alerts.

            </p>

            <div className="mt-10 grid gap-5 sm:grid-cols-2">

              {cards.map((card) => {

                const Icon = card.icon;

                return (

                  <motion.div
                    key={card.title}
                    whileHover={{
                      y: -8,
                    }}
                    className="rounded-3xl border border-border bg-card p-6 shadow-lg"
                  >

                    <div
                      className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ${card.color} text-white`}
                    >

                      <Icon
                        size={26}
                      />

                    </div>

                    <h3 className="text-3xl font-black">

                      {card.value}

                    </h3>

                    <p className="mt-2 text-muted">

                      {card.title}

                    </p>

                  </motion.div>

                );

              })}

            </div>

            <Link
              href="/dashboard"
              className="btn btn-primary mt-10 inline-flex"
            >

              Open Dashboard

              <ArrowRight
                size={18}
              />

            </Link>

          </motion.div>

        </div>

      </div>

    </section>
  );
}