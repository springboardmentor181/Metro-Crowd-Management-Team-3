"use client";

import { useEffect, useRef, useState } from "react";

interface UseApiDataResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
  /** Wall-clock time (Date.now()) of the most recent successful fetch,
   * updated on every completed poll/refresh - including ones where the
   * payload was byte-for-byte identical and `data` therefore kept its
   * previous reference (see deepEqual below). Consumers that show a
   * "synced Xs ago" / "updated Xs ago" indicator should key off this
   * instead of a timestamp field embedded in `data`, since that field
   * can freeze for a long time whenever the underlying value legitimately
   * stops changing - freshness of our connection to the server is a
   * different thing from freshness of the value itself. */
  lastFetchedAt: number | null;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const dataCache = new Map<string, CacheEntry<unknown>>();
const inFlight = new Map<string, Promise<unknown>>();

/** Module-scope resync bus. useApiData's cache (above) is its own data
 * layer, entirely separate from the RTK Query cache in store/apiSlice.ts
 * - components that read alerts/notifications/etc. through this hook
 * (AlertsManager, NotificationCenter, ...) have no RTK tags to
 * invalidate. Previously there was no way to tell an already-mounted
 * useApiData consumer "your cached data may be stale, reload" from
 * outside the hook itself: refresh() is only reachable by the
 * component that owns that particular hook instance. That meant a
 * WebSocket reconnect (see LiveSocketProvider.tsx) had no way to make
 * these consumers catch back up on whatever changed while the socket
 * was down - they'd sit on stale data, silently drifting from the
 * server, until an unrelated poll tick or a full browser refresh.
 * invalidateApiData() lets any caller (just LiveSocketProvider today)
 * broadcast "reload" to every currently-mounted useApiData instance;
 * each one re-runs its own fetcher against the live cacheKey it's
 * already using, so this stays correct across param/state changes. */
type InvalidateListener = () => void;
const invalidateListeners = new Set<InvalidateListener>();

export function invalidateApiData(): void {
  for (const listener of invalidateListeners) listener();
}

interface ControllerEntry {
  controller: AbortController;
  refCount: number;
}
const controllers = new Map<string, ControllerEntry>();

function retain(key: string): AbortController {
  let entry = controllers.get(key);
  if (!entry) {
    entry = { controller: new AbortController(), refCount: 0 };
    controllers.set(key, entry);
  }
  entry.refCount += 1;
  return entry.controller;
}

function release(key: string) {
  const entry = controllers.get(key);
  if (!entry) return;
  entry.refCount -= 1;
  if (entry.refCount <= 0) {
    
    entry.controller.abort();
    controllers.delete(key);
  }
}

function isAbortError(err: unknown): boolean {
  if (err instanceof DOMException && err.name === "AbortError") return true;
  if (typeof err === "object" && err !== null) {
    const code = (err as { code?: string }).code;
    if (code === "ERR_CANCELED") return true;
  }
  return false;
}

function makeCacheKey(key: string, deps: unknown[]): string {
  return `${key}::${JSON.stringify(deps)}`;
}

/** Structural equality for the plain JSON payloads this hook deals in
 * (dashboards, lists, metrics objects - no functions/class instances/
 * cyclic refs). Every poll tick previously called setData(result) with
 * a brand-new object literal from JSON parsing, so components re-rendered
 * on every 5s/15s/30s tick even when the server returned byte-for-byte
 * identical data (which, for most polled endpoints here, is most ticks).
 * This lets load() below detect "nothing actually changed" and keep the
 * previous object reference, so React's setState bails out and dependent
 * components/useMemo/useEffect don't re-run for a no-op poll. */
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) {
    return false;
  }
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }
  const aObj = a as Record<string, unknown>;
  const bObj = b as Record<string, unknown>;
  const aKeys = Object.keys(aObj);
  const bKeys = Object.keys(bObj);
  if (aKeys.length !== bKeys.length) return false;
  for (const key of aKeys) {
    if (!Object.prototype.hasOwnProperty.call(bObj, key)) return false;
    if (!deepEqual(aObj[key], bObj[key])) return false;
  }
  return true;
}

export function useApiData<T>(
  key: string,
  fetcher: (signal: AbortSignal) => Promise<T>,
  deps: unknown[] = [],
  intervalMs?: number,
): UseApiDataResult<T> {
  const cacheKey = makeCacheKey(key, deps);
  const cachedEntry = dataCache.get(cacheKey) as CacheEntry<T> | undefined;

  const [data, setData] = useState<T | null>(cachedEntry ? cachedEntry.data : null);
  const [loading, setLoading] = useState(!cachedEntry);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const [lastFetchedAt, setLastFetchedAt] = useState<number | null>(
    cachedEntry ? cachedEntry.timestamp : null,
  );
  const keyRef = useRef(cacheKey);
  
  const prevCacheKeyRef = useRef<string | null>(null);

  const fetcherRef = useRef(fetcher);
  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  // Reload (without clearing already-shown data / flipping back to a
  // loading spinner - same "silent refresh" path a normal poll tick
  // takes) whenever invalidateApiData() fires. See its definition
  // above for why this exists.
  useEffect(() => {
    const listener: InvalidateListener = () => setTick((t) => t + 1);
    invalidateListeners.add(listener);
    return () => {
      invalidateListeners.delete(listener);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    keyRef.current = cacheKey;

    const keyChanged = prevCacheKeyRef.current !== cacheKey;
    prevCacheKeyRef.current = cacheKey;

    if (keyChanged) {
      const entry = dataCache.get(cacheKey) as CacheEntry<T> | undefined;
      if (entry) {
        setData(entry.data);
        setLoading(false);
        setError(null);
      } else {
        setLoading(true);
      }
    }

    const controller = retain(cacheKey);

    let retried = false;

    function load() {
      let promise = inFlight.get(cacheKey) as Promise<T> | undefined;
      if (!promise) {
        promise = fetcherRef.current(controller.signal);
        inFlight.set(cacheKey, promise);
        
        promise
          .finally(() => {
            if (inFlight.get(cacheKey) === promise) inFlight.delete(cacheKey);
          })
          .catch(() => {});
      }

      promise
        .then((result) => {
          // Keep the previous reference when the new payload is
          // structurally identical, so setData below is a no-op
          // (Object.is bail-out) instead of forcing a re-render for
          // data that hasn't actually changed - see deepEqual above.
          const prevEntry = dataCache.get(cacheKey) as CacheEntry<T> | undefined;
          const nextData =
            prevEntry && deepEqual(prevEntry.data, result) ? prevEntry.data : result;
          const fetchedAt = Date.now();
          dataCache.set(cacheKey, { data: nextData, timestamp: fetchedAt });
          if (!cancelled && keyRef.current === cacheKey) {
            setData(nextData);
            setLoading(false);
            setError(null);
            // Always bump this, even when nextData is the same reference
            // as before - a completed, unchanged poll still means "we
            // just confirmed with the server", which is what a "synced
            // Xs ago" indicator should reflect.
            setLastFetchedAt(fetchedAt);
          }
        })
        .catch((err) => {
          
          if (isAbortError(err)) {
            
            if (!cancelled && keyRef.current === cacheKey && !retried) {
              retried = true;
              load();
            }
            return;
          }
          if (!cancelled && keyRef.current === cacheKey) {
            setError(
              err instanceof Error ? err.message : "Failed to load data.",
            );
            setLoading(false);
          }
        });
    }

    load();

    let poll: ReturnType<typeof setInterval> | undefined;
    function startPolling() {
      if (!intervalMs || intervalMs <= 0 || poll) return;
      poll = setInterval(load, intervalMs);
    }
    function stopPolling() {
      if (poll) clearInterval(poll);
      poll = undefined;
    }
    function handleVisibilityChange() {
      if (document.hidden) {
        stopPolling();
      } else {
        load();
        startPolling();
      }
    }

    if (intervalMs && intervalMs > 0) {
      if (typeof document === "undefined" || !document.hidden) startPolling();
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }

    return () => {
      cancelled = true;
      stopPolling();
      if (intervalMs && intervalMs > 0) {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      }
      
      release(cacheKey);
    };
    
  }, [cacheKey, tick, intervalMs]);

  return {
    data,
    loading,
    error,
    refresh: () => setTick((t) => t + 1),
    lastFetchedAt,
  };
}

export function prefetchApiData<T>(
  key: string,
  fetcher: (signal: AbortSignal) => Promise<T>,
  deps: unknown[] = [],
  maxAgeMs = 15_000,
): void {
  if (typeof window === "undefined") return;

  const cacheKey = makeCacheKey(key, deps);

  const cached = dataCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < maxAgeMs) return;
  if (inFlight.has(cacheKey)) return;

  const controller = new AbortController();
  const promise = fetcher(controller.signal);
  inFlight.set(cacheKey, promise);
  promise
    .then((result) => {
      dataCache.set(cacheKey, { data: result, timestamp: Date.now() });
    })
    .catch(() => {
      
    })
    .finally(() => {
      if (inFlight.get(cacheKey) === promise) inFlight.delete(cacheKey);
    });
}