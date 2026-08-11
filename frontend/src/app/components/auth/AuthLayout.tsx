"use client";

import { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  BrainCircuit,
  ShieldCheck,
  TrainFront,
  Activity,
} from "lucide-react";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
}

const features = [
  {
    icon: BrainCircuit,
    title: "AI Crowd Prediction",
    description: "Predict passenger density using AI models.",
  },
  {
    icon: TrainFront,
    title: "Smart Scheduling",
    description: "Optimize train frequency dynamically.",
  },
  {
    icon: Activity,
    title: "Live Monitoring",
    description: "Real-time operational dashboard.",
  },
  {
    icon: ShieldCheck,
    title: "Enterprise Security",
    description: "Secure authentication & RBAC.",
  },
];

export default function AuthLayout({
  children,
  title,
  subtitle,
}: AuthLayoutProps) {
  return (
    <main className="min-h-screen bg-background">

      <div className="grid min-h-screen lg:grid-cols-2">

        {/* LEFT */}

        <section
          className="
          relative
          hidden
          overflow-hidden
          bg-gradient-to-br
          from-black
          via-[#18210f]
          to-[#34451e]
          lg:flex
          "
        >

          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#a8c66c33,transparent_45%)]" />

          <div className="absolute bottom-[-120px] right-[-120px] h-80 w-80 rounded-full bg-lime-400/15 blur-[120px]" />

          <div className="relative z-10 flex h-full flex-col justify-between p-14">

            <div>

              <Link
                href="/"
                className="inline-flex items-center gap-3"
              >
                <Image
                  src="/metro-mark.svg"
                  width={46}
                  height={46}
                  alt="MetroFlow"
                />

                <div>

                  <h2 className="text-2xl font-bold text-white">
                    MetroFlow AI
                  </h2>

                  <p className="text-sm text-slate-300">
                    Smart Transportation Platform
                  </p>

                </div>

              </Link>

            </div>

            <div>

              <h1 className="max-w-lg text-5xl font-black leading-tight text-white">
                AI Powered Metro Crowd
                Management Platform
              </h1>

              <p className="mt-8 max-w-xl text-lg leading-8 text-slate-300">
                Intelligent passenger analytics,
                crowd monitoring,
                scheduling,
                prediction,
                and transportation insights.
              </p>

              <div className="mt-14 grid gap-6">

                {features.map((item) => {

                  const Icon = item.icon;

                  return (

                    <div
                      key={item.title}
                      className="
                      flex
                      items-start
                      gap-5
                      rounded-2xl
                      border
                      border-white/10
                      bg-white/5
                      p-5
                      backdrop-blur-xl
                      "
                    >

                      <div
                        className="
                        flex
                        h-12
                        w-12
                        items-center
                        justify-center
                        rounded-xl
                        bg-lime-300/15
                        "
                      >

                        <Icon
                          className="text-lime-200"
                          size={24}
                        />

                      </div>

                      <div>

                        <h3 className="font-semibold text-white">
                          {item.title}
                        </h3>

                        <p className="mt-2 text-sm text-slate-400">
                          {item.description}
                        </p>

                      </div>

                    </div>

                  );

                })}

              </div>

            </div>

            <div className="text-sm text-slate-400">
              © 2026 MetroFlow AI
            </div>

          </div>

        </section>

        {/* RIGHT */}

        <section
          className="
          flex
          items-center
          justify-center
          p-8
          lg:p-16
          "
        >

          <div className="w-full max-w-md">

            <Link
              href="/"
              className="
              mb-8
              inline-flex
              items-center
              gap-2
              text-sm
              text-muted
              transition
              hover:text-primary
              "
            >
              <ArrowLeft size={18} />

              Back to Home

            </Link>

            <div
              className="
              rounded-3xl
              border
              border-border
              bg-card
              p-8
              shadow-xl
              "
            >

              <h1 className="text-4xl font-bold">
                {title}
              </h1>

              <p className="mt-3 text-muted">
                {subtitle}
              </p>

              <div className="mt-10">

                {children}

              </div>

            </div>

          </div>

        </section>

      </div>

    </main>
  );
}
