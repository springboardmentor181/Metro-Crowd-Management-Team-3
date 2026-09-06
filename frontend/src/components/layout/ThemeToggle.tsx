
"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const dark = mounted && (theme === "system"
    ? resolvedTheme
    : theme) === "dark";

  return (
    <button
      aria-label="Toggle Theme"
      onClick={() =>
        setTheme(dark ? "light" : "dark")
      }
      className="group relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-border bg-card shadow-md transition-all duration-300 hover:scale-105 hover:shadow-xl"
    >
      <span className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-cyan-500/10 to-violet-500/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <span className="relative z-10">
        {dark ? (
          <Sun
            size={20}
            className="text-yellow-400 transition-transform duration-300 group-hover:rotate-180"
          />
        ) : (
          <Moon
            size={20}
            className="text-slate-700 transition-transform duration-300 group-hover:-rotate-12 dark:text-slate-200"
          />
        )}
      </span>
    </button>
  );
}
