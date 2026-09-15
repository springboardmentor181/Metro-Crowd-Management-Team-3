"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Sparkles,
  TrainFront,
} from "lucide-react";

export default function CTA() {
  return (
    <section className="section overflow-hidden">

      <div className="container">

        <motion.div
          initial={{
            opacity: 0,
            y: 50,
          }}
          whileInView={{
            opacity: 1,
            y: 0,
          }}
          viewport={{
            once: true,
          }}
          transition={{
            duration: 0.6,
          }}
          className="relative overflow-hidden rounded-[40px] bg-gradient-to-br from-blue-600 via-cyan-500 to-indigo-700 px-8 py-20 text-white shadow-2xl md:px-20"
        >

          <div className="absolute -left-16 -top-16 h-72 w-72 rounded-full bg-white/10 blur-3xl" />

          <div className="absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-cyan-300/10 blur-3xl" />

          <div className="relative z-10 mx-auto max-w-4xl text-center">

            <div className="mb-8 inline-flex items-center gap-2 rounded-full bg-white/15 px-5 py-2 backdrop-blur">

              <Sparkles size={16} />

              <span className="font-semibold">

                AI Powered Smart Metro Platform

              </span>

            </div>

            <h2 className="text-4xl font-black leading-tight md:text-6xl">

              Ready To Transform

              <br />

              Your Metro Network?

            </h2>

            <p className="mx-auto mt-8 max-w-3xl text-lg leading-9 text-white/90">

              Join MetroFlow AI and experience
              intelligent passenger analytics,
              crowd prediction, AI-powered
              scheduling and real-time operational
              monitoring in one unified platform.

            </p>

            <div className="mt-12 flex flex-wrap items-center justify-center gap-5">

              <Link
                href="/signup"
                className="inline-flex items-center gap-3 rounded-full bg-white px-8 py-4 font-bold text-slate-900 transition hover:scale-105"
              >

                Get Started

                <ArrowRight size={18} />

              </Link>

              <Link
                href="/dashboard"
                className="inline-flex items-center gap-3 rounded-full border border-white/30 bg-white/10 px-8 py-4 font-bold backdrop-blur transition hover:bg-white/20"
              >

                <TrainFront size={18} />

                Live Demo

              </Link>

            </div>

            <div className="mt-16 grid gap-8 md:grid-cols-3">

              <div>

                <h3 className="text-4xl font-black">

                  2.4M+

                </h3>

                <p className="mt-2 text-white/80">

                  Daily Passengers

                </p>

              </div>

              <div>

                <h3 className="text-4xl font-black">

                  350+

                </h3>

                <p className="mt-2 text-white/80">

                  Metro Stations

                </p>

              </div>

              <div>

                <h3 className="text-4xl font-black">

                  98%

                </h3>

                <p className="mt-2 text-white/80">

                  AI Prediction Accuracy

                </p>

              </div>

            </div>

          </div>

        </motion.div>

      </div>

    </section>
  );
}