"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  LayoutDashboard,
  TrainFront,
  Users,
  CalendarClock,
  BarChart3,
  Bell,
  UserCircle2,
  UserCog,
  LogOut,
  ChevronLeft,
  ChevronRight,
  MapPin,
  MessageCircleQuestion,
  FileBarChart,
  ServerCog,
  Database,
  Radio,
  Cpu,
  CheckCircle2,
  X,
} from "lucide-react";

import { useState } from "react";

import { useAuth } from "@/providers/AuthProvider";
import { useRoutePrefetch, isPrefetchableRoute } from "@/hooks/useRoutePrefetch";
import { useApiData } from "@/hooks/useApiData";
import { getSystemStatus } from "@/lib/api/admin";
import { queryKeys } from "@/lib/queryKeys";
import type { UserRole } from "@/lib/api/types";

interface MenuItem {
  title: string;
  href: string;
  icon: typeof LayoutDashboard;

  roles?: UserRole[];
}

const menus: MenuItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Crowd Monitor",
    href: "/crowd-monitor",
    icon: Users,
  },
  {
    title: "Train Scheduling",
    href: "/train-scheduling",
    icon: CalendarClock,
    roles: ["admin", "operator"],
  },
  {
    title: "Live Trains",
    href: "/live-trains",
    icon: TrainFront,
  },
  {
    title: "Stations",
    href: "/stations",
    icon: MapPin,
  },
  {
    title: "Alerts",
    href: "/alerts",
    icon: Bell,
  },
  {
    title: "Enquiries",
    href: "/enquiries",
    icon: MessageCircleQuestion,
  },
  {
    title: "AI Prediction & Analytics",
    href: "/analytics",
    icon: BarChart3,
    roles: ["admin", "operator"],
  },
  {
    title: "Reports",
    href: "/reports",
    icon: FileBarChart,
  },
  {
    title: "Users",
    href: "/users",
    icon: UserCog,
    roles: ["admin"],
  },
  {
    title: "System Status & Logs",
    href: "/system-status",
    icon: ServerCog,
    roles: ["admin", "operator"],
  },
  {
    title: "Profile",
    href: "/profile",
    icon: UserCircle2,
  },
];

function SidebarSystemStatus() {
  const { data } = useApiData(
    queryKeys.systemStatus,
    (signal) => getSystemStatus(signal),
    [],
    15000,
  );

  const dbOk = data?.database.connected ?? false;
  const socketOk = (data?.websocket_connections ?? 0) > 0;
  const workersOk =
    (data?.crowd_simulator_running ?? false) && (data?.train_tracker_running ?? false);
  const allOk = !!data && dbOk && socketOk && workersOk;

  return (
    <Link
      href="/system-status"
      className="mb-3 block rounded-2xl border border-sidebar-border bg-background/60 p-3 transition hover:border-primary hover:bg-background"
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
            allOk ? "bg-emerald-500/10 text-emerald-500" : "bg-primary/10 text-primary"
          }`}
        >
          {allOk ? <CheckCircle2 size={22} /> : <ServerCog size={22} />}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold">System Status</p>
          <p
            className={`truncate text-xs font-semibold ${
              !data ? "text-muted" : allOk ? "text-emerald-500" : "text-amber-500"
            }`}
          >
            {!data ? "Checking..." : allOk ? "All Operational" : "Needs attention"}
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-sidebar-border pt-3 text-[10px] font-semibold text-muted">
        <span className="flex items-center gap-1">
          <Database size={12} className={dbOk ? "text-emerald-500" : "text-red-500"} />
          DB
        </span>
        <span className="flex items-center gap-1">
          <Radio size={12} className={socketOk ? "text-emerald-500" : "text-amber-500"} />
          Socket
        </span>
        <span className="flex items-center gap-1">
          <Cpu size={12} className={workersOk ? "text-emerald-500" : "text-amber-500"} />
          Workers
        </span>
      </div>
    </Link>
  );
}

interface SidebarProps {
  // Mobile drawer state - the sidebar is always `hidden`/off-canvas
  // below the `lg` breakpoint unless `mobileOpen` is true, in which
  // case it renders as a fixed, full-height overlay drawer instead
  // of the sticky in-flow column used on large screens.
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export default function Sidebar({ mobileOpen = false, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const { profile, signOut } = useAuth();
  const prefetchRoute = useRoutePrefetch();

  const [collapsed, setCollapsed] = useState(false);

  const visibleMenus = menus.filter(
    (menu) => !menu.roles || (profile && menu.roles.includes(profile.role)),
  );

  return (
    <>
      {/* Backdrop - only rendered/visible on mobile/tablet while the
          drawer is open, tapping it closes the menu. */}
      <div
        onClick={onCloseMobile}
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          mobileOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 h-screen w-[85vw] max-w-80 shrink-0 border-r border-sidebar-border bg-sidebar transition-all duration-300 ease-in-out lg:sticky lg:top-0 lg:z-auto lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } ${collapsed ? "lg:w-24" : "lg:w-72"}`}
      >
      <div className="flex h-full flex-col">

        <div
          className={`flex h-20 items-center gap-2 border-b border-sidebar-border ${
            collapsed ? "justify-center px-2" : "justify-between px-5"
          }`}
        >

          <Link
            href="/dashboard"
            onClick={onCloseMobile}
            className="flex min-w-0 items-center gap-3"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-white">

              <TrainFront size={24} />

            </div>

            {!collapsed && (
              <div className="min-w-0">

                <h2 className="truncate text-xl font-black leading-none">

                  MetroFlow

                </h2>

                <p className="mt-1 truncate text-xs text-muted">

                  Metro Operations

                </p>

              </div>
            )}
          </Link>

          {/* Desktop-only collapse toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden rounded-xl border border-sidebar-border bg-background/40 p-2 transition hover:border-primary hover:bg-primary/10 hover:text-primary lg:block"
            aria-label="Collapse sidebar"
          >
            {collapsed ? (
              <ChevronRight size={18} />
            ) : (
              <ChevronLeft size={18} />
            )}
          </button>

          {/* Mobile/tablet-only close button for the drawer */}
          <button
            onClick={onCloseMobile}
            className="rounded-xl border border-sidebar-border bg-background/40 p-2 transition hover:border-primary hover:bg-primary/10 hover:text-primary lg:hidden"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>

        </div>

        <div className="flex-1 space-y-1.5 overflow-y-auto p-4">

          {visibleMenus.map((menu) => {
            const Icon = menu.icon;

            const active = pathname === menu.href;
            const prefetchableHref = menu.href;
            const handlePrefetch = isPrefetchableRoute(prefetchableHref)
              ? () => prefetchRoute(prefetchableHref)
              : undefined;

            return (
              <Link
                key={menu.href}
                href={menu.href}
                onMouseEnter={handlePrefetch}
                onFocus={handlePrefetch}
                onClick={onCloseMobile}
                title={collapsed ? menu.title : undefined}
                className={`flex min-h-12 items-center gap-3 rounded-xl text-sm transition-all duration-200 ${
                  collapsed ? "justify-center px-0" : "px-3.5"
                } ${
                  active
                    ? "bg-primary text-white shadow-md"
                    : "text-muted hover:bg-primary/15 hover:text-primary active:bg-primary/25"
                }`}
              >
                <Icon
                  size={20}
                  className="shrink-0"
                />

                {!collapsed && (
                  <span className="truncate font-semibold">

                    {menu.title}

                  </span>
                )}
              </Link>
            );
          })}

        </div>

        <div className="border-t border-sidebar-border p-4">
          {!collapsed && <SidebarSystemStatus />}

          <button
            type="button"
            onClick={signOut}
            title={collapsed ? "Logout" : undefined}
            className={`flex w-full items-center gap-3 rounded-xl py-3 text-red-500 transition hover:bg-red-50 dark:hover:bg-red-500/10 ${
              collapsed ? "justify-center px-0" : "px-3.5"
            }`}
          >

            <LogOut
              size={20}
              className="shrink-0"
            />

            {!collapsed && (
              <span className="font-semibold">

                Logout

              </span>
            )}

          </button>

        </div>

      </div>

      </aside>
    </>
  );
}