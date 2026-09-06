import api from "@/lib/axios";
import type { LiveTrainPosition, Train } from "@/lib/api/types";

export async function getTrains(state?: string, signal?: AbortSignal): Promise<Train[]> {
  const { data } = await api.get<Train[]>("/api/v1/trains/", {
    params: state ? { state } : undefined,
    signal,
  });
  return data;
}

export async function getLiveTrainPositions(
  state?: string,
  signal?: AbortSignal,
): Promise<LiveTrainPosition[]> {
  const { data } = await api.get<LiveTrainPosition[]>("/api/v1/trains/live", {
    params: state ? { state } : undefined,
    signal,
  });
  return data;
}
