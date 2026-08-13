"use client";

import { useState, type FormEvent } from "react";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Clock3,
  Loader2,
  Mail,
  MailWarning,
  MessageSquare,
  Wrench,
  Info,
} from "lucide-react";

import { Button } from "@/components/ui/Button";
import { useApiData } from "@/hooks/useApiData";
import { useStations } from "@/hooks/useStations";
import { useAuth } from "@/providers/AuthProvider";
import { useSelectedState } from "@/providers/StateProvider";
import {
  getAlerts,
  createAlert,
  resolveAlert,
  getAlertNotifications,
} from "@/lib/api/alerts";
import type { AlertType, NotificationLog } from "@/lib/api/types";

const ALERT_TYPES: { value: AlertType; label: string }[] = [
  { value: "overcrowding", label: "Overcrowding" },
  { value: "delay", label: "Delay" },
  { value: "emergency", label: "Emergency" },
  { value: "maintenance", label: "Maintenance" },
  { value: "info", label: "Info" },
];

function alertIcon(type: AlertType) {
  switch (type) {
    case "overcrowding":
      return <AlertTriangle className="text-red-500" size={20} />;
    case "emergency":
      return <AlertTriangle className="text-red-500" size={20} />;
    case "delay":
      return <Clock3 className="text-orange-500" size={20} />;
    case "maintenance":
      return <Wrench className="text-orange-500" size={20} />;
    default:
      return <Info className="text-primary" size={20} />;
  }
}

/** Small expandable panel showing per-recipient email + SMS delivery
 * status for one alert - fetched on demand so the Alerts page doesn't
 * hit this endpoint for every alert on every load. */
function DeliveryStatus({ alertId }: { alertId: number }) {
  const [open, setOpen] = useState(false);
  const [logs, setLogs] = useState<NotificationLog[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (!open && logs === null) {
      setLoading(true);
      try {
        const data = await getAlertNotifications(alertId);
        setLogs(data);
      } finally {
        setLoading(false);
      }
    }
    setOpen((v) => !v);
  }

  const emailLogs = logs?.filter((l) => l.channel === "email") ?? [];
  const smsLogs = logs?.filter((l) => l.channel === "sms") ?? [];

  function summary(rows: NotificationLog[]) {
    const sent = rows.filter((l) => l.status === "sent").length;
    const failed = rows.filter((l) => l.status === "failed").length;
    return { sent, failed, total: rows.length };
  }

  const emailSummary = summary(emailLogs);
  const smsSummary = summary(smsLogs);

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={toggle}
        className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
      >
        <Mail size={12} />
        {open ? "Hide delivery status" : "View notification delivery status"}
      </button>

      {open && (
        <div className="mt-2 space-y-3 rounded-xl border border-border bg-muted/30 p-3 text-xs">
          {loading ? (
            <p className="text-muted">Loading...</p>
          ) : !logs || logs.length === 0 ? (
            <p className="text-muted">
              No notification was sent for this alert (both email and SMS were
              off, or there were no active users with an email/phone on
              file).
            </p>
          ) : (
            <>
              {emailLogs.length > 0 && (
                <div>
                  <p className="mb-1 flex items-center gap-1.5 font-semibold text-muted-foreground">
                    <Mail size={12} />
                    Email: {emailSummary.sent} sent
                    {emailSummary.failed > 0 ? `, ${emailSummary.failed} failed` : ""}{" "}
                    of {emailSummary.total}
                  </p>
                  <ul className="space-y-1 pl-4">
                    {emailLogs.map((log) => (
                      <li key={log.id} className="flex items-center gap-2">
                        {log.status === "sent" ? (
                          <CheckCircle2 size={12} className="shrink-0 text-emerald-500" />
                        ) : (
                          <MailWarning size={12} className="shrink-0 text-red-500" />
                        )}
                        <span className="truncate">{log.recipient}</span>
                        {log.status === "failed" && log.error_message && (
                          <span className="truncate text-red-500">
                            - {log.error_message}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {smsLogs.length > 0 && (
                <div>
                  <p className="mb-1 flex items-center gap-1.5 font-semibold text-muted-foreground">
                    <MessageSquare size={12} />
                    SMS: {smsSummary.sent} sent
                    {smsSummary.failed > 0 ? `, ${smsSummary.failed} failed` : ""} of{" "}
                    {smsSummary.total}
                  </p>
                  <ul className="space-y-1 pl-4">
                    {smsLogs.map((log) => (
                      <li key={log.id} className="flex items-center gap-2">
                        {log.status === "sent" ? (
                          <CheckCircle2 size={12} className="shrink-0 text-emerald-500" />
                        ) : (
                          <MailWarning size={12} className="shrink-0 text-red-500" />
                        )}
                        <span className="truncate">{log.recipient}</span>
                        {log.status === "failed" && log.error_message && (
                          <span className="truncate text-red-500">
                            - {log.error_message}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function AlertsManager() {
  const { profile } = useAuth();
  const canManage = profile?.role === "admin" || profile?.role === "operator";
  const { selectedState } = useSelectedState();

  const [activeOnly, setActiveOnly] = useState(true);
  const alerts = useApiData(
    () => getAlerts(activeOnly, selectedState ?? undefined),
    [activeOnly, selectedState],
  );
  const { data: stations } = useStations();
  const stationById = new Map((stations ?? []).map((s) => [s.id, s]));

  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [stationId, setStationId] = useState<number | "">("");
  const [alertType, setAlertType] = useState<AlertType>("info");
  const [message, setMessage] = useState("");
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifySms, setNotifySms] = useState(true);

  const [resolvingId, setResolvingId] = useState<number | null>(null);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!stationId || !message.trim()) {
      setFormError("Pick a station and enter a message.");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    setFormSuccess(null);
    try {
      await createAlert({
        station_id: stationId,
        alert_type: alertType,
        message: message.trim(),
        notify_email: notifyEmail,
        notify_sms: notifySms,
      });
      setMessage("");
      setStationId("");
      setAlertType("info");
      const channels = [
        notifyEmail ? "email" : null,
        notifySms ? "SMS" : null,
      ].filter(Boolean);
      setFormSuccess(
        channels.length > 0
          ? `Alert published. ${channels.join(" + ")} notifications are being sent now.`
          : "Alert published (no notifications sent).",
      );
      setFormOpen(false);
      alerts.refresh();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Could not create the alert.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResolve(id: number) {
    setResolvingId(id);
    try {
      await resolveAlert(id);
      alerts.refresh();
    } finally {
      setResolvingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-border bg-card p-6">
        <div>
          <h2 className="text-lg font-bold">Alert Log</h2>
          <p className="mt-1 text-sm text-muted">
            Overcrowding, delays, emergencies and maintenance notices raised
            by admins and operators.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-muted">
            <input
              type="checkbox"
              className="rounded"
              checked={activeOnly}
              onChange={(e) => setActiveOnly(e.target.checked)}
            />
            Active only
          </label>

          {canManage && (
            <Button size="sm" onClick={() => setFormOpen((v) => !v)}>
              <Bell size={16} />
              {formOpen ? "Cancel" : "Raise Alert"}
            </Button>
          )}
        </div>
      </div>

      {formSuccess && (
        <p className="rounded-xl bg-emerald-500/10 p-3 text-sm text-emerald-600">
          {formSuccess}
        </p>
      )}

      {formOpen && canManage && (
        <form
          onSubmit={handleCreate}
          className="space-y-4 rounded-3xl border border-border bg-card p-6"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Station</label>
              <select
                value={stationId}
                onChange={(e) =>
                  setStationId(e.target.value ? Number(e.target.value) : "")
                }
                className="h-12 w-full rounded-xl border border-border bg-card px-4 text-sm outline-none focus:border-primary"
              >
                <option value="">Select a station</option>
                {(stations ?? []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.station_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Alert type</label>
              <select
                value={alertType}
                onChange={(e) => setAlertType(e.target.value as AlertType)}
                className="h-12 w-full rounded-xl border border-border bg-card px-4 text-sm outline-none focus:border-primary"
              >
                {ALERT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="e.g. Platform 2 closed for maintenance until 6 PM."
              className="w-full rounded-xl border border-border bg-card p-4 text-sm outline-none focus:border-primary"
            />
          </div>

          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm text-muted">
              <input
                type="checkbox"
                className="rounded"
                checked={notifyEmail}
                onChange={(e) => setNotifyEmail(e.target.checked)}
              />
              <Mail size={14} />
              Email active users
            </label>

            <label className="flex items-center gap-2 text-sm text-muted">
              <input
                type="checkbox"
                className="rounded"
                checked={notifySms}
                onChange={(e) => setNotifySms(e.target.checked)}
              />
              <MessageSquare size={14} />
              SMS users with a phone on file
            </label>
          </div>

          {formError && (
            <p className="rounded-xl bg-red-500/10 p-3 text-sm text-red-500">
              {formError}
            </p>
          )}

          <Button type="submit" disabled={submitting}>
            {submitting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Bell size={16} />
            )}
            {submitting ? "Publishing..." : "Publish Alert"}
          </Button>
        </form>
      )}

      <div className="rounded-3xl border border-border bg-card p-6">
        {alerts.loading ? (
          <p className="text-sm text-muted">Loading alerts...</p>
        ) : alerts.error ? (
          <p className="text-sm text-red-500">{alerts.error}</p>
        ) : (alerts.data ?? []).length === 0 ? (
          <div className="rounded-2xl border border-border p-6 text-center">
            <CheckCircle2 className="mx-auto text-emerald-500" size={24} />
            <p className="mt-3 text-sm text-muted">
              {activeOnly
                ? "No active alerts - everything is operating normally."
                : "No alerts have been raised yet."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {(alerts.data ?? []).map((alert) => (
              <div
                key={alert.id}
                className="flex items-start justify-between gap-4 rounded-2xl border border-border p-5 transition hover:border-primary"
              >
                <div className="flex-1 flex items-start gap-3">
                  {alertIcon(alert.alert_type)}
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-semibold">
                        {stationById.get(alert.station_id)?.station_name ??
                          `Station #${alert.station_id}`}
                      </h4>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold capitalize text-muted-foreground">
                        {alert.alert_type}
                      </span>
                      {alert.is_resolved && (
                        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-500">
                          Resolved
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-muted">{alert.message}</p>
                    <p className="mt-1 text-xs text-muted">
                      {new Date(alert.created_at).toLocaleString()}
                    </p>

                    {canManage && <DeliveryStatus alertId={alert.id} />}
                  </div>
                </div>

                {canManage && !alert.is_resolved && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleResolve(alert.id)}
                    disabled={resolvingId === alert.id}
                  >
                    {resolvingId === alert.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <CheckCircle2 size={14} />
                    )}
                    Resolve
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}