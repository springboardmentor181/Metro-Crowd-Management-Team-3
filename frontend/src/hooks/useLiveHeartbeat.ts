"use client";

import { useEffect, useState } from "react";

import { useLiveSocket } from "@/hooks/useLiveSocket";

export function useLiveHeartbeat() {
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);
  const [now, setNow] = useState<number>(() => Date.now());
  const [connected, setConnected] = useState(false);
  const [mountedAt] = useState<number>(() => Date.now());

  useLiveSocket({
    crowd_update: () => {
      setConnected(true);
      setLastUpdate(Date.now());
    },
    train_position: () => {
      setConnected(true);
      setLastUpdate(Date.now());
    },
  });

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const reference = lastUpdate ?? mountedAt;
  const secondsAgo = Math.max(0, Math.floor((now - reference) / 1000));

  return { connected, secondsAgo, lastUpdate, now };
}
