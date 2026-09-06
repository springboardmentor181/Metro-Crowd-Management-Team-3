import api from "@/lib/axios";
import type {
  Notification,
  NotificationSource,
  NotificationUnreadCount,
} from "@/lib/api/types";

export async function getNotifications(
  source?: NotificationSource,
  unreadOnly = false,
  signal?: AbortSignal,
  state?: string,
): Promise<Notification[]> {
  const { data } = await api.get<Notification[]>("/api/v1/notifications/", {
    params: {
      ...(source ? { source } : {}),
      ...(unreadOnly ? { unread_only: true } : {}),
      ...(state ? { state } : {}),
    },
    signal,
  });
  return data;
}

export async function getUnreadCount(
  signal?: AbortSignal,
  state?: string,
): Promise<NotificationUnreadCount> {
  const { data } = await api.get<NotificationUnreadCount>(
    "/api/v1/notifications/unread-count",
    { signal, params: state ? { state } : undefined },
  );
  return data;
}

export async function markNotificationRead(notificationId: number): Promise<Notification> {
  const { data } = await api.patch<Notification>(
    `/api/v1/notifications/${notificationId}/read`,
  );
  return data;
}

export async function markAllNotificationsRead(): Promise<NotificationUnreadCount> {
  const { data } = await api.patch<NotificationUnreadCount>(
    "/api/v1/notifications/read-all",
  );
  return data;
}
