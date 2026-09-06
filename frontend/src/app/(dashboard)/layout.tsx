
import type { ReactNode } from "react";

import DashboardShell from "@/components/layout/DashboardShell";
import { AuthProvider } from "@/providers/AuthProvider";
import { LiveSocketProvider } from "@/providers/LiveSocketProvider";
import { FocusedStationProvider } from "@/providers/FocusedStationProvider";
import NotificationToastHost from "@/components/dashboard/NotificationToastHost";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  return (
    <AuthProvider>
    <LiveSocketProvider>
    <FocusedStationProvider>
      <NotificationToastHost />
      <DashboardShell>{children}</DashboardShell>
    </FocusedStationProvider>
    </LiveSocketProvider>
    </AuthProvider>
  );
}
