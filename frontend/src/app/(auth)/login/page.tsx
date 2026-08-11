"use client";

import {
  ArrowLeft,
  ArrowRight,
  Crown,
  Moon,
  Sun,
  TrainFront,
  UserCog,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import {
  FormEvent,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";

import type { AccountRole } from "@/lib/auth-roles";
import { createClient } from "@/lib/supabase/client";
import { getCurrentProfile } from "@/lib/api/auth";

const loginRoles = [
  {
    value: "passenger" as const,
    label: "Passenger",
    icon: UserRound,
  },
  {
    value: "operator" as const,
    label: "Operator",
    icon: UserCog,
  },
  {
    value: "admin" as const,
    label: "Admin",
    icon: Crown,
  },
];

export default function LoginPage() {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();

  const [selectedRole, setSelectedRole] =
    useState<AccountRole>("passenger");

  const [email, setEmail] = useState("");
  const [password, setPassword] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  const [busy, setBusy] = useState(false);

  // See signup page for why this guard is needed - avoids a
  // server/client hydration mismatch on the theme icon.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  function toggleTheme() {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }

  async function handleLogin(event: FormEvent) {
    event.preventDefault();

    setBusy(true);
    setErrorMessage("");

    const supabase = createClient();

    try {
      const { data, error } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (error) {
        throw error;
      }

      if (!data.user) {
        throw new Error(
          "Supabase did not return a user account.",
        );
      }

      // The role that matters is the one stored in `user_profiles`
      // (Postgres, inside the same Supabase project) - not anything
      // client-editable on the Supabase Auth user object itself. This
      // also auto-creates that profile row on someone's very first
      // login (default role: passenger).
      const profile = await getCurrentProfile();

      if (profile.role !== selectedRole) {
        await supabase.auth.signOut();

        throw new Error(
          `This account is registered as "${profile.role}", not "${selectedRole}". Select the correct account type.`,
        );
      }

      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to sign in.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="role-auth-page">
      <div className="auth-background">
        <div className="auth-background-overlay" />
      </div>

      <nav className="auth-navbar">
        <Link href="/" className="auth-brand">
          <span>
            <TrainFront size={22} />
          </span>

          MetroFlow <strong>AI</strong>
        </Link>

        <button
          type="button"
          className="glass-icon-button"
          onClick={toggleTheme}
          aria-label="Change theme"
        >
          {mounted && resolvedTheme === "dark" ? (
            <Sun size={18} />
          ) : (
            <Moon size={18} />
          )}
        </button>
      </nav>

      <section className="auth-glass-layout">
        <div className="auth-introduction">
          <Link href="/" className="auth-back-link">
            <ArrowLeft size={16} />
            Return home
          </Link>

          <span className="auth-kicker">
            One login for every journey
          </span>

          <h1>
            Your network, your journey, your MetroFlow.
          </h1>

          <p>
            Passengers get travel guidance while approved teams get secure operational tools.
          </p>
        </div>

        <div className="auth-glass-card">
          <span className="auth-kicker">
            Welcome back
          </span>

          <h2>Sign in to MetroFlow.</h2>

          <p className="auth-description">
            Choose passenger or your approved work account.
          </p>

          <form
            className="role-auth-form"
            onSubmit={handleLogin}
          >
            <fieldset className="role-fieldset">
              <legend>Account type is required</legend>

              <div className="login-role-grid">
                {loginRoles.map((role) => {
                  const Icon = role.icon;

                  return (
                    <label
                      key={role.value}
                      className={
                        selectedRole === role.value
                          ? "login-role selected"
                          : "login-role"
                      }
                    >
                      <input
                        type="radio"
                        name="loginRole"
                        value={role.value}
                        checked={
                          selectedRole === role.value
                        }
                        onChange={() =>
                          setSelectedRole(role.value)
                        }
                      />

                      <Icon size={20} />

                      <span>{role.label}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <label>
              Email address

              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="you@example.com"
              />
            </label>

            <label>
              Password

              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="Your password"
              />
            </label>

            {errorMessage && (
              <div className="auth-alert error">
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              className="auth-main-button"
              disabled={busy}
            >
              {busy
                ? "Checking access..."
                : "Sign in securely"}

              <ArrowRight size={18} />
            </button>
          </form>

          <p className="auth-switch-text">
            New to MetroFlow?{" "}

            <Link href="/signup">
              Create an account
            </Link>
          </p>

          <p className="auth-switch-text">
            Forgot password?{" "}

            <Link href="/forgot-password">
              Reset access
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
