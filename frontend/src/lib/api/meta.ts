import api from "@/lib/axios";
import type { CityInfo, StateInfo } from "@/lib/api/types";

export async function getStates(signal?: AbortSignal): Promise<StateInfo[]> {
  const { data } = await api.get<StateInfo[]>("/api/v1/meta/states", { signal });
  return data;
}

export async function getCities(signal?: AbortSignal): Promise<CityInfo[]> {
  const { data } = await api.get<CityInfo[]>("/api/v1/meta/cities", { signal });
  return data;
}

export interface NearestCityResult {
  city: string;
  state: string | null;
  distance_km: number;
}

export async function getNearestCity(
  lat: number,
  lng: number,
  signal?: AbortSignal,
): Promise<NearestCityResult> {
  const { data } = await api.get<NearestCityResult>("/api/v1/meta/nearest-city", {
    params: { lat, lng },
    signal,
  });
  return data;
}
