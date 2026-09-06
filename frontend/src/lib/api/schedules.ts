import api from "@/lib/axios";
import type { ScheduleStatus, TrainSchedule, UpcomingScheduleEntry } from "@/lib/api/types";

export async function getUpcomingSchedules(
  state?: string,
  status?: ScheduleStatus,
  limit = 20,
  signal?: AbortSignal,
): Promise<UpcomingScheduleEntry[]> {
  const { data } = await api.get<UpcomingScheduleEntry[]>("/api/v1/schedules/upcoming", {
    params: {
      ...(state ? { state } : {}),
      ...(status ? { status } : {}),
      limit,
    },
    signal,
  });
  return data;
}

export async function getSchedules(
  params?: {
    station_id?: number;
    train_id?: number;
    state?: string;
  },
  signal?: AbortSignal,
): Promise<TrainSchedule[]> {
  const { data } = await api.get<TrainSchedule[]>("/api/v1/schedules/", { params, signal });
  return data;
}

export async function getPeakHourSchedules(
  stationId?: number,
  state?: string,
  signal?: AbortSignal,
): Promise<TrainSchedule[]> {
  const { data } = await api.get<TrainSchedule[]>("/api/v1/schedules/peak-hours", {
    params: { ...(stationId ? { station_id: stationId } : {}), ...(state ? { state } : {}) },
    signal,
  });
  return data;
}

export async function getDelayedSchedules(
  stationId?: number,
  state?: string,
  signal?: AbortSignal,
  limit: number = 50,
): Promise<TrainSchedule[]> {
  const { data } = await api.get<TrainSchedule[]>("/api/v1/schedules/delayed", {
    params: {
      ...(stationId ? { station_id: stationId } : {}),
      ...(state ? { state } : {}),
      limit,
    },
    signal,
  });
  return data;
}

export async function getDelayedSchedulesCount(
  stationId?: number,
  state?: string,
  signal?: AbortSignal,
): Promise<number> {
  const { data } = await api.get<{ count: number }>("/api/v1/schedules/delayed/count", {
    params: { ...(stationId ? { station_id: stationId } : {}), ...(state ? { state } : {}) },
    signal,
  });
  return data.count;
}

export async function reportDelay(
  scheduleId: number,
  delayMinutes: number,
  reason?: string,
): Promise<TrainSchedule> {
  const { data } = await api.patch<TrainSchedule>(
    `/api/v1/schedules/${scheduleId}/delay`,
    { delay_minutes: delayMinutes, reason },
  );
  return data;
}

export async function adjustFrequency(
  scheduleId: number,
  frequencyMinutes: number,
  isPeakHour?: boolean,
): Promise<TrainSchedule> {
  const { data } = await api.patch<TrainSchedule>(
    `/api/v1/schedules/${scheduleId}/frequency`,
    { frequency_minutes: frequencyMinutes, is_peak_hour: isPeakHour },
  );
  return data;
}