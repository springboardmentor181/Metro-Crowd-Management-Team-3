
"use client";

import { useState } from "react";
import { LogIn, LogOut, MapPin, Ticket } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { useApiData } from "@/hooks/useApiData";
import { useStations } from "@/hooks/useStations";
import { checkIn, checkOut, getActiveJourney } from "@/lib/api/journeys";
import { queryKeys } from "@/lib/queryKeys";

export default function CheckInOutCard() {
  const {
    data: stations,
    loading: stationsLoading,
    error: stationsError,
    refresh: refreshStations,
  } = useStations();
  const {
    data: activeJourney,
    loading: journeyLoading,
    error: journeyError,
    refresh: refreshJourney,
  } = useApiData(queryKeys.activeJourney, getActiveJourney, []);

  const [sourceId, setSourceId] = useState<number | "">("");
  const [destinationId, setDestinationId] = useState<number | "">("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFare, setLastFare] = useState<number | null>(null);

  const stationName = (id: number) =>
    stations?.find((s) => s.id === id)?.station_name ?? `Station ${id}`;

  async function handleCheckIn() {
    if (sourceId === "" || destinationId === "") {
      setError("Pick both a source and destination station.");
      return;
    }
    if (sourceId === destinationId) {
      setError("Source and destination must be different stations.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await checkIn({
        source_station_id: sourceId,
        destination_station_id: destinationId,
      });
      setLastFare(null);
      await refreshJourney();
    } catch {
      setError("Couldn't check in - try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCheckOut() {
    if (!activeJourney) return;
    setSubmitting(true);
    setError(null);
    try {
      const completed = await checkOut(activeJourney.id);
      setLastFare(completed.fare);
      await refreshJourney();
    } catch {
      setError("Couldn't check out - try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const loading = stationsLoading || journeyLoading;

  return (
    <section className="rounded-3xl border border-border bg-card p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Check In / Check Out</h2>
          <p className="mt-2 text-muted">
            Buy a ticket and check in - your journey adds to the live crowd
            count at each station in real time, same as the AI-driven
            simulator.
          </p>
        </div>
        <div className="rounded-xl bg-primary/10 p-3">
          <Ticket className="text-primary" size={28} />
        </div>
      </div>

      {error && (
        <p className="mb-6 rounded-xl bg-red-500/10 p-3 text-sm text-red-500">{error}</p>
      )}

      {

}
      {!loading && stationsError && !stations?.length && (
        <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
          <p className="text-sm text-amber-600">
            Couldn&apos;t load the station list - {stationsError}
          </p>
          <Button onClick={refreshStations} className="mt-3" variant="secondary" size="sm">
            Retry
          </Button>
        </div>
      )}
      {!loading && journeyError && (
        <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
          <p className="text-sm text-amber-600">
            Couldn&apos;t confirm whether you have an active journey - {journeyError}
          </p>
          <Button onClick={refreshJourney} className="mt-3" variant="secondary" size="sm">
            Retry
          </Button>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted">Loading...</p>
      ) : activeJourney ? (
        <div className="space-y-6">
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6">
            <div className="flex items-center gap-3 text-primary">
              <MapPin size={20} />
              <p className="font-semibold">
                Checked in at {stationName(activeJourney.source_station_id)}
              </p>
            </div>
            <p className="mt-2 text-sm text-muted">
              Heading to {stationName(activeJourney.destination_station_id)}
            </p>
          </div>

          <Button onClick={handleCheckOut} disabled={submitting} className="w-full">
            <LogOut size={18} />
            {submitting ? "Checking out..." : "Check Out"}
          </Button>
        </div>
      ) : (
        <div className="space-y-5">
          {lastFare !== null && (
            <p className="rounded-xl bg-emerald-500/10 p-3 text-sm text-emerald-500">
              Checked out - fare: ₹{lastFare.toFixed(2)}
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-muted">
                From
              </span>
              <select
                value={sourceId}
                onChange={(e) =>
                  setSourceId(e.target.value ? Number(e.target.value) : "")
                }
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm"
              >
                <option value="">Select station</option>
                {stations?.map((station) => (
                  <option key={station.id} value={station.id}>
                    {station.station_name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-muted">
                To
              </span>
              <select
                value={destinationId}
                onChange={(e) =>
                  setDestinationId(e.target.value ? Number(e.target.value) : "")
                }
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm"
              >
                <option value="">Select station</option>
                {stations?.map((station) => (
                  <option key={station.id} value={station.id}>
                    {station.station_name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <Button onClick={handleCheckIn} disabled={submitting} className="w-full">
            <LogIn size={18} />
            {submitting ? "Checking in..." : "Check In"}
          </Button>
        </div>
      )}
    </section>
  );
}
