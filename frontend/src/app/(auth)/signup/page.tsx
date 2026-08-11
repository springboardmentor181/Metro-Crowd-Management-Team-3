"use client";

import {
  ArrowLeft,
  ArrowRight,
  Crown,
  Mail,
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

import { accountRoles } from "@/lib/auth-roles";
import type { AccountRole } from "@/lib/auth-roles";
import { createClient } from "@/lib/supabase/client";

const roleIcons = {
  passenger: UserRound,
  operator: UserCog,
  admin: Crown,
};

export default function SignupPage() {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();

  const [selectedRole, setSelectedRole] =
    useState<AccountRole>("passenger");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] =
    useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] =
    useState("");
  const [busy, setBusy] = useState(false);

  // Avoids a hydration mismatch: the server can't know the user's
  // stored/system theme, so it always renders the "light" icon. Until
  // this component mounts on the client, keep rendering that same
  // icon instead of branching on resolvedTheme.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  function toggleTheme() {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }

  async function handleSignup(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setErrorMessage("");

    if (password !== confirmPassword) {
      setBusy(false);
      setErrorMessage("Passwords do not match.");
      return;
    }

    const supabase = createClient();

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            requested_role: selectedRole,
            role:
              selectedRole === "passenger"
                ? "passenger"
                : undefined,
          },
          emailRedirectTo:
            typeof window === "undefined"
              ? undefined
              : `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        throw error;
      }

      setMessage(
        selectedRole === "passenger"
          ? "Account created. Check your email if confirmation is enabled, then sign in."
          : "Access request sent. An admin must approve this operator/admin role in Supabase app metadata.",
      );
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to create account.",
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
            MetroFlow access
          </span>

          <h1>
            Create one account for your metro role.
          </h1>

          <p>
            Passengers can sign up instantly. Operator and admin accounts are requested first, then approved by MetroFlow administrators.
          </p>
        </div>

        <div className="auth-glass-card">
          <span className="auth-kicker">
            New account
          </span>

          <h2>Join MetroFlow.</h2>

          <p className="auth-description">
            Choose passenger, operator, or admin before creating your account.
          </p>

          <form
            className="role-auth-form"
            onSubmit={handleSignup}
          >
            <fieldset className="role-fieldset">
              <legend>Account type</legend>

              <div className="role-options">
                {accountRoles.map((role) => {
                  const Icon = roleIcons[role.value];

                  return (
                    <label
                      key={role.value}
                      className={
                        selectedRole === role.value
                          ? "role-option selected"
                          : "role-option"
                      }
                    >
                      <input
                        type="radio"
                        name="role"
                        value={role.value}
                        checked={
                          selectedRole === role.value
                        }
                        onChange={() =>
                          setSelectedRole(role.value)
                        }
                      />

                      <Icon size={18} />

                      <span>
                        <strong>{role.label}</strong>
                        <small>
                          {role.description}
                        </small>
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <label>
              Full name

              <input
                type="text"
                required
                minLength={3}
                autoComplete="name"
                value={fullName}
                onChange={(event) =>
                  setFullName(event.target.value)
                }
                placeholder="Shubham Kumar"
              />
            </label>

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

            <div className="auth-form-row">
              <label>
                Password

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
                    setConfirmPassword(
                      event.target.value,
                    )
                  }
                  placeholder="Repeat password"
                />
              </label>
            </div>

            {selectedRole !== "passenger" && (
              <div className="admin-information">
                Operator and admin signups are stored as requests. Set <strong>app_metadata.role</strong> to <strong>{selectedRole}</strong> in Supabase after approval.
              </div>
            )}

            {errorMessage && (
              <div className="auth-alert error">
                {errorMessage}
              </div>
            )}

            {message && (
              <div className="auth-alert success">
                <Mail size={14} />
                {message}
              </div>
            )}

            <button
              type="submit"
              className="auth-main-button"
              disabled={busy}
            >
              {busy
                ? "Creating account..."
                : "Create account"}

              <ArrowRight size={18} />
            </button>
          </form>

          <p className="auth-switch-text">
            Already registered?{" "}

            <Link href="/login">Sign in</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
