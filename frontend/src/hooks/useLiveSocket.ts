"use client";

import { useEffect, useRef } from "react";

import { useLiveSocketContext } from "@/providers/LiveSocketProvider";
import type { Notification } from "@/lib/api/types";

export type LiveEvent =
  | "crowd_update"
  | "train_position"
  | "delay_alert"
  | "station_alert"
  | "schedule_update"
  | "notification"
  | "notification_read"
  | "notification_all_read";

export interface CrowdUpdatePayload {
  updates: {
    station_id: number;
    station_code?: string;
    station_name: string;
    current_count: number;
    crowd_level: string;
    source_timestamp?: string;
  }[];
  timestamp: string;
}

export interface TrainPositionPayload {
  updates: {
    train_id: number;
    train_number: string;
    from_station_id: number;
    from_station_name: string | null;
    to_station_id: number;
    to_station_name: string | null;
    progress_ratio: number;
    delay_minutes: number;
    status: string;
    eta_seconds: number | null;
    segment_duration_seconds: number | null;
    direction: number;
  }[];
  timestamp: string;
}

export interface DelayAlertPayload {
  schedule_id: number;
  train_id: number;
  train_number: string | null;
  station_id: number;
  station_name: string | null;
  delay_minutes: number;
  status: string;
}

export interface StationAlertPayload {
  alert_id: number;
  station_id: number;
  station_name: string | null;
  alert_type: string;
  message: string;
  available_until: string | null;
  is_resolved: boolean;
  created_at: string | null;
}

export interface NotificationReadPayload {
  id: number;
}

type PayloadFor<E extends LiveEvent> = E extends "crowd_update"
  ? CrowdUpdatePayload
  : E extends "train_position"
    ? TrainPositionPayload
    : E extends "delay_alert"
      ? DelayAlertPayload
      : E extends "station_alert"
        ? StationAlertPayload
        : E extends "notification"
          ? Notification
          : E extends "notification_read"
            ? NotificationReadPayload
            : unknown;

type Handlers = { [E in LiveEvent]?: (data: PayloadFor<E>) => void };

export function useLiveSocket(handlers: Handlers) {
  const { subscribe, isConnected } = useLiveSocketContext();
  const handlersRef = useRef(handlers);

  useEffect(() => {
    handlersRef.current = handlers;
  });

  useEffect(() => {
    const events = Object.keys(handlersRef.current) as LiveEvent[];
    const unsubscribers = events.map((event) =>
      subscribe(event, (data) => {
        // `event` here is the whole `LiveEvent` union, not the specific
        // literal each handler expects, so TS can't narrow `data` to the
        // matching PayloadFor<E> on its own. `never` (rather than `any`)
        // is assignable to every handler's parameter type without
        // widening the type-checking anywhere else in this file - the
        // actual guarantee that `data` really matches `event`'s payload
        // shape comes from the server always sending the two paired
        // together (see PayloadFor<E> above for the real mapping).
        handlersRef.current[event]?.(data as never);
      }),
    );
    return () => unsubscribers.forEach((unsub) => unsub());
    
  }, [subscribe]);

  return { isConnected };
}