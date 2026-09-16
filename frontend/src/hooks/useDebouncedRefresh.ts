"use client";

import { useCallback, useEffect, useRef } from "react";

/**
 * Returns a stable wrapper around `fn` that collapses repeated calls
 * arriving within `delayMs` of each other into a single trailing-edge
 * invocation (always using the most recently passed-in `fn`, so it
 * never calls a stale closure even though the returned function's own
 * identity never changes).
 *
 * Why this exists: several distinct live-socket events (see
 * useLiveSocket.ts) can each map to the same underlying REST resource
 * - e.g. delay_alert/train_position/schedule_update all ultimately
 * meaning "the schedules table may have changed". Those events come
 * from independently-scheduled backend tick loops (crowd + train
 * simulators, see the backend's app/simulator/scheduler.py, both on
 * their own ~5s cadence) and from per-row broadcasts (a single tick
 * that delays several trains fires one DELAY_ALERT per schedule row),
 * so it's normal for 2-5 of these to land within the same second.
 * Wiring every one straight to `someQuery.refresh()`/`.refetch()`
 * meant a single real change on the backend could still trigger
 * several redundant fetches of the exact same data in quick
 * succession. Debouncing the refresh call (not the event handling
 * itself - every event is still received and can still drive local
 * state immediately where a component does that) collapses that
 * burst into one fetch, and resolves well within the dashboard's
 * ~5-10s live-update cadence, so data still refreshes automatically
 * with no page refresh needed.
 */
export function useDebouncedRefresh(fn: () => void, delayMs = 600): () => void {
  const fnRef = useRef(fn);
  useEffect(() => {
    fnRef.current = fn;
  });

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return useCallback(
    () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        fnRef.current();
      }, delayMs);
    },
    [delayMs],
  );
}
