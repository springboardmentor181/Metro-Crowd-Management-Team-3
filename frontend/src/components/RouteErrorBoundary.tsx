"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function RouteErrorBoundary({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <ErrorBoundary key={pathname} label="this page">
      {children}
    </ErrorBoundary>
  );
}
