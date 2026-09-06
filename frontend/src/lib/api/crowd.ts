import api from "@/lib/axios";
import type {
  CrowdHeatmapPoint,
  CrowdSnapshot,
  InflowOutflow,
  StationMonitorEntry,
  StationAnalytics,
} from "@/lib/api/types";

export async function getCrowdDashboard(
  state?: string,
  signal?: AbortSignal,
): Promise<CrowdSnapshot[]> {
  const { data } = await api.get<CrowdSnapshot[]>("/api/v1/crowd/dashboard", {
    params: state ? { state } : undefined,
    signal,
  });
  return data;
}

export async function getCrowdHeatmap(
  state?: string,
  limit?: number,
  signal?: AbortSignal,
): Promise<CrowdHeatmapPoint[]> {
  const params: Record<string, string | number> = {};
  if (state) params.state = state;
  if (limit) params.limit = limit;
  const { data } = await api.get<CrowdHeatmapPoint[]>("/api/v1/crowd/heatmap", {
    params: Object.keys(params).length ? params : undefined,
    signal,
  });
  return data;
}

export async function getInflowOutflow(
  stationId: number,
  hours = 24,
  signal?: AbortSignal,
): Promise<InflowOutflow> {
  const { data } = await api.get<InflowOutflow>(
    `/api/v1/crowd/${stationId}/inflow-outflow`,
    { params: { hours }, signal },
  );
  return data;
}

export async function getStationMonitor(
  state?: string,
  hours = 1,
  signal?: AbortSignal,
): Promise<StationMonitorEntry[]> {
  const { data } = await api.get<StationMonitorEntry[]>("/api/v1/crowd/station-monitor", {
    params: { ...(state ? { state } : {}), hours },
    signal,
  });
  return data;
}

export async function getStationAnalytics(
  stationId: number,
  signal?: AbortSignal,
): Promise<StationAnalytics> {
  const { data } = await api.get<StationAnalytics>(
    `/api/v1/crowd/${stationId}/analytics`,
    { signal },
  );
  return data;
}
