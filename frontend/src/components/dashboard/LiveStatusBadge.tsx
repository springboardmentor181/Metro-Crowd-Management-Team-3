"use client";

import { Radio, RefreshCw, WifiOff } from "lucide-react";

import { useLiveHeartbeat } from "@/hooks/useLiveHeartbeat";
import { useLiveSocketContext } from "@/providers/LiveSocketProvider";

export default function LiveStatusBadge({ className = "" }: { className?: string }) {
  const { connectionStatus } = useLiveSocketContext();
  const { secondsAgo } = useLiveHeartbeat();

  if (connectionStatus === "offline") {
    return (
      <span
        className={`flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-500 ${className}`}
        title="No network connection - live updates paused"
      >
        <WifiOff size={12} />
        Offline
      </span>
    );
  }

  if (connectionStatus === "reconnecting") {
    return (
      <span
        className={`flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-500 ${className}`}
        title="Live data connection status"
      >
        <RefreshCw size={12} className="animate-spin" />
        Reconnecting...
      </span>
    );
  }

  return (
    <span
      className={`flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-500 ${className}`}
      title="Live data connection status"
    >
      <Radio size={12} className="animate-pulse" />
      {secondsAgo <= 1 ? "Live · updated just now" : `Live · updated ${secondsAgo}s ago`}
    </span>
  );
}
