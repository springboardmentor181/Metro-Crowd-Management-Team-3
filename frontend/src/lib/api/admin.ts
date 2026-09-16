import api from "@/lib/axios";

export interface SimulatorStatus {
  crowd_simulator_running: boolean;
  train_tracker_running: boolean;
}

export async function getSimulatorStatus(signal?: AbortSignal): Promise<SimulatorStatus> {
  const { data } = await api.get<SimulatorStatus>("/api/v1/admin/simulator", { signal });
  return data;
}

export async function startSimulator(): Promise<{ crowd_simulator_running: boolean }> {
  const { data } = await api.post("/api/v1/admin/simulator/start");
  return data;
}

export async function stopSimulator(): Promise<{ crowd_simulator_running: boolean }> {
  const { data } = await api.post("/api/v1/admin/simulator/stop");
  return data;
}

export interface SystemLogEntry {
  id: string;
  timestamp: string;
  level: "DEBUG" | "INFO" | "WARNING" | "ERROR" | "CRITICAL";
  logger: string;
  message: string;
}

export interface SystemLogsResponse {
  logs: SystemLogEntry[];
  counts: Record<string, number>;
}

export async function getSystemLogs(
  limit = 100,
  level?: string,
  signal?: AbortSignal,
): Promise<SystemLogsResponse> {
  const { data } = await api.get<SystemLogsResponse>("/api/v1/admin/logs", {
    params: { limit, ...(level ? { level } : {}) },
    signal,
  });
  return data;
}

export interface SystemStatus {
  app_name: string;
  app_version: string;
  database: { connected: boolean };
  redis: { connected: boolean; state: string };
  crowd_simulator_running: boolean;
  train_tracker_running: boolean;
  scheduler: {
    crowd_simulator: { running: boolean; state: string; error?: string };
    train_tracker: { running: boolean; state: string; error?: string };
  };
  websocket_connections: number;
  log_counts: Record<string, number>;
  timestamp: string;
}

export async function getSystemStatus(signal?: AbortSignal): Promise<SystemStatus> {
  const { data } = await api.get<SystemStatus>("/api/v1/admin/system-status", { signal });
  return data;
}
