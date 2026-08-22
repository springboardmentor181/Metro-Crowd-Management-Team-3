"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

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

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Wraps the dashboard-side of the app. Confirms the Supabase session is
 * valid, then asks the backend "who is this?" via GET /api/v1/auth/me -
 * which also auto-creates the `user_profiles` row on someone's very
 * first authenticated request. Every dashboard component reads role /
 * profile data from here instead of re-fetching it themselves.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);

    try {
      if (isAuthDisabled) {
        // TEMPORARY bypass - see src/lib/auth/mock.ts.
        if (!getMockEmail()) {
          router.replace("/login");
          return;
        }
      } else {
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          router.replace("/login");
          return;
        }
      }

      const data = await getCurrentProfile();
      setProfile(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not verify your session.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function signOut() {
    if (isAuthDisabled) {
      clearMockEmail();
    } else {
      const supabase = createClient();
      await supabase.auth.signOut();
    }
    setProfile(null);
    router.replace("/login");
  }

  return (
    <AuthContext.Provider value={{ profile, loading, error, refresh: load, signOut }}>
      {children}
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
