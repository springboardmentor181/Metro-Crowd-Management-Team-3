"use client";

import { Chrome, Github, Loader2 } from "lucide-react";
import { useState } from "react";
import { signInWithGoogle } from "@/lib/auth/oauth";

interface SocialButtonProps {
  provider: "google" | "github";
  onClick?: () => Promise<void> | void;
}

function SocialButton({
  provider,
  onClick,
}: SocialButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      if (onClick) {
        await onClick();
      } else if (provider === "google") {
        await signInWithGoogle("/dashboard");
        // On success Supabase redirects the browser to Google, so
        // there's no "finally" needed — the page is navigating away.
        return;
      }
      setLoading(false);
    } catch (err) {
      console.error(`${provider} sign-in failed`, err);
      setLoading(false);
    }
  };

  const config = {
    google: {
      title: "Continue with Google",
      icon: Chrome,
      gradient:
        "from-red-500 via-yellow-500 to-green-500",
    },

    github: {
      title: "Continue with GitHub",
      icon: Github,
      gradient:
        "from-slate-700 to-slate-900",
    },
  };

  const item = config[provider];

  const Icon = item.icon;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="
      group
      relative
      flex
      h-12
      w-full
      items-center
      justify-center
      gap-3
      overflow-hidden
      rounded-xl
      border
      border-border
      bg-card
      transition-all
      duration-300
      hover:-translate-y-1
      hover:border-primary/40
      hover:shadow-lg
      disabled:cursor-not-allowed
      disabled:opacity-60
      "
    >
      <div
        className={`
        absolute
        inset-0
        bg-gradient-to-r
        ${item.gradient}
        opacity-0
        transition
        duration-300
        group-hover:opacity-10
        `}
      />

      {loading ? (
        <Loader2
          className="animate-spin"
          size={18}
        />
      ) : (
        <Icon size={18} />
      )}

      <span className="font-medium">
        {item.title}
      </span>
    </button>
  );
}

export default function SocialLogin() {
  return (
    <div className="space-y-4">

      <SocialButton
        provider="google"
      />

      <SocialButton
        provider="github"
      />

    </div>
  );
}