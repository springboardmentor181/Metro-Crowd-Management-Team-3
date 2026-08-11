"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail } from "lucide-react";
import { useForm } from "react-hook-form";

import Input from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import SocialLogin from "./SocialLogin";
import Divider from "./Divider";
import { createClient } from "@/lib/supabase/client";
import { isAuthDisabled, setMockEmail } from "@/lib/auth/mock";

interface LoginFormData {
  email: string;
  password: string;
}

export default function LoginForm() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>();

  async function onSubmit(
    data: LoginFormData
  ) {
    if (isAuthDisabled) {
      // TEMPORARY bypass - see src/lib/auth/mock.ts. Any email logs in,
      // no password / email-verification check.
      setMockEmail(data.email);
      router.push("/dashboard");
      router.refresh();
      return;
    }

    const supabase = createClient();

    const { error } =
      await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

    if (error) {
      setError("root", {
        message: error.message,
      });
      return;
    }

    router.push("/dashboard");
    router.refresh();
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
            required: isAuthDisabled ? false : "Password is required",
          })}
        />

        <div className="flex items-center justify-between">

          <label className="flex items-center gap-2">

            <input
              type="checkbox"
              className="rounded"
            />

            <span className="text-sm text-muted">
              Remember me
            </span>

          </label>

          <Link
            href="/forgot-password"
            className="
            text-sm
            font-medium
            text-primary
            hover:underline
            "
          >
            Forgot password?
          </Link>

        </div>

        <Button
          type="submit"
          className="w-full"
          size="lg"
          disabled={isSubmitting}
        >
          {isSubmitting
            ? "Signing In..."
            : "Sign In"}
        </Button>

        {errors.root?.message && (
          <p className="rounded-xl bg-red-500/10 p-3 text-sm text-red-500">
            {errors.root.message}
          </p>
        )}

      </form>

      <p className="mt-8 text-center text-sm text-muted">

        Don&apos;t have an account?{" "}

        <Link
          href="/signup"
          className="
          font-semibold
          text-primary
          hover:underline
          "
        >
          Create Account
        </Link>

      </p>

    </>
  );
}
