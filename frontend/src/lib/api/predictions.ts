import api from "@/lib/axios";
import type {
  CrowdModelMetrics,
  Prediction,
  RegressionModelMetrics,
  SmartRecommendation,
  TrafficPatternResponse,
} from "@/lib/api/types";

export async function predictCrowd(stationId: number): Promise<Prediction> {
  const { data } = await api.post<Prediction>("/api/v1/predictions/crowd", {
    station_id: stationId,
  });
  return data;
}

export async function getCrowdModelMetrics(signal?: AbortSignal): Promise<CrowdModelMetrics> {
  const { data } = await api.get<CrowdModelMetrics>(
    "/api/v1/predictions/crowd/metrics",
    { signal },
  );
  return data;
}

export async function forecastDemand(
  stationId: number,
  hoursAhead = 6,
): Promise<Prediction[]> {
  const { data } = await api.post<Prediction[]>("/api/v1/predictions/demand", {
    station_id: stationId,
    hours_ahead: hoursAhead,
  });
  return data;
}

export async function predictDelay(
  trainId: number,
  stationId: number,
): Promise<Prediction> {
  const { data } = await api.post<Prediction>("/api/v1/predictions/delay", {
    train_id: trainId,
    station_id: stationId,
  });
  return data;
}

export async function getDelayModelMetrics(signal?: AbortSignal): Promise<RegressionModelMetrics> {
  const { data } = await api.get<RegressionModelMetrics>(
    "/api/v1/predictions/delay/metrics",
    { signal },
  );
  return data;
}

export async function recommendFrequency(
  stationId: number,
  isPeakHour = false,
): Promise<Prediction> {
  const { data } = await api.post<Prediction>("/api/v1/predictions/frequency", {
    station_id: stationId,
    is_peak_hour: isPeakHour,
  });
  return data;
}

export async function getFrequencyModelMetrics(signal?: AbortSignal): Promise<RegressionModelMetrics> {
  const { data } = await api.get<RegressionModelMetrics>(
    "/api/v1/predictions/frequency/metrics",
    { signal },
  );
  return data;
}

export async function getTrafficPattern(
  stationId: number,
  signal?: AbortSignal,
): Promise<TrafficPatternResponse> {
  const { data } = await api.get<TrafficPatternResponse>(
    `/api/v1/predictions/traffic-pattern/${stationId}`,
    { signal },
  );
  return data;
}

export async function getAggregateTrafficPattern(
  state: string | undefined,
  signal?: AbortSignal,
): Promise<TrafficPatternResponse> {
  const { data } = await api.get<TrafficPatternResponse>(
    "/api/v1/predictions/traffic-pattern-aggregate/all",
    { params: state ? { state } : undefined, signal },
  );
  return data;
}

export async function getRecommendations(
  stationId: number,
  signal?: AbortSignal,
): Promise<SmartRecommendation[]> {
  const { data } = await api.get<SmartRecommendation[]>(
    `/api/v1/predictions/recommendations/${stationId}`,
    { signal },
  );
  return data;
}

/**
 * Bulk version of getRecommendations() - fetches recommendations for
 * many stations in ONE request instead of one request per station.
 *
 * Phase 1 (P0-1) fix: AIInsights.tsx used to call getRecommendations()
 * once per ranked station (up to 15) via Promise.all() on every
 * refresh, which blew straight through the backend's 20/minute rate
 * limit. This calls the new `/recommendations/bulk` endpoint instead,
 * so N stations cost exactly 1 rate-limited call.
 *
 * The backend returns a JSON object keyed by station id (JSON object
 * keys are always strings, hence `Record<string, ...>` here) - this
 * function converts that back into a `Map<number, ...>` keyed by the
 * numeric station id for convenience at the call site.
 */
export async function getRecommendationsBulk(
  stationIds: number[],
  signal?: AbortSignal,
): Promise<Map<number, SmartRecommendation[]>> {
  if (stationIds.length === 0) return new Map();

  const { data } = await api.get<Record<string, SmartRecommendation[]>>(
    "/api/v1/predictions/recommendations/bulk",
    { params: { station_ids: stationIds.join(",") }, signal },
  );

  return new Map(
    Object.entries(data).map(([stationId, recs]) => [Number(stationId), recs]),
  );
}