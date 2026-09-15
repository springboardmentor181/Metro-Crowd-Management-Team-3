"use client";

import { useMemo } from "react";
import type { Station } from "@/lib/api/types";
import type { FocusedStation } from "@/providers/FocusedStationProvider";

const STATIONS_BEFORE = 7;
const STATIONS_AFTER = 7;
const WINDOW_SIZE = STATIONS_BEFORE + STATIONS_AFTER + 1;

export function useStationRoute(
  stations: Station[] | null | undefined,
  focusedStation: FocusedStation | null,
  active: boolean,
) {
  return useMemo(() => {
    if (!active || !focusedStation || !stations || stations.length === 0) {
      return { routeStations: [] as Station[], lineName: null as string | null, lineColor: null as string | null };
    }

    const self = stations.find((s) => s.id === focusedStation.id);
    const lineName = focusedStation.line_name ?? self?.line_name ?? null;
    const lineColor = focusedStation.line_color ?? self?.line_color ?? "#22c55e";

    if (!lineName) {
      return { routeStations: [] as Station[], lineName: null as string | null, lineColor: null as string | null };
    }

    const fullLine = stations
      .filter((s) => s.line_name === lineName)
      .sort((a, b) => (a.station_order ?? 0) - (b.station_order ?? 0));

    const centerIndex = fullLine.findIndex((s) => s.id === focusedStation.id);
    if (centerIndex === -1) {
      
      return { routeStations: fullLine, lineName, lineColor };
    }

    let start = centerIndex - STATIONS_BEFORE;
    let end = centerIndex + STATIONS_AFTER + 1; 

    if (start < 0) {
      end = Math.min(fullLine.length, end - start);
      start = 0;
    }
    if (end > fullLine.length) {
      start = Math.max(0, start - (end - fullLine.length));
      end = fullLine.length;
    }
    
    end = Math.min(end, start + WINDOW_SIZE, fullLine.length);

    const routeStations = fullLine.slice(start, end);

    return { routeStations, lineName, lineColor };
  }, [stations, focusedStation, active]);
}
