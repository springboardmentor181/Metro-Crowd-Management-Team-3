"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import {
  LayoutDashboard,
  TrainFront,
  Users,
  CalendarClock,
  BarChart3,
  Bell,
  UserCircle2,
  LogOut,
  ChevronLeft,
  ChevronRight,
  MapPin,
} from "lucide-react";

import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";

const menus = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Crowd Monitor",
    href: "/dashboard#crowd",
    icon: Users,
  },
  {
    title: "Train Scheduling",
    href: "/dashboard#frequency",
    icon: CalendarClock,
  },
  {
    title: "Live Trains",
    href: "/dashboard#trains",
    icon: TrainFront,
  },
  {
    title: "Stations",
    href: "/dashboard#stations",
    icon: MapPin,
  },
  {
    title: "Alerts",
    href: "/dashboard#alerts",
    icon: Bell,
  },
  {
    title: "Analytics",
    href: "/dashboard#analytics",
    icon: BarChart3,
  },
  {
    title: "Profile",
    href: "/profile",
    icon: UserCircle2,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const [collapsed, setCollapsed] = useState(false);
  const [userName, setUserName] = useState("Metro User");
  const [role, setRole] = useState("Passenger");

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      const user = data.user;
      const metadata = user?.user_metadata;
      const appRole =
        user?.app_metadata?.role ??
        metadata?.requested_role ??
        "passenger";

      setUserName(
        metadata?.full_name ??
          metadata?.name ??
          user?.email?.split("@")[0] ??
          "Metro User",
      );
      setRole(String(appRole));
    });
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside
      className={`sticky top-0 hidden h-screen shrink-0 border-r border-border bg-card transition-all duration-300 lg:block ${
        collapsed ? "w-24" : "w-72"
      }`}
    >
      <div className="flex h-full flex-col">

        <div className="flex h-20 items-center justify-between border-b border-border px-5">

          <Link
            href="/dashboard"
            className="flex min-w-0 items-center gap-3"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-white">

              <TrainFront size={24} />

            </div>

            {!collapsed && (
              <div>

                <h2 className="text-xl font-black leading-none">

                  MetroFlow

                </h2>

                <p className="mt-1 text-xs text-muted">

                  Metro Operations

                </p>

              </div>
            )}
          </Link>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="rounded-xl border border-border p-2 transition hover:bg-muted"
            aria-label="Collapse sidebar"
          >
            {collapsed ? (
              <ChevronRight size={18} />
            ) : (
              <ChevronLeft size={18} />
            )}
          </button>

        </div>

        <div className="flex-1 space-y-1.5 overflow-y-auto p-4">

          {menus.map((menu) => {
            const Icon = menu.icon;

            const active = pathname === menu.href;

            return (
              <Link
                key={menu.href}
                href={menu.href}
                className={`flex min-h-12 items-center gap-3 rounded-xl px-3.5 text-sm transition-all duration-200 ${
                  active
                    ? "bg-[#183c22] text-white shadow-md"
                    : "text-muted hover:bg-[#183c22] hover:text-white active:bg-[#0f2b18]"
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

        <div className="border-t border-border p-4">
          {!collapsed && (
            <Link
              href="/profile"
              className="mb-3 flex items-center gap-3 rounded-2xl border border-border bg-background p-3 transition hover:border-primary"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <UserCircle2 size={25} />
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-bold">
                  {userName}
                </p>
                <p className="text-xs capitalize text-muted">
                  {role}
                </p>
              </div>
            </Link>
          )}

          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-red-500 transition hover:bg-red-50 dark:hover:bg-red-500/10"
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
  );

}