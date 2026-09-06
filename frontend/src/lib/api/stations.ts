import api from "@/lib/axios";
import type { Station } from "@/lib/api/types";

export async function getStations(
  city?: string,
  state?: string,
  signal?: AbortSignal,
): Promise<Station[]> {
  const { data } = await api.get<Station[]>("/api/v1/stations/", {
    params: { ...(city ? { city } : {}), ...(state ? { state } : {}) },
    signal,
  });
  return data;
}
