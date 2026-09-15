"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { getCities } from "@/lib/api/meta";
import type { CityInfo } from "@/lib/api/types";

const STORAGE_KEY = "metroflow:selected-state";

interface StateContextValue {
  
  selectedState: string | null;
  setSelectedState: (city: string | null) => void;
  
  states: CityInfo[];
  loading: boolean;
  
  currentStateInfo: CityInfo | null;
}

const StateContext = createContext<StateContextValue | undefined>(undefined);

export function StateProvider({ children }: { children: ReactNode }) {
  const [selectedState, setSelectedStateInternal] = useState<string | null>(null);
  const [states, setStates] = useState<CityInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) setSelectedStateInternal(stored);
  }, []);

  useEffect(() => {
    let cancelled = false;
    
    let lastAttemptFailed = false;

    async function loadWithRetry(attempt = 0): Promise<void> {
      try {
        const data = await getCities();
        if (!cancelled) setStates(data);
        lastAttemptFailed = false;
      } catch (err) {
        if (cancelled) return;
        if (attempt < 3) {
          const delay = 500 * 2 ** attempt; 
          await new Promise((resolve) => setTimeout(resolve, delay));
          return loadWithRetry(attempt + 1);
        }
        console.error("Failed to load /meta/cities after retries:", err);
        setStates([]);
        lastAttemptFailed = true;
      }
    }

    setLoading(true);
    loadWithRetry().finally(() => {
      if (!cancelled) setLoading(false);
    });

    const revalidate = setInterval(() => {
      getCities()
        .then((data) => {
          if (!cancelled) setStates(data);
          if (lastAttemptFailed) {
            console.info("/meta/cities reachable again - backend connection restored.");
          }
          lastAttemptFailed = false;
        })
        .catch((err) => {
          if (!lastAttemptFailed) {
            
            console.error("Background /meta/cities refresh failed:", err);
          }
          lastAttemptFailed = true;
        });
    }, 60_000);

    return () => {
      cancelled = true;
      clearInterval(revalidate);
    };
    
  }, []);

  const setSelectedState = useCallback((city: string | null) => {
    setSelectedStateInternal(city);
    if (city) {
      window.localStorage.setItem(STORAGE_KEY, city);
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const currentStateInfo = useMemo(
    () => states.find((s) => s.city === selectedState) ?? null,
    [states, selectedState],
  );

  const value = useMemo(
    () => ({ selectedState, setSelectedState, states, loading, currentStateInfo }),
    [selectedState, setSelectedState, states, loading, currentStateInfo],
  );

  return (
    <StateContext.Provider value={value}>
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