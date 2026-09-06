"use client";

import Link from "next/link";
import {
  TrainFront,
  Github,
  Linkedin,
  Twitter,
  Mail,
  Phone,
  MapPin,
  ArrowUpRight,
} from "lucide-react";

const platform = [
  "Dashboard",
  "Stations",
  "Crowd",
  "Analytics",
  "Schedule",
];

const company = [
  "About",
  "Features",
  "Documentation",
  "Contact",
  "Careers",
];

const support = [
  "Help Center",
  "Privacy Policy",
  "Terms & Conditions",
  "Report Issue",
  "FAQ",
];

export default function Footer() {
  return (
    <footer className="border-t border-border bg-card">

      <div className="container py-20">

        <div className="grid gap-14 lg:grid-cols-5">

          <div className="lg:col-span-2">

            <Link
              href="/"
              className="flex items-center gap-4"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white">

                <TrainFront size={28} />

              </div>

              <div>

                <h2 className="text-2xl font-black">

                  MetroFlow

                  <span className="gradient-text">
                    {" "}
                    AI
                  </span>

                </h2>

                <p className="text-sm text-muted">

                  Smart Metro Management Platform

                </p>

              </div>

            </Link>

            <p className="mt-8 max-w-md leading-8 text-muted">

              MetroFlow AI is an intelligent metro
              management platform designed to improve
              passenger experience, predict crowd
              density and provide real-time operational
              insights through Artificial Intelligence.

            </p>

            <div className="mt-8 flex gap-4">

              <a
                href="#"
                className="flex h-12 w-12 items-center justify-center rounded-xl border border-border transition hover:bg-blue-600 hover:text-white"
              >
                <Github size={20} />
              </a>

              <a
                href="#"
                className="flex h-12 w-12 items-center justify-center rounded-xl border border-border transition hover:bg-blue-600 hover:text-white"
              >
                <Linkedin size={20} />
              </a>

              <a
                href="#"
                className="flex h-12 w-12 items-center justify-center rounded-xl border border-border transition hover:bg-blue-600 hover:text-white"
              >
                <Twitter size={20} />
              </a>

            </div>

          </div>

          <div>

            <h3 className="mb-6 text-xl font-bold">

              Platform

            </h3>

            <ul className="space-y-4">

              {platform.map((item) => (

                <li key={item}>

                  <Link
                    href="#"
                    className="flex items-center justify-between text-muted transition hover:text-blue-600"
                  >

                    {item}

                    <ArrowUpRight size={16} />

                  </Link>

                </li>

              ))}

            </ul>

          </div>

          <div>

            <h3 className="mb-6 text-xl font-bold">

              Company

            </h3>

            <ul className="space-y-4">

              {company.map((item) => (

                <li key={item}>

                  <Link
                    href="#"
                    className="flex items-center justify-between text-muted transition hover:text-blue-600"
                  >

                    {item}

                    <ArrowUpRight size={16} />

                  </Link>

                </li>

              ))}

            </ul>

          </div>

          <div>

            <h3 className="mb-6 text-xl font-bold">

              Support

            </h3>

            <ul className="space-y-4">

              {support.map((item) => (

                <li key={item}>

                  <Link
                    href="#"
                    className="flex items-center justify-between text-muted transition hover:text-blue-600"
                  >

                    {item}

                    <ArrowUpRight size={16} />

                  </Link>

                </li>

              ))}

            </ul>

          </div>

        </div>

        <div className="mt-20 grid gap-10 border-t border-border pt-10 lg:grid-cols-3">

          <div className="flex items-center gap-4">

            <Mail
              size={22}
              className="text-blue-600"
            />

            <div>

              <h4 className="font-bold">

                Email

              </h4>

              <p className="text-muted">

                support@metroflow.ai

              </p>

            </div>

          </div>

          <div className="flex items-center gap-4">

            <Phone
              size={22}
              className="text-cyan-500"
            />

            <div>

              <h4 className="font-bold">

                Phone

              </h4>

              <p className="text-muted">

                +91 98765 43210

              </p>

            </div>

          </div>

          <div className="flex items-center gap-4">

            <MapPin
              size={22}
              className="text-violet-500"
            />

            <div>

              <h4 className="font-bold">

                Office

              </h4>

              <p className="text-muted">

                Bengaluru, India

              </p>

            </div>

          </div>

        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-6 border-t border-border pt-8 md:flex-row">

          <p className="text-sm text-muted">

            © 2026 MetroFlow AI. All Rights Reserved.

          </p>

          <div className="flex gap-8 text-sm text-muted">

            <Link
              href="/privacy"
              className="hover:text-blue-600"
            >
              Privacy
            </Link>

            <Link
              href="/terms"
              className="hover:text-blue-600"
            >
              Terms
            </Link>

            <Link
              href="/cookies"
              className="hover:text-blue-600"
            >
              Cookies
            </Link>

          </div>

        </div>

      </div>

    </footer>
  );
}