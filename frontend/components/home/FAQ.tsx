"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "What is MetroFlow AI?",
    answer:
      "MetroFlow AI is an AI-powered smart metro management platform that provides real-time monitoring, passenger analytics, crowd prediction and operational insights for metro authorities.",
  },
  {
    question: "How does crowd prediction work?",
    answer:
      "Our AI analyzes historical passenger data, train schedules, weather conditions and live station activity to predict congestion before it occurs.",
  },
  {
    question: "Can MetroFlow work with existing metro systems?",
    answer:
      "Yes. MetroFlow is designed with API-first architecture so it can integrate with existing metro management systems, IoT devices and operational databases.",
  },
  {
    question: "Is passenger privacy protected?",
    answer:
      "Absolutely. MetroFlow does not rely on facial recognition. All analytics are generated using privacy-aware operational and aggregated passenger data.",
  },
  {
    question: "Who can use MetroFlow?",
    answer:
      "Metro authorities, operations teams, station managers and passengers can all benefit from MetroFlow through dedicated dashboards and intelligent insights.",
  },
];

export default function FAQ() {
  const [active, setActive] = useState<number | null>(0);

  return (
    <section className="section">

      <div className="container">

        <div className="mx-auto max-w-3xl text-center">

          <span className="badge">

            Frequently Asked Questions

          </span>

          <h2 className="heading mt-6">

            Everything You Need To Know

          </h2>

          <p className="subtitle mt-6">

            Learn how MetroFlow AI helps metro
            operators improve efficiency while
            providing a better commuting experience.

          </p>

        </div>

        <div className="mx-auto mt-20 max-w-4xl space-y-6">

          {faqs.map((faq, index) => {

            const isOpen = active === index;

            return (

              <motion.div
                key={faq.question}
                layout
                className="overflow-hidden rounded-3xl border border-border bg-card shadow-lg"
              >

                <button
                  onClick={() =>
                    setActive(isOpen ? null : index)
                  }
                  className="flex w-full items-center justify-between p-7 text-left"
                >

                  <h3 className="text-lg font-bold">

                    {faq.question}

                  </h3>

                  <motion.div
                    animate={{
                      rotate: isOpen ? 180 : 0,
                    }}
                    transition={{
                      duration: 0.25,
                    }}
                  >

                    <ChevronDown size={24} />

                  </motion.div>

                </button>

                <AnimatePresence>

                  {isOpen && (

                    <motion.div
                      initial={{
                        opacity: 0,
                        height: 0,
                      }}
                      animate={{
                        opacity: 1,
                        height: "auto",
                      }}
                      exit={{
                        opacity: 0,
                        height: 0,
                      }}
                      transition={{
                        duration: 0.3,
                      }}
                    >

                      <div className="border-t border-border px-7 py-6">

                        <p className="leading-8 text-muted">

                          {faq.answer}

                        </p>

                      </div>

                    </motion.div>

                  )}

                </AnimatePresence>

              </motion.div>

            );

          })}

        </div>

      </div>

    </section>
  );
}