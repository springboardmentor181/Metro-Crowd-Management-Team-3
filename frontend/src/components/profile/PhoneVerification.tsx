"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Loader2,
  MessageSquare,
  ShieldAlert,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { normalizePhone } from "@/lib/utils/phone";

interface PhoneVerificationProps {
  
  initialPhone?: string | null;
  
  onVerified?: (phone: string) => void;
}

type Status = "checking" | "verified" | "unverified";

export default function PhoneVerification({
  initialPhone,
  onVerified,
}: PhoneVerificationProps) {
  const [status, setStatus] = useState<Status>("checking");
  const [linkedPhone, setLinkedPhone] = useState<string | null>(null);
  const [phone, setPhone] = useState(initialPhone ?? "");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadStatus() {
    const supabase = createClient();
    const { data } = await supabase.auth.getUser();
    const user = data.user;

    if (user?.phone && user.phone_confirmed_at) {
      setStatus("verified");
      setLinkedPhone(user.phone);
    } else {
      setStatus("unverified");
    }
  }

  useEffect(() => {
    loadStatus();
  }, []);

  useEffect(() => {
    if (initialPhone && !phone) {
      setPhone(initialPhone);
    }
    
  }, [initialPhone]);

  async function sendCode() {
    if (!phone.trim()) {
      setError("Enter a phone number first.");
      return;
    }

    setBusy(true);
    setError("");
    setMessage("");

    const supabase = createClient();
    const normalized = normalizePhone(phone);

    // This is what actually links the number to the account - it
    // sends an OTP to `normalized` via whatever SMS provider is
    // configured on the Phone provider in the Supabase dashboard.
    const { error: updateError } = await supabase.auth.updateUser({
      phone: normalized,
    });

    if (updateError) {
      setError(updateError.message);
      setBusy(false);
      return;
    }

    setPhone(normalized);
    setOtpSent(true);
    setMessage(`Verification code sent to ${normalized}.`);
    setBusy(false);
  }

  async function verifyCode() {
    if (!otp.trim()) {
      setError("Enter the code you received.");
      return;
    }

    setBusy(true);
    setError("");
    setMessage("");

    const supabase = createClient();
    const normalized = normalizePhone(phone);

    const { error: verifyError } = await supabase.auth.verifyOtp({
      phone: normalized,
      token: otp.trim(),
      type: "phone_change",
    });

    if (verifyError) {
      setError(verifyError.message);
      setBusy(false);
      return;
    }

    setStatus("verified");
    setLinkedPhone(normalized);
    setOtpSent(false);
    setOtp("");
    setMessage(
      "Phone verified. You can now sign in with OTP using this number.",
    );
    setBusy(false);
    onVerified?.(normalized);
  }

  if (status === "checking") {
    return (
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-7">
        <p className="flex items-center gap-2 text-sm text-muted">
          <Loader2 size={16} className="animate-spin" />
          Checking phone verification status...
        </p>
      </div>
    );
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-5 sm:p-7">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Phone Login Verification</h2>
          <p className="mt-1 text-sm text-muted">
            Link and verify a number so you can sign in with OTP, not just
            email.
          </p>
        </div>

        {status === "verified" ? (
          <span className="inline-flex shrink-0 items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-500">
            <CheckCircle2 size={16} />
            Verified
          </span>
        ) : (
          <span className="inline-flex shrink-0 items-center gap-2 rounded-full bg-amber-500/10 px-3 py-2 text-xs font-bold text-amber-500">
            <ShieldAlert size={16} />
            Not verified
          </span>
        )}
      </div>

      {status === "verified" && (
        <p className="text-sm text-muted">
          <strong className="text-foreground">{linkedPhone}</strong> is
          linked and ready for OTP login. To use a different number, verify
          it below - it will replace this one.
        </p>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <label className="grid gap-2 text-sm font-semibold">
          Phone number
          <input
            type="tel"
            value={phone}
            disabled={otpSent || busy}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="+91 98765 43210"
            className="h-12 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-primary disabled:opacity-60"
          />
        </label>

        <button
          type="button"
          onClick={sendCode}
          disabled={busy || otpSent}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#183c22] px-4 text-sm font-bold text-white transition hover:bg-[#22542f] disabled:opacity-60"
        >
          {busy && !otpSent ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <MessageSquare size={16} />
          )}
          {otpSent ? "Code sent" : "Send code"}
        </button>
      </div>

      {otpSent && (
        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <label className="grid gap-2 text-sm font-semibold">
            Verification code
            <input
              type="text"
              inputMode="numeric"
              value={otp}
              disabled={busy}
              onChange={(event) => setOtp(event.target.value)}
              placeholder="6-digit code"
              className="h-12 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-primary disabled:opacity-60"
            />
          </label>

          <button
            type="button"
            onClick={verifyCode}
            disabled={busy}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#183c22] px-4 text-sm font-bold text-white transition hover:bg-[#22542f] disabled:opacity-60"
          >
            {busy ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <CheckCircle2 size={16} />
            )}
            Verify &amp; link
          </button>
        </div>
      )}

      {message && (
        <p className="mt-4 rounded-xl bg-primary/10 p-3 text-sm text-primary">
          {message}
        </p>
      )}
      {error && (
        <p className="mt-4 rounded-xl bg-red-500/10 p-3 text-sm text-red-500">
          {error}
        </p>
      )}
    </section>
  );
}