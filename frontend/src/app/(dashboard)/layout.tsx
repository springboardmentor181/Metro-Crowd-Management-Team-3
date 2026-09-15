
import type { ReactNode } from "react";

import DashboardShell from "@/components/layout/DashboardShell";
import { AuthProvider } from "@/providers/AuthProvider";
import { LiveSocketProvider } from "@/providers/LiveSocketProvider";
import { FocusedStationProvider } from "@/providers/FocusedStationProvider";
import NotificationToastHost from "@/components/dashboard/NotificationToastHost";
import EmergencyAlertBanner from "@/components/dashboard/EmergencyAlertBanner";
import ChatWidget from "@/components/chatbot/ChatWidget";

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
      <EmergencyAlertBanner />
      <NotificationToastHost />
      <DashboardShell>{children}</DashboardShell>
      <ChatWidget />
    </FocusedStationProvider>
    </LiveSocketProvider>
    </AuthProvider>
  );
}