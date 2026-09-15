"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Phone, ShieldCheck } from "lucide-react";

import Input from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

export default function PhoneOtpLogin() {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function handleSendOtp(e: FormEvent) {
    e.preventDefault();
    if (!phone.trim()) {
      setError("Enter your phone number.");
      return;
    }
    setSubmitting(true);
    setError(null);
    setInfo(null);
    try {
      const supabase = createClient();
      const { error: sendError } = await supabase.auth.signInWithOtp({
        phone: phone.trim(),
      });
      if (sendError) {
        setError(sendError.message);
        return;
      }
      setInfo(`A 6-digit code was sent to ${phone.trim()}.`);
      setStep("otp");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerifyOtp(e: FormEvent) {
    e.preventDefault();
    if (!otp.trim()) {
      setError("Enter the code you received.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error: verifyError } = await supabase.auth.verifyOtp({
        phone: phone.trim(),
        token: otp.trim(),
        type: "sms",
      });
      if (verifyError) {
        setError(verifyError.message);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  if (step === "otp") {
    return (
      <form onSubmit={handleVerifyOtp} className="space-y-6">
        {info && (
          <p className="rounded-xl bg-primary/10 p-3 text-sm text-primary">
            {info}
          </p>
        )}

        <Input
          label="6-digit code"
          type="text"
          inputMode="numeric"
          placeholder="123456"
          startIcon={<ShieldCheck size={18} />}
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
        />

        {error && (
          <p className="rounded-xl bg-red-500/10 p-3 text-sm text-red-500">
            {error}
          </p>
        )}

        <Button type="submit" className="w-full" size="lg" disabled={submitting}>
          {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
          {submitting ? "Verifying..." : "Verify & Sign In"}
        </Button>

        <button
          type="button"
          onClick={() => {
            setStep("phone");
            setOtp("");
            setError(null);
            setInfo(null);
          }}
          className="w-full text-center text-sm text-muted hover:underline"
        >
          Use a different phone number
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSendOtp} className="space-y-6">
      <Input
        label="Phone Number"
        type="tel"
        placeholder="+91 98765 43210"
        startIcon={<Phone size={18} />}
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />

      {error && (
        <p className="rounded-xl bg-red-500/10 p-3 text-sm text-red-500">
          {error}
        </p>
      )}

      <Button type="submit" className="w-full" size="lg" disabled={submitting}>
        {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
        {submitting ? "Sending code..." : "Send OTP"}
      </Button>
    </form>
  );
}
