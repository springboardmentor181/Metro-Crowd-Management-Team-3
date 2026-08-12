"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export default function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const dark = resolvedTheme === "dark";

  const handleToggle = () => {
    setTheme(dark ? "light" : "dark");
  };

  return (
    <button
      type="button"
      aria-label="Toggle Theme"
      onClick={handleToggle}
      className="group relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:scale-105 hover:shadow-md dark:border-slate-700 dark:bg-slate-900"
    >
      <span className="absolute inset-0 rounded-full bg-slate-100 opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:bg-slate-800" />

      <span className="relative z-10">
        {!mounted ? (
          <span className="block h-5 w-5" aria-hidden="true" />
        ) : dark ? (
          <Sun
            size={20}
            className="text-yellow-400 transition-transform duration-300 group-hover:rotate-180"
          />
        ) : (
          <Moon
            size={20}
            className="text-slate-700 transition-transform duration-300 group-hover:rotate-180 dark:text-slate-200"
          />
        )}
      </span>
    </button>
  );
}