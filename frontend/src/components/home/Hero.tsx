"use client";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Sparkles,
  Users,
  Clock3,
  ShieldCheck,
  Activity,
} from "lucide-react";

export default function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-24">
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-0 top-0 h-[500px] w-[500px] rounded-full bg-blue-500/20 blur-[120px]" />
        <div className="absolute right-0 bottom-0 h-[500px] w-[500px] rounded-full bg-cyan-500/20 blur-[120px]" />
      </div>

      <div className="container">
        <div className="grid items-center gap-20 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <div className="badge">
              <Sparkles size={15} />
              AI Powered Smart Metro Platform
            </div>

            <h1 className="display">
              Build the
              <span className="gradient-text"> Future </span>
              of Urban Transportation
            </h1>

            <p className="subtitle">
              MetroFlow AI helps metro operators monitor passenger
              movement, predict crowd density, optimize schedules,
              improve passenger safety and manage the entire metro
              network using Artificial Intelligence.
            </p>

            <div className="hero-buttons">
              <Link href="/signup" className="btn btn-primary">
                Get Started
                <ArrowRight size={18} />
              </Link>
              <Link href="/dashboard" className="btn btn-secondary">
                Live Dashboard
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-6 pt-6">
              <div>
                <h2 className="text-4xl font-black text-blue-600">2.4M+</h2>
                <p className="mt-2 text-sm text-muted">Daily Passengers</p>
              </div>
              <div>
                <h2 className="text-4xl font-black text-cyan-500">350+</h2>
                <p className="mt-2 text-sm text-muted">Metro Stations</p>
              </div>
              <div>
                <h2 className="text-4xl font-black text-purple-500">98%</h2>
                <p className="mt-2 text-sm text-muted">Prediction Accuracy</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 80 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9 }}
            className="relative"
          >
            <div className="relative overflow-hidden rounded-[36px] border border-border bg-card shadow-2xl">
              <Image
                src="/images/hero/metro-hero.jpg"
                alt="MetroFlow AI"
                width={900}
                height={900}
                priority
                className="h-[720px] w-full object-cover"
              />
            </div>

            <motion.div
              animate={{ y: [0, -12, 0] }}
              transition={{ repeat: Infinity, duration: 4 }}
              className="glass absolute left-[-30px] top-16 flex items-center gap-4 rounded-3xl px-6 py-5"
            >
              <div className="rounded-2xl bg-blue-600 p-4 text-white">
                <Users size={28} />
              </div>
              <div>
                <p className="text-sm text-muted">Passenger Density</p>
                <h3 className="text-xl font-bold">Comfortable</h3>
              </div>
            </motion.div>

            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ repeat: Infinity, duration: 5 }}
              className="glass absolute bottom-20 right-[-30px] flex items-center gap-4 rounded-3xl px-6 py-5"
            >
              <div className="rounded-2xl bg-cyan-500 p-4 text-white">
                <Clock3 size={28} />
              </div>
              <div>
                <p className="text-sm text-muted">Next Train</p>
                <h3 className="text-xl font-bold">03 Minutes</h3>
              </div>
            </motion.div>

            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 6 }}
              className="glass absolute bottom-[-25px] left-24 flex items-center gap-4 rounded-3xl px-6 py-5"
            >
              <div className="rounded-2xl bg-green-500 p-4 text-white">
                <ShieldCheck size={28} />
              </div>
              <div>
                <p className="text-sm text-muted">Safety Score</p>
                <h3 className="text-xl font-bold">99.8%</h3>
              </div>
            </motion.div>

            <motion.div
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ repeat: Infinity, duration: 3 }}
              className="glass absolute right-10 top-[-30px] rounded-full p-5"
            >
              <Activity size={34} className="text-blue-600" />
            </motion.div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="pointer-events-none absolute inset-0"
        >
          <div className="absolute left-12 top-20 h-3 w-3 rounded-full bg-blue-500 shadow-[0_0_30px_#2563eb]" />
          <div className="absolute right-16 top-40 h-4 w-4 rounded-full bg-cyan-400 shadow-[0_0_35px_#06b6d4]" />
          <div className="absolute bottom-20 left-24 h-4 w-4 rounded-full bg-purple-500 shadow-[0_0_35px_#7c3aed]" />
          <div className="absolute bottom-40 right-20 h-3 w-3 rounded-full bg-green-500 shadow-[0_0_30px_#22c55e]" />
        </motion.div>
      </div>
    </section>
  );
}
