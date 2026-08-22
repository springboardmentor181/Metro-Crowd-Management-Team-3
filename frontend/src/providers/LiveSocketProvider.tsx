"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";

import type { LiveEvent } from "@/hooks/useLiveSocket";

type Listener = (data: unknown) => void;

interface LiveSocketContextValue {
  subscribe: (event: LiveEvent, listener: Listener) => () => void;
}

const LiveSocketContext = createContext<LiveSocketContextValue | undefined>(
  undefined,
);

function resolveWsUrl(): string | null {
  const base = process.env.NEXT_PUBLIC_API_URL;
  if (base) {
    return base.replace(/^http/, "ws").replace(/\/$/, "") + "/ws/monitor";
  }
  if (typeof window === "undefined") return null;
  const proto = window.location.protocol === "https:" ? "wss" : "ws";
  return `${proto}://${window.location.host}/ws/monitor`;
}

export function LiveSocketProvider({ children }: { children: ReactNode }) {
  const listenersRef = useRef<Map<LiveEvent, Set<Listener>>>(new Map());

  useEffect(() => {
    const url = resolveWsUrl();
    if (!url) return;

    let socket: WebSocket | null = null;
    let cleanedUp = false;
    let retryDelayMs = 1000;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    function connect() {
      socket = new WebSocket(url as string);

      socket.onopen = () => {
        retryDelayMs = 1000;
      };

      socket.onmessage = (event) => {
        let parsed: { event?: string; data?: unknown };
        try {
          parsed = JSON.parse(event.data);
        } catch {
          return;
        }
        const eventName = parsed.event as LiveEvent | undefined;
        if (!eventName) return;
        const listeners = listenersRef.current.get(eventName);
        listeners?.forEach((listener) => listener(parsed.data));
      };

      socket.onclose = () => {
        if (cleanedUp) return;
        retryTimer = setTimeout(connect, retryDelayMs);
        retryDelayMs = Math.min(retryDelayMs * 2, 15000);
      };

      socket.onerror = () => {
        socket?.close();
      };
    }

    connect();

    return () => {
      cleanedUp = true;
      if (retryTimer) clearTimeout(retryTimer);
      socket?.close();
    };
  }, []);

  const subscribe = useCallback((event: LiveEvent, listener: Listener) => {
    const map = listenersRef.current;
    if (!map.has(event)) map.set(event, new Set());
    map.get(event)!.add(listener);
    return () => {
      map.get(event)?.delete(listener);
    };
  }, []);

  const value = useMemo(() => ({ subscribe }), [subscribe]);

  return (
    <LiveSocketContext.Provider value={value}>
      {children}
    </LiveSocketContext.Provider>
  );
}

export function useLiveSocketContext() {
  const ctx = useContext(LiveSocketContext);
  if (!ctx) {
    throw new Error(
      "useLiveSocketContext must be used within a LiveSocketProvider",
    );
  }
  return ctx;
}
