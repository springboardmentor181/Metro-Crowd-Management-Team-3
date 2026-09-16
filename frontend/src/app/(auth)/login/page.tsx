"use client";

import {
  ArrowLeft,
  ArrowRight,
  Crown,
  Loader2,
  Mail,
  MessageSquare,
  Moon,
  ShieldCheck,
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
import { signInWithGoogle } from "@/lib/auth/oauth";
import { GoogleIcon } from "@/components/icons/GoogleIcon";
import { normalizePhone } from "@/lib/utils/phone";

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

type LoginMethod = "email" | "phone";

export default function LoginPage() {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();

  const [method, setMethod] = useState<LoginMethod>("email");

  const [selectedRole, setSelectedRole] =
    useState<AccountRole>("passenger");

  const [email, setEmail] = useState("");
  const [password, setPassword] =
    useState("");

  // Phone+OTP is a two-step flow: request a code, then verify it.
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  // See signup page for why this guard is needed - avoids a
  // server/client hydration mismatch on the theme icon.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);

    // Google sign-in failures redirect back here with ?error=... (see
    // src/app/auth/callback/route.ts) - read it once on mount instead
    // of next/navigation's useSearchParams, which would otherwise
    // force this whole page into a <Suspense> boundary.
    const params = new URLSearchParams(window.location.search);
    const error = params.get("error");
    if (error) {
      setErrorMessage(error);
    }
  }, []);

  function toggleTheme() {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }

  function switchMethod(next: LoginMethod) {
    setMethod(next);
    setErrorMessage("");
    setOtpSent(false);
    setOtp("");
  }

  // Shared by every sign-in path (email/password, phone/OTP, Google)
  // once Supabase has actually issued a session: reads the app's own
  // role from user_profiles (not anything on the Supabase Auth user
  // itself), enforces the account-type picker matches it, then sends
  // the person to the dashboard.
  async function completeLogin() {
    const supabase = createClient();

    const profile = await getCurrentProfile();

    if (profile.role !== selectedRole) {
      await supabase.auth.signOut();

      throw new Error(
        `This account is registered as "${profile.role}", not "${selectedRole}". Select the correct account type.`,
      );
    }

    router.push("/dashboard");
    router.refresh();
  }

  async function handleEmailLogin(event: FormEvent) {
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

      await completeLogin();
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

  async function handleSendOtp(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setErrorMessage("");

    const supabase = createClient();
    // Supabase phone auth requires E.164 ("+91..."), and matches the
    // *exact* string on auth.users.phone - normalize here so a bare
    // "9142996613" (no country code) still matches an account that
    
    const normalizedPhone = normalizePhone(phone);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: normalizedPhone,
        options: {
          
          shouldCreateUser: false,
        },
      });

      if (error) {
        throw error;
      }

      setPhone(normalizedPhone);
      setOtpSent(true);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Couldn't send the verification code. Check the number and try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleVerifyOtp(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setErrorMessage("");

    const supabase = createClient();

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: normalizePhone(phone),
        token: otp,
        type: "sms",
      });

      if (error) {
        throw error;
      }

      if (!data.session) {
        throw new Error("Verification succeeded but no session was returned.");
      }

      await completeLogin();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "That code didn't work. Check it and try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogleLogin() {
    setGoogleBusy(true);
    setErrorMessage("");
    try {
      await signInWithGoogle("/dashboard");
      
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Couldn't start Google sign-in.",
      );
      setGoogleBusy(false);
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

          <div className="auth-card-fields">
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

            <div className="auth-method-tabs">
              <button
                type="button"
                className={method === "email" ? "auth-method-tab active" : "auth-method-tab"}
                onClick={() => switchMethod("email")}
              >
                <Mail size={14} />
                Email
              </button>
              <button
                type="button"
                className={method === "phone" ? "auth-method-tab active" : "auth-method-tab"}
                onClick={() => switchMethod("phone")}
              >
                <MessageSquare size={14} />
                Phone
              </button>
            </div>

            {method === "email" ? (
            <form
              className="role-auth-form"
              onSubmit={handleEmailLogin}
            >
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
          ) : (
            <form
              className="role-auth-form"
              onSubmit={otpSent ? handleVerifyOtp : handleSendOtp}
            >
              <label>
                Phone number

                <input
                  type="tel"
                  required
                  autoComplete="tel"
                  disabled={otpSent}
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="+91 98765 43210"
                />
              </label>

              {otpSent && (
                <label>
                  Verification code

                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    autoComplete="one-time-code"
                    value={otp}
                    onChange={(event) => setOtp(event.target.value)}
                    placeholder="6-digit code"
                  />
                </label>
              )}

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
                {busy ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : otpSent ? (
                  <ShieldCheck size={18} />
                ) : (
                  <MessageSquare size={18} />
                )}
                {busy
                  ? "Please wait..."
                  : otpSent
                    ? "Verify & sign in"
                    : "Send verification code"}
              </button>

              {otpSent && (
                <button
                  type="button"
                  className="auth-link-button"
                  onClick={() => {
                    setOtpSent(false);
                    setOtp("");
                    setErrorMessage("");
                  }}
                >
                  Use a different number
                </button>
              )}
            </form>
          )}
          </div>

          <div className="auth-divider">
            <span>or</span>
          </div>

          <button
            type="button"
            className="auth-google-button"
            onClick={handleGoogleLogin}
            disabled={googleBusy}
          >
            {googleBusy ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <GoogleIcon size={18} />
            )}
            {googleBusy ? "Redirecting..." : "Continue with Google"}
          </button>

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