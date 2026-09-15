"use client";

import { motion } from "framer-motion";
import {
  Activity,
  TrainFront,
  Users,
  MapPinned,
} from "lucide-react";

const stats = [
  {
    icon: Users,
    value: "2.4M+",
    title: "Daily Passengers",
    description: "Passengers monitored every day",
    color: "text-blue-600",
    bg: "bg-blue-500/10",
  },
  {
    icon: TrainFront,
    value: "850+",
    title: "Active Trains",
    description: "Live train tracking",
    color: "text-cyan-500",
    bg: "bg-cyan-500/10",
  },
  {
    icon: MapPinned,
    value: "350+",
    title: "Metro Stations",
    description: "Connected stations",
    color: "text-purple-500",
    bg: "bg-purple-500/10",
  },
  {
    icon: Activity,
    value: "98%",
    title: "AI Accuracy",
    description: "Prediction accuracy",
    color: "text-green-500",
    bg: "bg-green-500/10",
  },
];

export default function LiveStats() {
  return (
    <section className="section-sm">
      <div className="container">

        <div className="stats-grid">

          {stats.map((item, index) => {

            const Icon = item.icon;

            return (
              <motion.div
                key={item.title}
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
                  duration: 0.5,
                  delay: index * 0.15,
                }}
                whileHover={{
                  y: -8,
                }}
                className="stat-card"
              >
                <div
                  className={`mb-6 flex h-16 w-16 items-center justify-center rounded-2xl ${item.bg}`}
                >
                  <Icon
                    size={30}
                    className={item.color}
                  />
                </div>

                <h2 className="stat-number">
                  {item.value}
                </h2>

                <h3 className="mt-3 text-xl font-bold">
                  {item.title}
                </h3>

                <p className="mt-3 text-muted">
                  {item.description}
                </p>
              </motion.div>
            );
          })}

        </div>

      </div>
    </section>
  );
}