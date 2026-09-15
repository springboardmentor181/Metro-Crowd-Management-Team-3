"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import {
  BrainCircuit,
  Cpu,
  Sparkles,
  ScanSearch,
  Activity,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

const aiFeatures = [
  {
    icon: BrainCircuit,
    title: "Deep Learning Models",
    description:
      "AI models continuously learn passenger movement patterns and improve forecasting accuracy.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: ScanSearch,
    title: "Crowd Prediction",
    description:
      "Predict congestion before it happens using historical and live passenger data.",
    color: "from-violet-500 to-indigo-500",
  },
  {
    icon: Cpu,
    title: "Decision Engine",
    description:
      "Recommend operational actions with explainable AI and intelligent scheduling.",
    color: "from-emerald-500 to-cyan-500",
  },
  {
    icon: Activity,
    title: "Real-Time Intelligence",
    description:
      "Analyze thousands of events every second across the metro network.",
    color: "from-orange-500 to-red-500",
  },
];

export default function AISection() {
  return (
    <section className="section overflow-hidden">

      <div className="container">

        <div className="grid items-center gap-20 lg:grid-cols-2">

          <motion.div
            initial={{ opacity: 0, x: -60 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative"
          >

            <div className="overflow-hidden rounded-[36px] border border-border bg-card shadow-2xl">

              <Image
                src="/images/ai/ai-dashboard.jpg"
                alt="MetroFlow AI"
                width={900}
                height={900}
                className="h-[720px] w-full object-cover"
              />

            </div>

            <div className="glass absolute -left-6 top-10 rounded-3xl p-6">

              <div className="flex items-center gap-4">

                <div className="rounded-2xl bg-blue-500 p-4 text-white">

                  <BrainCircuit size={30} />

                </div>

                <div>

                  <p className="text-sm text-muted">

                    AI Confidence

                  </p>

                  <h3 className="text-xl font-bold">

                    98.7%

                  </h3>

                </div>

              </div>

            </div>

            <div className="glass absolute -right-6 bottom-16 rounded-3xl p-6">

              <div className="flex items-center gap-4">

                <div className="rounded-2xl bg-emerald-500 p-4 text-white">

                  <Cpu size={30} />

                </div>

                <div>

                  <p className="text-sm text-muted">

                    Predictions Today

                  </p>

                  <h3 className="text-xl font-bold">

                    14,286

                  </h3>

                </div>

              </div>

            </div>

          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 60 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >

            <span className="badge">

              <Sparkles size={16} />

              Artificial Intelligence

            </span>

            <h2 className="heading mt-6">

              AI That Thinks Before
              The Crowd Arrives

            </h2>

            <p className="subtitle mt-6">

              MetroFlow AI combines machine learning,
              predictive analytics and operational
              intelligence to deliver proactive
              recommendations for metro authorities.
            </p>

            <div className="mt-12 space-y-8">

              {aiFeatures.map((item) => {

                const Icon = item.icon;

                return (

                  <motion.div
                    key={item.title}
                    whileHover={{ x: 10 }}
                    className="flex gap-5 rounded-3xl border border-border bg-card p-6"
                  >

                    <div
                      className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r ${item.color} text-white`}
                    >

                      <Icon size={28} />

                    </div>

                    <div>

                      <h3 className="text-xl font-bold">

                        {item.title}

                      </h3>

                      <p className="mt-2 text-muted">

                        {item.description}

                      </p>

                    </div>

                  </motion.div>

                );

              })}

            </div>

            <Link
              href="/analytics"
              className="btn btn-primary mt-10 inline-flex"
            >

              Explore AI Analytics

              <ArrowRight size={18} />

            </Link>

          </motion.div>

        </div>

      </div>

    </section>
  );
}