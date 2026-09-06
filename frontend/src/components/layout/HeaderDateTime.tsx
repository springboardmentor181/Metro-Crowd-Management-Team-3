"use client";

import { useEffect, useState } from "react";
import { Calendar, Clock } from "lucide-react";

export default function HeaderDateTime() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!now) return null;

  const dateStr = now.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const timeStr = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  return (
    <div className="hidden items-center gap-3 rounded-2xl border border-border bg-card px-4 py-2.5 text-sm font-semibold sm:flex">
      <span className="flex items-center gap-1.5 text-muted">
        <Calendar size={15} />
        {dateStr}
      </span>
      <span className="h-4 w-px bg-border" />
      <span className="flex items-center gap-1.5">
        <Clock size={15} className="text-primary" />
        {timeStr}
      </span>
    </div>
  );
}