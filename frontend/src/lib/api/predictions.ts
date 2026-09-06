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