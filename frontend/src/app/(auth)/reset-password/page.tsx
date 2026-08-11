"use client";

import {
  ArrowLeft,
  ArrowRight,
  Moon,
  Sun,
  TrainFront,
} from "lucide-react";
import Link from "next/link";
import {
  FormEvent,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";

import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [password, setPassword] =
    useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");
  const [errorMessage, setErrorMessage] =
    useState("");
  const [message, setMessage] = useState("");
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

  async function handleReset(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setErrorMessage("");

    if (password !== confirmPassword) {
      setBusy(false);
      setErrorMessage("Passwords do not match.");
      return;
    }

    try {
      const supabase = createClient();
      const { error } =
        await supabase.auth.updateUser({
          password,
        });

      if (error) {
        throw error;
      }

      setMessage(
        "Password updated. Redirecting to login...",
      );
      setTimeout(() => router.push("/login"), 900);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to reset password.",
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
          <Link href="/login" className="auth-back-link">
            <ArrowLeft size={16} />
            Back to login
          </Link>

          <span className="auth-kicker">
            Secure recovery
          </span>

          <h1>Set a new MetroFlow password.</h1>

          <p>
            Use the recovery link from your email, then choose a fresh password for your passenger, operator, or admin account.
          </p>
        </div>

        <div className="auth-glass-card">
          <span className="auth-kicker">
            Reset password
          </span>

          <h2>Create new access.</h2>

          <p className="auth-description">
            Enter and confirm your new password.
          </p>

          <form
            className="role-auth-form"
            onSubmit={handleReset}
          >
            <label>
              New password

              <input
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="Minimum 8 characters"
              />
            </label>

            <label>
              Confirm password

              <input
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(event.target.value)
                }
                placeholder="Repeat password"
              />
            </label>

            {errorMessage && (
              <div className="auth-alert error">
                {errorMessage}
              </div>
            )}

            {message && (
              <div className="auth-alert success">
                {message}
              </div>
            )}

            <button
              type="submit"
              className="auth-main-button"
              disabled={busy}
            >
              {busy
                ? "Updating password..."
                : "Update password"}

              <ArrowRight size={18} />
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
