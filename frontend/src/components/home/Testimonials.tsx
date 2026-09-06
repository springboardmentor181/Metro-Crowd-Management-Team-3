"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Rajesh Kumar",
    role: "Metro Operations Manager",
    company: "Delhi Metro",
    image: "/images/testimonials/person1.jpg",
    rating: 5,
    review:
      "MetroFlow AI transformed our monitoring system. Real-time analytics and AI predictions significantly reduced congestion during peak hours.",
  },
  {
    name: "Ananya Sharma",
    role: "Daily Passenger",
    company: "Bengaluru Metro",
    image: "/images/testimonials/person2.jpg",
    rating: 5,
    review:
      "The crowd prediction feature helps me avoid rush hours. My daily commute has become much smoother and more comfortable.",
  },
  {
    name: "Amit Verma",
    role: "Control Room Officer",
    company: "Mumbai Metro",
    image: "/images/testimonials/person3.jpg",
    rating: 5,
    review:
      "The dashboard is clean, fast and extremely useful. Live alerts and AI recommendations help our team respond quickly.",
  },
];

export default function Testimonials() {
  return (
    <section className="section">

      <div className="container">

        <div className="mx-auto max-w-3xl text-center">

          <span className="badge">

            Testimonials

          </span>

          <h2 className="heading mt-6">

            Trusted By Operators
            And Daily Passengers

          </h2>

          <p className="subtitle mt-6">

            MetroFlow AI is designed for everyone—
            from metro authorities managing operations
            to passengers planning safer and smarter
            journeys.

          </p>

        </div>

        <div className="testimonial-grid mt-20">

          {testimonials.map((item, index) => (

            <motion.div
              key={item.name}
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
                delay: index * 0.15,
              }}
              whileHover={{
                y: -8,
              }}
              className="testimonial"
            >

              <Quote
                className="mb-6 text-blue-600"
                size={42}
              />

              <p>

                &quot;{item.review}&quot;

              </p>

              <div className="mb-6 flex gap-1">

                {Array.from({
                  length: item.rating,
                }).map((_, i) => (

                  <Star
                    key={i}
                    size={18}
                    fill="currentColor"
                    className="text-yellow-400"
                  />

                ))}

              </div>

              <div className="testimonial-user">

                <Image
                  src={item.image}
                  alt={item.name}
                  width={60}
                  height={60}
                  className="rounded-full object-cover"
                />

                <div>

                  <h4 className="font-bold">

                    {item.name}

                  </h4>

                  <p className="text-sm text-muted">

                    {item.role}

                  </p>

                  <span className="text-sm font-medium text-blue-600">

                    {item.company}

                  </span>

                </div>

              </div>

            </motion.div>

          ))}

        </div>

      </div>

    </section>
  );
}
