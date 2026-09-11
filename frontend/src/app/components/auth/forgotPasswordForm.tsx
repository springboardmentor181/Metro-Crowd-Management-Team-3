"use client";

import Link from "next/link";
import { Mail } from "lucide-react";
import { useForm } from "react-hook-form";
import { useState } from "react";

import Input from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { createClient } from "@/lib/supabase/client";

interface FormData {
  email: string;
}

export default function ForgotPasswordForm() {
  const [message, setMessage] = useState("");
  const [formError, setFormError] = useState("");

  const {
    register,
    handleSubmit,
    formState: {
      errors,
      isSubmitting,
    },
  } = useForm<FormData>();

  async function onSubmit(data: FormData) {
    setMessage("");
    setFormError("");

    try {
      const supabase = createClient();
      const redirectTo =
        typeof window === "undefined"
          ? undefined
          : `${window.location.origin}/reset-password`;

      const { error } =
        await supabase.auth.resetPasswordForEmail(
          data.email,
          {
            redirectTo,
          },
        );

      if (error) {
        throw error;
      }

      setMessage(
        "Password reset link sent. Check your email to continue.",
      );
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Unable to send reset link.",
      );
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6"
    >
      <Input
        label="Email Address"
        type="email"
        placeholder="john@example.com"
        startIcon={<Mail size={18} />}
        error={errors.email?.message}
        {...register("email", {
          required: "Email is required",
        })}
      />

      {formError && (
        <div className="auth-alert error">
          {formError}
        </div>
      )}

      {message && (
        <div className="auth-alert success">
          {message}
        </div>
      )}

      <Button
        className="w-full"
        size="lg"
        disabled={isSubmitting}
      >
        {isSubmitting
          ? "Sending..."
          : "Send Reset Link"}
      </Button>

      <div className="text-center">
        <Link
          href="/login"
          className="text-sm font-semibold text-primary hover:underline"
        >
          Back to Login
        </Link>
      </div>
    </form>
  );
}
