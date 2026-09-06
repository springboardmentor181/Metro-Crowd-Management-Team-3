import api from "@/lib/axios";
import type { Alert, AlertCreate, AlertResolvePayload, NotificationLog } from "@/lib/api/types";

export async function getAlerts(
  activeOnly = false,
  state?: string,
  signal?: AbortSignal,
): Promise<Alert[]> {
  const { data } = await api.get<Alert[]>("/api/v1/alerts/", {
    params: { ...(activeOnly ? { active_only: true } : {}), ...(state ? { state } : {}) },
    signal,
  });
  return data;
}

export async function createAlert(payload: AlertCreate): Promise<Alert> {
  const { data } = await api.post<Alert>("/api/v1/alerts/", payload);
  return data;
}

export async function resolveAlert(
  alertId: number,
  payload: AlertResolvePayload = { notify_on_resolve: true },
): Promise<Alert> {
  const { data } = await api.patch<Alert>(`/api/v1/alerts/${alertId}/resolve`, payload);
  return data;
}

export async function getAlertNotifications(
  alertId: number,
  signal?: AbortSignal,
): Promise<NotificationLog[]> {
  const { data } = await api.get<NotificationLog[]>(
    `/api/v1/alerts/${alertId}/notifications`,
    { signal },
  );
  return data;
}