"use client";

import { useApiData } from "@/hooks/useApiData";
import { getStations } from "@/lib/api/stations";
import { useSelectedState } from "@/providers/StateProvider";
import { queryKeys } from "@/lib/queryKeys";
import type { Station } from "@/lib/api/types";

const stationsCache = new Map<string, Station[]>();

export function useStations() {
  const { selectedState } = useSelectedState();
  const cacheKey = selectedState ?? "__all__";

  const result = useApiData(
    queryKeys.stations,
    (signal) =>
      getStations(undefined, selectedState ?? undefined, signal).then((stations) => {
        stationsCache.set(cacheKey, stations);
        return stations;
      }),
    [selectedState],
  );

  const data = result.data ?? stationsCache.get(cacheKey) ?? null;

  return { ...result, data };
}
