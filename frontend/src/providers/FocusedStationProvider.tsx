"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

export interface FocusedStation {
  id: number;
  name: string;
  city: string;
  latitude: number;
  longitude: number;
  
  line_name?: string | null;
  line_color?: string | null;
  station_order?: number | null;
}

interface FocusedStationContextValue {
  focusedStation: FocusedStation | null;
  setFocusedStation: (station: FocusedStation | null) => void;
  
  liveLocationOn: boolean;
  setLiveLocationOn: (on: boolean) => void;
  toggleLiveLocation: () => void;
}

const FocusedStationContext = createContext<FocusedStationContextValue | undefined>(
  undefined,
);

export function FocusedStationProvider({ children }: { children: ReactNode }) {
  const [focusedStation, setFocusedStationState] = useState<FocusedStation | null>(null);
  const [liveLocationOn, setLiveLocationOnState] = useState(false);

  const setFocusedStation = useCallback((station: FocusedStation | null) => {
    setFocusedStationState(station);
    
    if (!station) setLiveLocationOnState(false);
  }, []);

  const setLiveLocationOn = useCallback((on: boolean) => {
    setLiveLocationOnState(on);
  }, []);

  const toggleLiveLocation = useCallback(() => {
    setLiveLocationOnState((v) => !v);
  }, []);

  return (
    <FocusedStationContext.Provider
      value={{
        focusedStation,
        setFocusedStation,
        liveLocationOn,
        setLiveLocationOn,
        toggleLiveLocation,
      }}
    >
      {children}
    </FocusedStationContext.Provider>
  );
}

export function useFocusedStation() {
  const ctx = useContext(FocusedStationContext);
  if (!ctx) {
    throw new Error("useFocusedStation must be used within a FocusedStationProvider");
  }
  return ctx;
}
