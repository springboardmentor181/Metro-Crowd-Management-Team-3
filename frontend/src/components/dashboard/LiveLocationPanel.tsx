"use client";

import { useMemo, useState } from "react";
import { Search, X, LocateFixed, Navigation } from "lucide-react";

import { useStations } from "@/hooks/useStations";
import { useFocusedStation } from "@/providers/FocusedStationProvider";

export default function LiveLocationPanel() {
  const { data: allStations } = useStations();
  const { focusedStation, setFocusedStation, liveLocationOn, toggleLiveLocation } =
    useFocusedStation();
  const [query, setQuery] = useState("");

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return (allStations ?? [])
      .filter((s) => s.station_name.toLowerCase().includes(q))
      .slice(0, 8);
  }, [allStations, query]);

  function pickStation(station: NonNullable<typeof allStations>[number]) {
    setFocusedStation({
      id: station.id,
      name: station.station_name,
      city: station.city,
      latitude: station.latitude,
      longitude: station.longitude,
      line_name: station.line_name,
      line_color: station.line_color,
      station_order: station.station_order,
    });
    setQuery("");
  }

  return (
    <div className="rounded-2xl border border-border bg-background p-5">
      <div className="mb-4 flex items-center gap-2">
        <Search size={16} className="text-muted" />
        <h3 className="font-bold">Find your station</h3>
      </div>

      {focusedStation ? (
        <div className="flex items-center justify-between rounded-xl border border-primary/40 bg-primary/10 px-3 py-2.5 text-sm font-semibold">
          <span className="truncate">{focusedStation.name}</span>
          <button
            type="button"
            onClick={() => setFocusedStation(null)}
            title="Clear station"
            className="ml-2 shrink-0 text-muted hover:text-foreground"
          >
            <X size={15} />
          </button>
        </div>
      ) : (
        <div className="relative">
          <div className="flex items-center rounded-xl border border-border bg-card px-3">
            <Search size={15} className="text-muted" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search your station..."
              className="h-10 w-full bg-transparent px-2.5 text-sm outline-none"
            />
          </div>

          {matches.length > 0 && (
            <ul className="absolute z-30 mt-1.5 w-full overflow-hidden rounded-xl border border-border bg-card shadow-xl">
              {matches.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => pickStation(s)}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted"
                  >
                    <span className="font-medium">{s.station_name}</span>
                    <span className="text-xs text-muted">{s.city}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={toggleLiveLocation}
        disabled={!focusedStation}
        className={`
        mt-4 flex w-full items-center justify-between rounded-xl border px-3.5 py-3 text-sm font-semibold transition
        disabled:cursor-not-allowed disabled:opacity-40
        ${
          liveLocationOn
            ? "border-orange-500/40 bg-orange-500/10 text-orange-500"
            : "border-border bg-card text-muted hover:text-foreground"
        }
        `}
      >
        <span className="flex items-center gap-2">
          <LocateFixed size={16} className={liveLocationOn ? "animate-pulse" : ""} />
          Live Location
        </span>
        <span
          className={`
          relative h-5 w-9 shrink-0 rounded-full transition
          ${liveLocationOn ? "bg-orange-500" : "bg-border"}
          `}
        >
          <span
            className={`
            absolute top-0.5 h-4 w-4 rounded-full bg-white transition
            ${liveLocationOn ? "left-4" : "left-0.5"}
            `}
          />
        </span>
      </button>

      <p className="mt-3 flex items-start gap-1.5 text-xs leading-5 text-muted">
        <Navigation size={13} className="mt-0.5 shrink-0" />
        {!focusedStation
          ? "Pick a station to trace its real track."
          : liveLocationOn
            ? "Showing your real line only - stations, trains and crowding along this track."
            : "Turn on to switch from the full network to just this line's real track."}
      </p>
    </div>
  );
}
