"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Loader2, TriangleAlert } from "lucide-react";

import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import RouteErrorBoundary from "@/components/RouteErrorBoundary";
import { useAuth } from "@/providers/AuthProvider";

export default function DashboardShell({ children }: { children: ReactNode }) {
  const { profile, loading, error, refresh } = useAuth();
  const [waitedMs, setWaitedMs] = useState(0);

  useEffect(() => {
    if (!loading) {
      setWaitedMs(0);
      return;
    }
    const start = Date.now();
    const interval = setInterval(() => setWaitedMs(Date.now() - start), 1000);
    return () => clearInterval(interval);
  }, [loading]);

  if (loading && !profile) {
    const message =
      waitedMs < 8000
        ? "Loading your dashboard..."
        : waitedMs < 30000
          ? "Still connecting - your last login worked fine, this is just a slow response..."
          : "Backend is taking a while to respond. Still retrying automatically...";

    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-center text-muted">
          <Loader2 size={28} className="animate-spin text-primary" />
          <p className="max-w-xs text-sm font-medium">{message}</p>
        </div>
      </div>
    );
  }

  if (!profile && error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm rounded-3xl border border-border bg-card p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500/10">
            <TriangleAlert size={28} className="text-orange-500" />
          </div>
          <h2 className="mt-5 text-lg font-bold">Couldn&apos;t verify your session</h2>
          <p className="mt-2 text-sm text-muted">{error}</p>
          <button
            type="button"
            onClick={() => refresh()}
            className="mt-6 w-full rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header />

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
            <RouteErrorBoundary>{children}</RouteErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  );
}