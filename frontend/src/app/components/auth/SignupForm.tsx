"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Mail } from "lucide-react";
import { useForm } from "react-hook-form";

import Input from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import Divider from "./Divider";
import SocialLogin from "./SocialLogin";
import { createClient } from "@/lib/supabase/client";

interface SignupFormData {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

export default function SignupForm() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    getValues,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>();

  async function onSubmit(data: SignupFormData) {
    const supabase = createClient();

    const username = data.email
      .split("@")[0]
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "");

    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.fullName,
          name: data.fullName,
          username,
          phone: data.phone,
          requested_role: "passenger",
          preferred_city: "Kolkata",
          preferred_station: "Esplanade",
        },
      },
    });

    if (error) {
      setError("root", {
        message: error.message,
      });
      return;
    }

    router.push("/profile");
  }

  return (
    <>
      <SocialLogin />

      <Divider />

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6"
      >
        <Input
          label="Full Name"
          placeholder="Shubham Kumar"
          startIcon={<User size={18} />}
          error={errors.fullName?.message}
          {...register("fullName", {
            required: "Full name is required",
            minLength: {
              value: 3,
              message: "Minimum 3 characters",
            },
          })}
        />

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

        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register("password", {
            required: "Password is required",
            minLength: {
              value: 8,
              message: "Minimum 8 characters",
            },
          })}
        />

        <Input
          label="Confirm Password"
          type="password"
          placeholder="••••••••"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword", {
            required: "Confirm your password",
            validate: (value) =>
              value === getValues("password") ||
              "Passwords do not match",
          })}
        />

        <Input
          label="Phone Number"
          type="tel"
          placeholder="+91 98765 43210"
          error={errors.phone?.message}
          {...register("phone", {
            required: "Phone number is required",
            minLength: {
              value: 10,
              message: "Enter a valid phone number",
            },
          })}
        />

        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            className="mt-1"
            required
          />

          <span className="text-sm text-muted">
            I agree to the Terms &
            Conditions and Privacy Policy.
          </span>
        </label>

        <Button
          className="w-full"
          size="lg"
          disabled={isSubmitting}
        >
          {isSubmitting
            ? "Creating Account..."
            : "Create Account"}
        </Button>

        {errors.root?.message && (
          <p className="rounded-xl bg-red-500/10 p-3 text-sm text-red-500">
            {errors.root.message}
          </p>
        )}
      </form>

      <p className="mt-8 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold text-primary hover:underline"
        >
          Sign In
        </Link>
      </p>
    </>
  );
}
