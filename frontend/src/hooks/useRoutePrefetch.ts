"use client";

import { useCallback, useRef } from "react";

import { useSelectedState } from "@/providers/StateProvider";
import { apiSlice } from "@/store/apiSlice";
import { prefetchApiData } from "@/hooks/useApiData";
import { queryKeys } from "@/lib/queryKeys";
import { getTrains } from "@/lib/api/trains";
import { getSchedules } from "@/lib/api/schedules";
import { getCrowdDashboard } from "@/lib/api/crowd";
import { getActiveJourney } from "@/lib/api/journeys";
import { getStations } from "@/lib/api/stations";

export type PrefetchableRoute =
  | "/live-trains"
  | "/analytics"
  | "/checkin-checkout"
  | "/train-scheduling";

const PREFETCHABLE_ROUTES: ReadonlySet<string> = new Set([
  "/live-trains",
  "/analytics",
  "/checkin-checkout",
  "/train-scheduling",
]);

export function isPrefetchableRoute(href: string): href is PrefetchableRoute {
  return PREFETCHABLE_ROUTES.has(href);
}

const HOVER_DEBOUNCE_MS = 120;

const PREFETCH_COOLDOWN_MS = 15_000;

export function useRoutePrefetch() {
  const { selectedState } = useSelectedState();
  const prefetchLiveTrainPositions = apiSlice.usePrefetch("getLiveTrainPositions");
  const prefetchTrainRoutes = apiSlice.usePrefetch("getTrainRoutes");

  const hoverTimers = useRef<Partial<Record<PrefetchableRoute, ReturnType<typeof setTimeout>>>>({});
  const lastFired = useRef<Partial<Record<PrefetchableRoute, number>>>({});

  return useCallback(
    (route: PrefetchableRoute) => {
      const existingTimer = hoverTimers.current[route];
      if (existingTimer) clearTimeout(existingTimer);

      hoverTimers.current[route] = setTimeout(() => {
        const now = Date.now();
        const last = lastFired.current[route] ?? 0;
        if (now - last < PREFETCH_COOLDOWN_MS) return;
        lastFired.current[route] = now;

        const state = selectedState ?? undefined;

        switch (route) {
          case "/live-trains":
            
            prefetchLiveTrainPositions(state, { ifOlderThan: 10 });
            prefetchTrainRoutes(state, { ifOlderThan: 3600 });
            
            prefetchApiData(
              queryKeys.schedules,
              (signal) => getSchedules({ state }, signal),
              [selectedState],
            );
            prefetchApiData(
              queryKeys.trains,
              (signal) => getTrains(state, signal),
              [selectedState],
            );
            prefetchApiData(
              queryKeys.crowdDashboard,
              (signal) => getCrowdDashboard(state, signal),
              [selectedState],
            );
            break;

          case "/analytics":
            
            prefetchApiData(
              queryKeys.stations,
              (signal) => getStations(undefined, state, signal),
              [selectedState],
            );
            prefetchApiData(
              queryKeys.crowdDashboard,
              (signal) => getCrowdDashboard(state, signal),
              [selectedState],
            );
            break;

          case "/checkin-checkout":
            
            prefetchApiData(queryKeys.activeJourney, (signal) => getActiveJourney(signal), []);
            prefetchApiData(
              queryKeys.stations,
              (signal) => getStations(undefined, state, signal),
              [selectedState],
            );
            break;

          case "/train-scheduling":
            
            prefetchApiData(
              queryKeys.trains,
              (signal) => getTrains(state, signal),
              [selectedState],
            );
            prefetchApiData(
              queryKeys.schedules,
              (signal) => getSchedules({ state }, signal),
              [selectedState],
            );
            prefetchApiData(
              queryKeys.crowdDashboard,
              (signal) => getCrowdDashboard(state, signal),
              [selectedState],
            );
            prefetchApiData(
              queryKeys.stations,
              (signal) => getStations(undefined, state, signal),
              [selectedState],
            );
            break;
        }
      }, HOVER_DEBOUNCE_MS);
    },
    [selectedState, prefetchLiveTrainPositions, prefetchTrainRoutes],
  );
}
