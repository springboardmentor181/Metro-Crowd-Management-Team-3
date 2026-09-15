import api from "@/lib/axios";
import type { OperationalSummary, PassengerFlowOverview, Prediction, TrafficReport } from "@/lib/api/types";

export async function getTrafficReport(
  hours = 24,
  state?: string,
  signal?: AbortSignal,
): Promise<TrafficReport> {
  const { data } = await api.get<TrafficReport>("/api/v1/analytics/traffic-report", {
    params: { hours, ...(state ? { state } : {}) },
    signal,
  });
  return data;
}

export async function getOperationalSummary(
  state?: string,
  signal?: AbortSignal,
): Promise<OperationalSummary> {
  const { data } = await api.get<OperationalSummary>("/api/v1/analytics/operational-summary", {
    params: state ? { state } : undefined,
    signal,
  });
  return data;
}

export async function getPredictionInsights(
  limit = 20,
  state?: string,
  signal?: AbortSignal,
): Promise<Prediction[]> {
  const { data } = await api.get<Prediction[]>("/api/v1/analytics/prediction-insights", {
    params: { limit, ...(state ? { state } : {}) },
    signal,
  });
  return data;
}

export async function getPassengerFlowOverview(
  hours = 24,
  state?: string,
  topN = 8,
  signal?: AbortSignal,
): Promise<PassengerFlowOverview> {
  const { data } = await api.get<PassengerFlowOverview>(
    "/api/v1/analytics/passenger-flow-overview",
    {
      params: { hours, top_n: topN, ...(state ? { state } : {}) },
      signal,
    },
  );
  return data;
}