"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { getCities } from "@/lib/api/meta";
import type { CityInfo } from "@/lib/api/types";

const STORAGE_KEY = "metroflow:selected-state";

interface StateContextValue {
  /**
   * Selected city (e.g. "Kolkata", "Pune"), or null for all cities.
   * Kept as `selectedState`/`setSelectedState` for backward compatibility
   * with every widget that already reads it (Crowd Heat Map, Passenger
   * Analytics, Train Frequency, Station Occupancy, Live Train Status),
   * and because the backend's `?state=` query param already accepts a
   * raw city name directly - no API changes needed for city filtering.
   */
  selectedState: string | null;
  setSelectedState: (city: string | null) => void;
  /** Every city that currently has station data seeded, driven straight
   * off the stations table - add a new city's rows and it shows up here
   * automatically, no code change required. */
  states: CityInfo[];
  loading: boolean;
  /** Metadata (station/train counts, data-sufficiency) for the selected city. */
  currentStateInfo: CityInfo | null;
}

const StateContext = createContext<StateContextValue | undefined>(undefined);

/**
 * Wraps the whole app so every dashboard widget can read which city
 * the user picked from the navbar and scope its API calls to it
 * (Crowd Heat Map, Passenger Analytics, Train Frequency, Station
 * Occupancy, Live Train Status - everything filters through this).
 */
export function StateProvider({ children }: { children: ReactNode }) {
  const [selectedState, setSelectedStateInternal] = useState<string | null>(null);
  const [states, setStates] = useState<CityInfo[]>([]);
  const [loading, setLoading] = useState(true);

  // Restore the last-selected city so it survives a refresh.
  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) setSelectedStateInternal(stored);
  }, []);

  useEffect(() => {
    let cancelled = false;

    // getCities() backs the "Not enough data for <city>" banner and
    // the whole state selector, so a single failed request used to
    // permanently empty `states` for the rest of the session (no
    // retry, no re-fetch) and the real error was swallowed - anyone
    // hitting a cold backend start, a dropped connection, or a
    // momentary 429/500 would see "0 seeded stations" even though the
    // data was actually there. Retry a few times with backoff before
    // giving up, and log the real error so it's visible in devtools
    // instead of silently disappearing.
    async function loadWithRetry(attempt = 0): Promise<void> {
      try {
        const data = await getCities();
        if (!cancelled) setStates(data);
      } catch (err) {
        if (cancelled) return;
        if (attempt < 3) {
          const delay = 500 * 2 ** attempt; // 500ms, 1s, 2s
          await new Promise((resolve) => setTimeout(resolve, delay));
          return loadWithRetry(attempt + 1);
        }
        console.error("Failed to load /meta/cities after retries:", err);
        setStates([]);
      }
    }

    setLoading(true);
    loadWithRetry().finally(() => {
      if (!cancelled) setLoading(false);
    });

    // Self-heal: if this tab is left open, periodically re-check for
    // fresh city data instead of trusting a single fetch forever.
    const revalidate = setInterval(() => {
      getCities()
        .then((data) => {
          if (!cancelled) setStates(data);
        })
        .catch((err) => {
          console.error("Background /meta/cities refresh failed:", err);
        });
    }, 60_000);

    return () => {
      cancelled = true;
      clearInterval(revalidate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setSelectedState(city: string | null) {
    setSelectedStateInternal(city);
    if (city) {
      window.localStorage.setItem(STORAGE_KEY, city);
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }

  const currentStateInfo = states.find((s) => s.city === selectedState) ?? null;

  return (
    <StateContext.Provider
      value={{ selectedState, setSelectedState, states, loading, currentStateInfo }}
    >
      {children}
    </StateContext.Provider>
  );
}

export function useSelectedState() {
  const ctx = useContext(StateContext);
  if (!ctx) {
    throw new Error("useSelectedState must be used within a StateProvider");
  }
  return ctx;
}
