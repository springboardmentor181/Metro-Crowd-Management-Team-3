"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, LocateFixed, MapPin, TriangleAlert } from "lucide-react";

import { getNearestCity } from "@/lib/api/meta";
import { useSelectedState } from "@/providers/StateProvider";

type GeoStatus = "idle" | "locating" | "denied" | "unavailable" | "no-match";

export default function StateSelector() {
  const { selectedState, setSelectedState, states, loading, currentStateInfo } =
    useSelectedState();
  const [open, setOpen] = useState(false);
  const [geoStatus, setGeoStatus] = useState<GeoStatus>("idle");
  const ref = useRef<HTMLDivElement>(null);

  function useMyLocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoStatus("unavailable");
      return;
    }

    setGeoStatus("locating");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { city } = await getNearestCity(
            position.coords.latitude,
            position.coords.longitude,
          );
          setSelectedState(city);
          setGeoStatus("idle");
          setOpen(false);
        } catch (err) {
          console.error("Failed to resolve nearest city:", err);
          setGeoStatus("no-match");
        }
      },
      (error) => {
        console.error("Geolocation permission error:", error);
        setGeoStatus(error.code === error.PERMISSION_DENIED ? "denied" : "unavailable");
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
    );
  }

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const label = selectedState ?? "All Cities";
  const insufficientData =
    !!selectedState && !!currentStateInfo && !currentStateInfo.has_sufficient_data;

  return (
    <div
      ref={ref}
      className="relative"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-12 items-center gap-2 rounded-2xl border border-border bg-card px-4 text-sm font-semibold transition hover:border-primary"
      >
        <MapPin
          size={18}
          className="text-primary"
        />

        <span className="hidden sm:inline">{label}</span>

        {insufficientData && (
          <TriangleAlert
            size={16}
            className="text-amber-500"
          />
        )}

        <ChevronDown
          size={16}
          className={`text-muted transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 max-h-96 w-72 overflow-y-auto rounded-2xl border border-border bg-card p-2 shadow-2xl">

          <button
            type="button"
            onClick={useMyLocation}
            disabled={geoStatus === "locating"}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-primary transition hover:bg-muted disabled:cursor-wait disabled:opacity-60"
          >
            <LocateFixed
              size={16}
              className={geoStatus === "locating" ? "animate-pulse" : ""}
            />
            {geoStatus === "locating" ? "Finding your city..." : "Use my location"}
          </button>

          {geoStatus === "denied" && (
            <p className="px-3 pb-1 text-xs text-amber-500">
              Location permission denied - enable it in your browser/OS settings to auto-pick your city.
            </p>
          )}
          {geoStatus === "unavailable" && (
            <p className="px-3 pb-1 text-xs text-amber-500">
              Location isn&apos;t available on this device/browser.
            </p>
          )}
          {geoStatus === "no-match" && (
            <p className="px-3 pb-1 text-xs text-amber-500">
              Couldn&apos;t match your location to a seeded city.
            </p>
          )}

          <div className="my-2 h-px bg-border" />

          <button
            type="button"
            onClick={() => {
              setSelectedState(null);
              setOpen(false);
            }}
            className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition hover:bg-muted"
          >
            <span className="font-semibold">All Cities</span>
            {selectedState === null && (
              <Check
                size={16}
                className="text-primary"
              />
            )}
          </button>

          <div className="my-2 h-px bg-border" />

          {loading && (
            <p className="px-3 py-2 text-sm text-muted">Loading cities...</p>
          )}

          {!loading && states.length === 0 && (
            <p className="px-3 py-2 text-sm text-muted">No cities available yet.</p>
          )}

          {

}
          {states.map((c) => (
            <button
              key={c.city}
              type="button"
              onClick={() => {
                setSelectedState(c.city);
                setOpen(false);
              }}
              className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition hover:bg-muted"
            >
              <span>
                <span className="font-semibold">{c.city}</span>
                {c.state && (
                  <span className="ml-2 text-xs text-muted">{c.state}</span>
                )}
              </span>

              <span className="flex items-center gap-2">
                <span className="text-xs text-muted">{c.station_count} stations</span>
                {!c.has_sufficient_data && (
                  <TriangleAlert
                    size={14}
                    className="text-amber-500"
                  />
                )}
                {selectedState === c.city && (
                  <Check
                    size={16}
                    className="text-primary"
                  />
                )}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
