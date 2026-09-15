"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

import { createClient } from "@/lib/supabase/client";
import { getCurrentProfile } from "@/lib/api/auth";
import { isAuthDisabled, getMockEmail, clearMockEmail } from "@/lib/auth/mock";
import type { UserProfile } from "@/lib/api/types";

interface AuthContextValue {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const PROFILE_FETCH_BUDGET_MS = 120_000;

const PROFILE_FETCH_BACKOFF_MS = [800, 1500, 3000, 5000, 8000, 12000, 15000];

const OPTIMISTIC_CACHE_AFTER_MS = 4000;
const LAST_PROFILE_STORAGE_KEY = "metroflow:last-profile";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isAuthRejectionStatus(status: number | undefined) {
  return status === 401 || status === 403;
}

function readCachedProfile(): UserProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LAST_PROFILE_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as UserProfile) : null;
  } catch {
    return null;
  }
}

function writeCachedProfile(profile: UserProfile) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LAST_PROFILE_STORAGE_KEY, JSON.stringify(profile));
  } catch {
    
  }
}

function clearCachedProfile() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(LAST_PROFILE_STORAGE_KEY);
  } catch {
    
  }
}

async function fetchProfileWithRetry(): Promise<
  { ok: true; profile: UserProfile } | { ok: false; authRejected: boolean; message: string }
> {
  const deadline = Date.now() + PROFILE_FETCH_BUDGET_MS;
  let lastMessage = "Could not verify your session.";
  let attempt = 0;

  while (true) {
    try {
      const profile = await getCurrentProfile();
      return { ok: true, profile };
    } catch (err) {
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;
      lastMessage = err instanceof Error ? err.message : lastMessage;

      if (isAuthRejectionStatus(status)) {
        return { ok: false, authRejected: true, message: lastMessage };
      }

      const delay = PROFILE_FETCH_BACKOFF_MS[attempt] ?? PROFILE_FETCH_BACKOFF_MS[PROFILE_FETCH_BACKOFF_MS.length - 1];
      if (Date.now() + delay >= deadline) {
        return { ok: false, authRejected: false, message: lastMessage };
      }
      await sleep(delay);
      attempt += 1;
    }
  }
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Gates whether dashboard content is allowed to mount at all. Distinct
// from `loading`/`profile` above (which existing consumers use to show
// in-page spinners once already authorized) - this is the one-time
// "is there even a session" decision. Content only renders once this
// is "authorized"; while "checking" or "redirecting" we show nothing
// dashboard-related, so an unauthenticated visitor never gets a
// mounted (and therefore data-fetching) protected page while the
// redirect to /login is in flight.
type AccessStatus = "checking" | "authorized" | "redirecting";

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accessStatus, setAccessStatus] = useState<AccessStatus>("checking");

  async function load() {
    setLoading(true);
    setError(null);

    let settled = false;
    let optimisticTimer: ReturnType<typeof setTimeout> | null = null;

    try {
      if (isAuthDisabled) {
        
        if (!getMockEmail()) {
          setAccessStatus("redirecting");
          router.replace("/login");
          return;
        }
      } else {
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            setAccessStatus("redirecting");
            router.replace("/login");
            return;
          }
        }
      }

      setAccessStatus("authorized");

      const cached = readCachedProfile();
      if (cached) {
        optimisticTimer = setTimeout(() => {
          if (!settled) {
            setProfile(cached);
            setLoading(false);
          }
        }, OPTIMISTIC_CACHE_AFTER_MS);
      }

      const result = await fetchProfileWithRetry();
      settled = true;
      if (optimisticTimer) clearTimeout(optimisticTimer);

      if (result.ok) {
        setProfile(result.profile);
        setError(null);
        writeCachedProfile(result.profile);
      } else if (result.authRejected) {
        
        if (!isAuthDisabled) {
          const supabase = createClient();
          await supabase.auth.signOut();
        } else {
          clearMockEmail();
        }
        setProfile(null);
        clearCachedProfile();
        setAccessStatus("redirecting");
        router.replace("/login");
        return;
      } else {
        
        setProfile((prev) => prev ?? cached);
        setError(result.message);
      }
    } catch (err) {
      settled = true;
      if (optimisticTimer) clearTimeout(optimisticTimer);
      setError(
        err instanceof Error ? err.message : "Could not verify your session.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();

    // Keep auth/profile state in sync with Supabase itself, not just
    // the one-time check above - a token refresh, a sign-out from
    // another tab, or a user switch all fire here even though nothing
    // on this page triggered them, and without this listener the
    // cached `profile` from a previous session could keep being shown
    // as if it were still valid.
    if (isAuthDisabled) return;
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        // Session is gone (elsewhere or here) - drop anything cached
        // for the old user rather than let it linger stale, and send
        // them back to login.
        setProfile(null);
        clearCachedProfile();
        setAccessStatus("redirecting");
        router.replace("/login");
        return;
      }
      if (
        event === "SIGNED_IN" ||
        event === "TOKEN_REFRESHED" ||
        event === "USER_UPDATED"
      ) {
        // A new session (possibly a different user) or a refreshed
        // token - re-resolve access and re-fetch the profile so stale
        // state from before this event can't keep being served.
        load();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
    
  }, []);

  async function signOut() {
    if (isAuthDisabled) {
      clearMockEmail();
    } else {
      const supabase = createClient();
      await supabase.auth.signOut();
    }
    setProfile(null);
    clearCachedProfile();
    setAccessStatus("redirecting");
    router.replace("/login");
  }

  return (
    <AuthContext.Provider value={{ profile, loading, error, refresh: load, signOut }}>
      {accessStatus === "authorized" ? children : null}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within <AuthProvider>");
  }
  return ctx;
}