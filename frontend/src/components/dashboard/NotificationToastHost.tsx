"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { AlertOctagon, Mail, Newspaper, Radio, X } from "lucide-react";

import { useLiveSocket } from "@/hooks/useLiveSocket";
import { useSelectedState } from "@/providers/StateProvider";
import type { Notification, NotificationSource } from "@/lib/api/types";

/** How long a toast stays on screen before it auto-dismisses itself -
 * same idea as a phone/browser push notification. */
const TOAST_DURATION_MS = 7000;
/** Don't let the stack grow unbounded if a burst of notifications
 * arrives at once (e.g. several stations go critical back to back). */
const MAX_VISIBLE_TOASTS = 4;

function sourceMeta(source: NotificationSource) {
  switch (source) {
    case "email":
      return { label: "Email", icon: Mail, color: "bg-blue-500/10 text-blue-500" };
    case "operator":
      return { label: "Operator", icon: Radio, color: "bg-orange-500/10 text-orange-500" };
    case "system_failure":
      return {
        label: "System failure",
        icon: AlertOctagon,
        color: "bg-red-500/10 text-red-500",
      };
    default:
      return { label: "System", icon: Newspaper, color: "bg-emerald-500/10 text-emerald-500" };
  }
}

interface ToastItem extends Notification {
  /** Unique per *appearance*, not per notification row - if the same
   * row could ever arrive twice this still keys uniquely in React. */
  toastId: string;
}

/** Global toast popup host for live notifications - login, delay,
 * overcrowding, operator alerts, etc. Mount once near the root of the
 * authenticated app (inside LiveSocketProvider) so it's visible on
 * every page, not just the Notifications screen. Renders nothing
 * until a "notification" event actually arrives over the socket.
 *
 * Notifications tied to a specific city/state (Notification.state,
 * e.g. an overcrowding alert for a Kolkata station) only surface here
 * when that's the currently selected state - global ones
 * (state === null, e.g. login notices, system announcements) always
 * show regardless. This is what keeps the stack from filling up with
 * every other city's alerts while you're looking at just one. */
export default function NotificationToastHost() {
  const { selectedState } = useSelectedState();
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((toastId: string) => {
    setToasts((current) => current.filter((t) => t.toastId !== toastId));
    const timer = timers.current.get(toastId);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(toastId);
    }
  }, []);

  useLiveSocket({
    notification: (payload) => {
      const matchesState = !payload.state || !selectedState || payload.state === selectedState;
      if (!matchesState) return;

      const toastId = `${payload.id}-${Date.now()}`;
      setToasts((current) => [{ ...payload, toastId }, ...current].slice(0, MAX_VISIBLE_TOASTS));
      const timer = setTimeout(() => dismiss(toastId), TOAST_DURATION_MS);
      timers.current.set(toastId, timer);
    },
  });

  if (toasts.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed right-4 top-24 z-[100] w-[calc(100%-2rem)] max-w-sm sm:right-6"
      style={{ height: 88 + (toasts.length - 1) * 14 }}
    >
      {toasts.map((toast, index) => {
        const { label, icon: Icon, color } = sourceMeta(toast.source);
        // Stacked-deck effect: the newest toast (index 0) sits fully
        // on top; each older one behind it is nudged down/scaled
        // slightly and dimmed, so they read as a card stack rather
        // than a plain vertical list.
        const depth = index;
        const isTop = depth === 0;
        return (
          <div
            key={toast.toastId}
            className="notification-toast pointer-events-auto absolute inset-x-0 top-0 origin-top overflow-hidden rounded-2xl border border-border bg-card/95 shadow-2xl backdrop-blur-xl transition-all duration-300 ease-out"
            style={{
              transform: `translateY(${depth * 14}px) scale(${1 - depth * 0.045})`,
              zIndex: MAX_VISIBLE_TOASTS - depth,
              opacity: isTop ? 1 : 1 - depth * 0.18,
              filter: isTop ? "none" : `brightness(${1 - depth * 0.06})`,
            }}
          >
            <Link
              href="/notifications"
              onClick={() => dismiss(toast.toastId)}
              className="flex items-start gap-3 p-4 pr-9"
            >
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${color}`}>
                <Icon size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-semibold">{toast.title}</p>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-muted-foreground">
                    {label}
                  </span>
                  {toast.state && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-primary">
                      {toast.state}
                    </span>
                  )}
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-muted">{toast.message}</p>
              </div>
            </Link>

            {isTop && (
              <button
                type="button"
                onClick={() => dismiss(toast.toastId)}
                aria-label="Dismiss notification"
                className="absolute right-2.5 top-2.5 rounded-lg p-1 text-muted transition hover:bg-muted hover:text-foreground"
              >
                <X size={14} />
              </button>
            )}

            {isTop && (
              <div className="h-0.5 w-full bg-muted/40">
                <div
                  className="notification-toast-progress h-full bg-primary"
                  style={{ animationDuration: `${TOAST_DURATION_MS}ms` }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export { sourceMeta as toastSourceMeta };
