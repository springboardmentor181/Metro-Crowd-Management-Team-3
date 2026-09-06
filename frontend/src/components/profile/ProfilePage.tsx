"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  CheckCircle2,
  Edit3,
  LocateFixed,
  Mail,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  TrainFront,
  UserCircle2,
  X,
} from "lucide-react";
import Input from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import { updateProfile } from "@/lib/api/auth";
import { useAuth } from "@/providers/AuthProvider";
import { metroCities } from "./metroLocations";
import PhoneVerification from "./PhoneVerification";

type LocationStatus =
  | "idle"
  | "requesting"
  | "granted"
  | "denied"
  | "unsupported";

export default function ProfilePage() {
  
  const { profile, loading: profileLoading, refresh } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedCity, setSelectedCity] = useState(metroCities[1].city);
  const [selectedStation, setSelectedStation] = useState(
    metroCities[1].stations[0],
  );
  const [isEditing, setIsEditing] = useState(false);
  const [isMetaLoading, setIsMetaLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingLocation, setIsSavingLocation] = useState(false);
  const [message, setMessage] = useState("");
  const [locationMessage, setLocationMessage] = useState("");
  const [savedProfile, setSavedProfile] = useState({
    fullName: "",
    email: "",
    phone: "",
    selectedCity: metroCities[1].city,
    selectedStation: metroCities[1].stations[0],
  });
  const [locationStatus, setLocationStatus] =
    useState<LocationStatus>("idle");
  const [locationText, setLocationText] = useState(
    "Use current mobile location to suggest nearest metro station.",
  );

  const isLoading = profileLoading || isMetaLoading;

  const selectedMetro = useMemo(
    () =>
      metroCities.find((metroCity) => metroCity.city === selectedCity) ??
      metroCities[0],
    [selectedCity],
  );

  useEffect(() => {
    if (!profile) return;

    setFullName(profile.full_name);
    setEmail(profile.email ?? "");
    setPhone(profile.phone ?? "");
    setSavedProfile((current) => ({
      ...current,
      fullName: profile.full_name,
      email: profile.email ?? "",
      phone: profile.phone ?? "",
    }));
  }, [profile]);

  // Metro city/station preference (Supabase-only field, not tracked by
  // the backend) loaded separately from user_metadata.
  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data, error }) => {
      if (error || !data.user) {
        setIsMetaLoading(false);
        return;
      }

      const metadata = data.user.user_metadata;
      const city = String(metadata?.preferred_city ?? metroCities[1].city);
      const cityRecord =
        metroCities.find((metroCity) => metroCity.city === city) ??
        metroCities[1];
      const station = String(
        metadata?.preferred_station ?? cityRecord.stations[0],
      );

      const resolvedStation = cityRecord.stations.includes(station)
        ? station
        : cityRecord.stations[0];

      setSelectedCity(cityRecord.city);
      setSelectedStation(resolvedStation);
      setSavedProfile((current) => ({
        ...current,
        selectedCity: cityRecord.city,
        selectedStation: resolvedStation,
      }));
      setIsMetaLoading(false);
    });
  }, []);

  function handleCityChange(city: string) {
    const nextMetro =
      metroCities.find((metroCity) => metroCity.city === city) ??
      metroCities[0];

    setSelectedCity(nextMetro.city);
    setSelectedStation(nextMetro.stations[0]);
    setLocationMessage("");
  }

  function handleStationChange(station: string) {
    setSelectedStation(station);
    setLocationMessage("");
  }

  function cancelEdit() {
    setFullName(savedProfile.fullName);
    setEmail(savedProfile.email);
    setPhone(savedProfile.phone);
    setMessage("");
    setIsEditing(false);
  }

  async function saveLocationPreference() {
    setIsSavingLocation(true);
    setLocationMessage("");

    const supabase = createClient();

    const { error } = await supabase.auth.updateUser({
      data: {
        preferred_city: selectedCity,
        preferred_state: selectedMetro.state,
        preferred_network: selectedMetro.network,
        preferred_station: selectedStation,
      },
    });

    if (error) {
      setLocationMessage(error.message);
      setIsSavingLocation(false);
      return;
    }

    setSavedProfile((currentProfile) => ({
      ...currentProfile,
      selectedCity,
      selectedStation,
    }));
    setLocationMessage("Metro preference saved.");
    setIsSavingLocation(false);
  }

  async function saveProfile() {
    if (!profile) return;

    setIsSaving(true);
    setMessage("");

    try {
      // Name/phone -> backend user_profiles table.
      await updateProfile(profile.id, {
        full_name: fullName,
        phone,
      });

      // Email is Supabase-owned - only touch it if it actually changed,
      // since this triggers Supabase's own confirmation email flow.
      let emailChanged = false;
      if (email && email !== savedProfile.email) {
        const supabase = createClient();
        const { error } = await supabase.auth.updateUser({ email });
        if (error) throw error;
        emailChanged = true;
      }

      await refresh();

      setSavedProfile((current) => ({ ...current, fullName, phone, email }));
      setIsEditing(false);
      setMessage(
        emailChanged
          ? "Profile saved. Confirm the new email from your inbox to use it for login."
          : "Profile saved successfully.",
      );
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Could not save your profile.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  // Keeps MetroFlow's own user_profiles.phone in sync once a number
  // is actually verified & linked in Supabase Auth, so the profile
  // form and the number that works for OTP login don't drift apart.
  async function handlePhoneVerified(verifiedPhone: string) {
    if (!profile) return;

    try {
      await updateProfile(profile.id, { phone: verifiedPhone });
      setPhone(verifiedPhone);
      setSavedProfile((current) => ({ ...current, phone: verifiedPhone }));
      await refresh();
    } catch {
      // Non-fatal - the phone is still verified/linked in Supabase
      // Auth and usable for login even if this profile-table sync
      // fails; it'll just look out of date on this page until the
      // person edits/saves their profile again.
    }
  }

  function requestLocationAccess() {
    if (!("geolocation" in navigator)) {
      setLocationStatus("unsupported");
      setLocationText("Location access is not supported on this device.");
      return;
    }

    setLocationStatus("requesting");
    setLocationText("Waiting for browser location permission...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationStatus("granted");
        setLocationText(
          `Location linked: ${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`,
        );
      },
      () => {
        setLocationStatus("denied");
        setLocationText(
          "Location permission was denied. You can still select station manually.",
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      },
    );
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="border-b border-border bg-gradient-to-r from-primary/15 via-transparent to-primary/10 p-5 sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <UserCircle2 size={38} />
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-primary">
                {profile?.role ?? "Passenger"} Profile
              </p>
              <h1 className="mt-1 text-3xl font-black tracking-tight">
                {fullName || "..."}
              </h1>
              <p className="mt-1 text-sm text-muted">
                Manage identity, contact and preferred metro station.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <StatusPill
              icon={<ShieldCheck size={16} />}
              label="Verified"
            />
            <StatusPill
              icon={<Bell size={16} />}
              label="Alerts On"
            />
          </div>
        </div>
        </div>

        <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
          <p className="text-sm text-muted">
            {isLoading
              ? "Loading profile..."
              : message ||
                "Edit personal details only when needed. Metro preference can be changed anytime."}
          </p>

          <div className="flex gap-2">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border px-4 text-sm font-bold transition hover:bg-muted"
                >
                  <X size={17} />
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveProfile}
                  disabled={isSaving || isLoading}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#183c22] px-4 text-sm font-bold text-white transition hover:bg-[#22542f] active:bg-[#0f2b18] disabled:opacity-60"
                >
                  <Save size={17} />
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                disabled={isLoading}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#183c22] px-4 text-sm font-bold text-white transition hover:bg-[#22542f] active:bg-[#0f2b18] disabled:opacity-60"
              >
                <Edit3 size={17} />
                Edit Profile
              </button>
            )}
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-2xl border border-border bg-card p-5 sm:p-7">
          <div className="mb-6">
            <h2 className="text-xl font-bold">Personal Details</h2>
            <p className="mt-1 text-sm text-muted">
              Name and phone are stored in MetroFlow&apos;s user profile;
              email changes go through Supabase and need confirmation.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <Input
              label="Full Name"
              value={fullName}
              disabled={!isEditing || isLoading}
              onChange={(event) => setFullName(event.target.value)}
              startIcon={<UserCircle2 size={18} />}
            />

            <Input
              label="Email"
              type="email"
              value={email}
              disabled={!isEditing || isLoading}
              onChange={(event) => setEmail(event.target.value)}
              helperText="Changing email may require confirmation before next login."
              startIcon={<Mail size={18} />}
            />

            <Input
              label="Phone Number"
              type="tel"
              value={phone}
              disabled={!isEditing || isLoading}
              onChange={(event) => setPhone(event.target.value)}
              startIcon={<Phone size={18} />}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 sm:p-7">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">Mobile Location</h2>
              <p className="mt-1 text-sm text-muted">
                Permission based access for nearest station matching.
              </p>
            </div>
            <MapPin className="shrink-0 text-primary" size={24} />
          </div>

          <div className="rounded-2xl border border-border bg-background p-4">
            <p className="text-sm leading-6 text-muted">{locationText}</p>

            <button
              type="button"
              onClick={requestLocationAccess}
              disabled={locationStatus === "requesting"}
              className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#183c22] px-4 text-sm font-bold text-white transition hover:bg-[#22542f] active:bg-[#0f2b18] disabled:opacity-60"
            >
              <LocateFixed size={18} />
              {locationStatus === "requesting"
                ? "Requesting..."
                : "Allow Location Access"}
            </button>
          </div>
        </section>
      </div>

      <PhoneVerification
        initialPhone={savedProfile.phone}
        onVerified={handlePhoneVerified}
      />

      <section className="rounded-2xl border border-border bg-card p-5 sm:p-7">
        <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-xl font-bold">Preferred Metro Network</h2>
            <p className="mt-1 text-sm text-muted">
              Change city or nearest station anytime for alerts and dashboard
              context.
            </p>
          </div>

          <button
            type="button"
            onClick={saveLocationPreference}
            disabled={isLoading || isSavingLocation}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#183c22] px-4 text-sm font-bold text-white transition hover:bg-[#22542f] active:bg-[#0f2b18] disabled:opacity-60"
          >
            <Save size={17} />
            {isSavingLocation ? "Saving..." : "Save Location"}
          </button>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          <label className="space-y-2">
            <span className="text-sm font-semibold">Metro City</span>
            <select
              value={selectedCity}
              disabled={isLoading}
              onChange={(event) => handleCityChange(event.target.value)}
              className="h-12 w-full rounded-xl border border-border bg-card px-4 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:opacity-60"
            >
              {metroCities.map((metroCity) => (
                <option key={metroCity.city} value={metroCity.city}>
                  {metroCity.city} - {metroCity.state}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold">Nearest Station</span>
            <select
              value={selectedStation}
              disabled={isLoading}
              onChange={(event) => handleStationChange(event.target.value)}
              className="h-12 w-full rounded-xl border border-border bg-card px-4 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:opacity-60"
            >
              {selectedMetro.stations.map((station) => (
                <option key={station} value={station}>
                  {station}
                </option>
              ))}
            </select>
          </label>

          <div className="rounded-2xl border border-border bg-background p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <TrainFront size={21} />
              </div>
              <div>
                <p className="text-sm font-bold">{selectedMetro.network}</p>
                <p className="mt-1 text-xs text-muted">
                  {selectedStation}, {selectedMetro.city}
                </p>
              </div>
            </div>
          </div>
        </div>

        {locationMessage && (
          <p className="mt-4 rounded-xl bg-primary/10 p-3 text-sm text-primary">
            {locationMessage}
          </p>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <PreferenceCard
          title="Smart Alerts"
          description="Crowd, route and delay alerts for selected station."
        />
        <PreferenceCard
          title="Saved Station"
          description={`${selectedStation} is used as the default dashboard context.`}
        />
      </section>
    </div>
  );
}

function StatusPill({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-2 text-xs font-bold text-muted">
      {icon}
      {label}
    </span>
  );
}

function PreferenceCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <article className="rounded-2xl border border-border bg-card p-5">
      <CheckCircle2 className="text-primary" size={22} />
      <h3 className="mt-4 font-bold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
    </article>
  );
}