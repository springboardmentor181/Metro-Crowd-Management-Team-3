"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import {
  Users,
  BrainCircuit,
  BellRing,
  Route,
} from "lucide-react";

const features = [
  {
    title: "Live Crowd Monitoring",
    description:
      "Track passenger density in real time using AI-powered crowd analytics and occupancy prediction.",
    icon: Users,
    image: "/images/features/crowd.jpg",
    color: "from-blue-500 to-cyan-500",
  },
  {
    title: "AI Demand Prediction",
    description:
      "Predict upcoming passenger demand and congestion before it impacts metro operations.",
    icon: BrainCircuit,
    image: "/images/features/ai.jpg",
    color: "from-violet-500 to-blue-500",
  },
  {
    title: "Smart Route Optimization",
    description:
      "Recommend better train frequency and passenger routing using predictive intelligence.",
    icon: Route,
    image: "/images/features/routes.jpg",
    color: "from-cyan-500 to-emerald-500",
  },
  {
    title: "Real-Time Alerts",
    description:
      "Instantly notify operators and passengers about delays, emergencies and service updates.",
    icon: BellRing,
    image: "/images/features/alerts.jpg",
    color: "from-orange-500 to-red-500",
  },
];

export default function Features() {
  return (
    <section className="section">
      <div className="container">

        <div className="mx-auto max-w-3xl text-center">

          <span className="badge">

            Platform Features

          </span>

          <h2 className="heading mt-6">

            Everything Needed To Build A
            Smarter Metro Network

          </h2>

          <p className="subtitle mt-6">

            MetroFlow combines Artificial Intelligence,
            predictive analytics and live operational
            monitoring into one intelligent platform.

          </p>

        </div>

        <div className="feature-grid mt-20">

          {features.map((feature, index) => {

            const Icon = feature.icon;

            return (

              <motion.div
                key={feature.title}
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
                  delay: index * .15,
                }}
                whileHover={{
                  y: -10,
                }}
                className="feature-card"
              >

                <Image
                  src={feature.image}
                  alt={feature.title}
                  width={500}
                  height={350}
                  className="mb-6 h-56 w-full rounded-3xl object-cover"
                />

                <div
                  className={`mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r ${feature.color} text-white`}
                >

                  <Icon size={30} />

                </div>

                <h3 className="feature-title">

                  {feature.title}

                </h3>

                <p className="feature-text">

                  {feature.description}

                </p>

              </motion.div>

            );

          })}

        </div>

      </div>
    </section>
  );
}