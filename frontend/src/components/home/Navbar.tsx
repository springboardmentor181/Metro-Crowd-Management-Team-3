"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, TrainFront, X } from "lucide-react";
import { useEffect, useState } from "react";
import ThemeToggle from "@/components/layout/ThemeToggle";

const navItems = [
  { label: "Home", href: "/" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "Stations", href: "/stations" },
  { label: "Crowd", href: "/crowd" },
  { label: "Schedule", href: "/schedule" },
  { label: "Analytics", href: "/analytics" },
];

export default function Navbar() {
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed left-0 top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "border-b border-border bg-background/80 shadow-lg backdrop-blur-xl"
          : "bg-transparent"
      }`}
    >
      <div className="container flex h-20 items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-xl">
            <TrainFront size={24} />
          </div>

          <div>
            <h1 className="text-xl font-extrabold">
              MetroFlow
              <span className="gradient-text"> AI</span>
            </h1>

            <p className="text-xs text-muted">
              Smart Metro Intelligence
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`font-medium transition ${
                pathname === item.href
                  ? "text-blue-600"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-4 lg:flex">
          <ThemeToggle />

          <Link href="/login" className="btn btn-secondary">
            Login
          </Link>

          <Link href="/signup" className="btn btn-primary">
            Get Started
          </Link>
        </div>

        <button
          onClick={() => setOpen(!open)}
          className="lg:hidden"
        >
          {open ? <X size={30} /> : <Menu size={30} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-background lg:hidden">
          <div className="container flex flex-col gap-5 py-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`font-medium ${
                  pathname === item.href
                    ? "text-blue-600"
                    : "text-muted"
                }`}
              >
                {item.label}
              </Link>
            ))}

            <div className="mt-4 flex flex-col gap-3">
              <Link
                href="/login"
                className="btn btn-secondary"
              >
                Login
              </Link>

              <Link
                href="/signup"
                className="btn btn-primary"
              >
                Create Account
              </Link>

              <ThemeToggle />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}