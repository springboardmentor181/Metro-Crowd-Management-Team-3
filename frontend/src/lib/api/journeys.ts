import api from "@/lib/axios";
import type { CheckInRequest, Journey } from "@/lib/api/types";

export async function checkIn(payload: CheckInRequest): Promise<Journey> {
  const { data } = await api.post<Journey>("/api/v1/checkin/", payload);
  return data;
}

export async function checkOut(journeyId: number): Promise<Journey> {
  const { data } = await api.post<Journey>("/api/v1/checkout/", {
    journey_id: journeyId,
  });
  return data;
}

export async function getActiveJourney(signal?: AbortSignal): Promise<Journey | null> {
  const { data } = await api.get<Journey | null>("/api/v1/checkout/active", { signal });
  return data;
}
