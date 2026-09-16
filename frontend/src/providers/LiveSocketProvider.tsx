"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useDispatch } from "react-redux";

import type { LiveEvent } from "@/hooks/useLiveSocket";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { isAuthDisabled, getMockEmail } from "@/lib/auth/mock";
import { apiSlice } from "@/store/apiSlice";
import { invalidateApiData } from "@/hooks/useApiData";
import type { AppDispatch } from "@/store/store";

type Listener = (data: unknown) => void;

export type LiveConnectionStatus = "connected" | "reconnecting" | "offline";

interface LiveSocketContextValue {
  subscribe: (event: LiveEvent, listener: Listener) => () => void;
  
  isConnected: boolean;
  
  connectionStatus: LiveConnectionStatus;
}

const LiveSocketContext = createContext<LiveSocketContextValue | undefined>(
  undefined,
);

function resolveWsBase(): string | null {
  const base = process.env.NEXT_PUBLIC_API_URL;
  if (base) {
    return base.replace(/^http/, "ws").replace(/\/$/, "") + "/ws/monitor";
  }
  if (typeof window === "undefined") return null;
  const proto = window.location.protocol === "https:" ? "wss" : "ws";
  return `${proto}://${window.location.host}/ws/monitor`;
}

/** Same token every REST call already sends via the axios interceptor
 * (see lib/axios.ts) - mock email in dev-auth-disabled mode, else the
 * Supabase access token. Resolved fresh on every connection attempt
 * (not once at mount) so a refreshed/rotated token is picked up on
 * reconnect too, and so a login/logout during the session's lifetime
 * is reflected on the next reconnect. Browsers can't set custom
 * headers on a WebSocket upgrade, so this is sent via the
 * Sec-WebSocket-Protocol list (see WS_AUTH_SUBPROTOCOL below) instead
 * of an Authorization header - and instead of the URL's `?token=`,
 * which - unlike the subprotocol list - ends up in server access
 * logs, proxy logs, and browser history. */
async function resolveAuthToken(): Promise<string | null> {
  if (isAuthDisabled) {
    return getMockEmail();
  }
  if (isSupabaseConfigured) {
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      return session?.access_token ?? null;
    } catch {
      return null;
    }
  }
  return null;
}

// Fixed marker the backend expects as the first offered subprotocol
// value, so it knows the second value is the token and can echo this
// one back as the accepted subprotocol (see /ws/monitor in main.py).
const WS_AUTH_SUBPROTOCOL = "access_token";

const HEARTBEAT_INTERVAL_MS = 15000;
const HEARTBEAT_TIMEOUT_MS = 10000;

// resolveAuthToken() awaits Supabase's getSession(), which normally
// settles fast (it's usually just a localStorage read) but isn't
// guaranteed to - and a network blip is exactly the kind of event
// that can also leave an in-flight Supabase call hanging. Without a
// bound, a stuck token lookup would leave `connecting` stuck `true`
// forever (see connect()), permanently wedging the reconnect loop:
// the socket would never even attempt to redial. Capped well under
// HEARTBEAT_INTERVAL_MS so a stuck lookup can't visibly stall
// reconnection. On timeout the attempt proceeds unauthenticated
// (same fallback `resolveWsBase`'s callers already use when there's
// no session) rather than blocking - worst case one attempt connects
// anonymously; the next attempt tries the token again.
const TOKEN_RESOLVE_TIMEOUT_MS = 4000;

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(fallback), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      () => {
        clearTimeout(timer);
        resolve(fallback);
      },
    );
  });
}

/** RTK Query tags backed by data that can go stale while the socket is
 * down (live positions/crowd levels/delay-driven schedule changes).
 * Static reference data (Trains, TrainRoutes) is deliberately left
 * out - it doesn't change on the timescale a reconnect gap matters
 * for, so refetching it on every reconnect would just be wasted load. */
const LIVE_SYNC_TAGS = ["Crowd", "LiveTrainPositions", "Schedules"] as const;

interface QueuedMessage {
  event: LiveEvent;
  data: unknown;
}

const MERGE_KEY_FIELD: Partial<Record<LiveEvent, string>> = {
  train_position: "train_id",
  crowd_update: "station_id",
};

function flushQueue(
  queue: QueuedMessage[],
  listenersRef: { current: Map<LiveEvent, Set<Listener>> },
) {
  if (queue.length === 0) return;

  const mergedByEvent = new Map<
    LiveEvent,
    { byKey: Map<unknown, unknown>; timestamp: unknown }
  >();
  const discrete: QueuedMessage[] = [];

  for (const msg of queue) {
    const keyField = MERGE_KEY_FIELD[msg.event];
    const data = msg.data as { updates?: unknown[]; timestamp?: unknown } | null;
    if (keyField && data && Array.isArray(data.updates)) {
      let bucket = mergedByEvent.get(msg.event);
      if (!bucket) {
        bucket = { byKey: new Map(), timestamp: data.timestamp };
        mergedByEvent.set(msg.event, bucket);
      }
      for (const update of data.updates) {
        const key = (update as Record<string, unknown>)[keyField];
        bucket.byKey.set(key, update);
      }
      bucket.timestamp = data.timestamp ?? bucket.timestamp;
    } else {
      discrete.push(msg);
    }
  }

  for (const [event, bucket] of mergedByEvent) {
    const listeners = listenersRef.current.get(event);
    if (!listeners || listeners.size === 0) continue;
    const payload = { updates: Array.from(bucket.byKey.values()), timestamp: bucket.timestamp };
    listeners.forEach((listener) => listener(payload));
  }

  for (const { event, data } of discrete) {
    const listeners = listenersRef.current.get(event);
    listeners?.forEach((listener) => listener(data));
  }
}

export function LiveSocketProvider({ children }: { children: ReactNode }) {
  const listenersRef = useRef<Map<LiveEvent, Set<Listener>>>(new Map());
  
  const [connectionStatus, setConnectionStatus] =
    useState<LiveConnectionStatus>("reconnecting");

  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    const base = resolveWsBase();
    if (!base) return;

    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      setConnectionStatus("offline");
    }

    let socket: WebSocket | null = null;
    
    let connecting = false;
    let cleanedUp = false;
    let retryDelayMs = 1000;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
    let heartbeatTimeoutTimer: ReturnType<typeof setTimeout> | null = null;

    let pendingMessages: QueuedMessage[] = [];
    let flushHandle: number | null = null;

    // The socket carries a limited, fixed set of live events
    // (crowd_update/train_position/delay_alert/...) pushed as deltas
    // on top of whatever a client already has - it was never designed
    // to also replay everything that happened while a given client
    // was disconnected. So a connection coming up by itself only
    // guarantees the transport is ready; it says nothing about
    // whether the data already sitting in the RTK Query cache and in
    // useApiData's cache (dashboards, alerts, notifications, ...)
    // still matches the server.
    //
    // This used to only run on an actual *reconnect* (skipped on the
    // very first connect of a page load), on the assumption that REST
    // data was just fetched fresh on mount and there was nothing to
    // resync yet. That assumption doesn't hold: resolving the auth
    // token (see resolveAuthToken/TOKEN_RESOLVE_TIMEOUT_MS) and
    // completing the WS upgrade takes noticeably longer than the
    // REST calls that fire in parallel on the same mount - e.g.
    // GET /auth/me right after login, which itself creates a
    // server-side "New login" notification and pushes it over this
    // same socket. If that push lands before the socket has finished
    // connecting, it's simply lost (no replay), and the dashboard
    // shows nothing new until the next poll tick or a full page
    // reload re-fetches everything from scratch - exactly the
    // "notifications only show up after I reload" symptom. Running
    // this resync on every successful open, first connect included,
    // closes that window: whatever happened while the socket was
    // still connecting gets pulled in immediately once it's ready.
    function resyncOnConnect() {
      dispatch(apiSlice.util.invalidateTags([...LIVE_SYNC_TAGS]));
      invalidateApiData();
    }

    function flushPending() {
      flushHandle = null;
      const queue = pendingMessages;
      pendingMessages = [];
      flushQueue(queue, listenersRef);
    }

    function scheduleFlush() {
      if (flushHandle !== null) return;
      flushHandle = requestAnimationFrame(flushPending);
    }

    function clearHeartbeat() {
      if (heartbeatTimer) clearInterval(heartbeatTimer);
      if (heartbeatTimeoutTimer) clearTimeout(heartbeatTimeoutTimer);
      heartbeatTimer = null;
      heartbeatTimeoutTimer = null;
    }

    function scheduleReconnect() {
      if (cleanedUp || retryTimer) return;
      retryTimer = setTimeout(() => {
        retryTimer = null;
        connect();
      }, retryDelayMs);
      retryDelayMs = Math.min(retryDelayMs * 2, 15000);
    }

    function startHeartbeat() {
      clearHeartbeat();
      heartbeatTimer = setInterval(() => {
        if (!socket || socket.readyState !== WebSocket.OPEN) return;
        try {
          socket.send(JSON.stringify({ type: "ping" }));
        } catch {
          
        }
        
        heartbeatTimeoutTimer = setTimeout(() => {
          socket?.close();
        }, HEARTBEAT_TIMEOUT_MS);
      }, HEARTBEAT_INTERVAL_MS);
    }

    async function connect() {
      if (connecting || cleanedUp) return;
      
      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        setConnectionStatus("offline");
        return;
      }

      connecting = true;

      // Resolved fresh on every attempt (not once at mount) so a
      // refreshed Supabase token is picked up on reconnect too.
      // Bounded (see TOKEN_RESOLVE_TIMEOUT_MS) so a hung lookup can't
      // wedge `connecting` open and stall reconnection indefinitely.
      const token = await withTimeout(resolveAuthToken(), TOKEN_RESOLVE_TIMEOUT_MS, null);
      if (cleanedUp) {
        connecting = false;
        return;
      }
      socket = token
        ? new WebSocket(base as string, [WS_AUTH_SUBPROTOCOL, token])
        : new WebSocket(base as string);

      socket.onopen = () => {
        connecting = false;
        retryDelayMs = 1000;
        setConnectionStatus("connected");
        startHeartbeat();
        // Always resync, including the first connect of this page
        // load - see the comment on resyncOnConnect for why the
        // first connect can't be skipped.
        resyncOnConnect();
      };

      socket.onmessage = (event) => {
        if (heartbeatTimeoutTimer) {
          clearTimeout(heartbeatTimeoutTimer);
          heartbeatTimeoutTimer = null;
        }
        let parsed: { event?: string; data?: unknown };
        try {
          parsed = JSON.parse(event.data);
        } catch {
          return;
        }
        const eventName = parsed.event as LiveEvent | undefined;
        if (!eventName) return;
        pendingMessages.push({ event: eventName, data: parsed.data });
        scheduleFlush();
      };

      socket.onclose = () => {
        connecting = false;
        clearHeartbeat();
        if (cleanedUp) return;
        
        setConnectionStatus(
          typeof navigator !== "undefined" && navigator.onLine === false
            ? "offline"
            : "reconnecting",
        );
        scheduleReconnect();
      };

      socket.onerror = () => {
        socket?.close();
      };
    }

    connect();

    function handleOnline() {
      retryDelayMs = 1000;
      if (retryTimer) {
        clearTimeout(retryTimer);
        retryTimer = null;
      }
      
      setConnectionStatus((current) => (current === "connected" ? current : "reconnecting"));
      if (!socket || socket.readyState === WebSocket.CLOSED) connect();
    }
    function handleOffline() {
      setConnectionStatus("offline");
    }
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      cleanedUp = true;
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (retryTimer) clearTimeout(retryTimer);
      if (flushHandle !== null) cancelAnimationFrame(flushHandle);
      pendingMessages = [];
      clearHeartbeat();
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

  const isConnected = connectionStatus === "connected";

  const value = useMemo(
    () => ({ subscribe, isConnected, connectionStatus }),
    [subscribe, isConnected, connectionStatus],
  );

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
