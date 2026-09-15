
import { NextResponse, type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";
import { MOCK_AUTH_COOKIE_NAME } from "@/lib/auth/mock";


const PROTECTED_PREFIXES = [
  "/dashboard",
  "/train-scheduling",
  "/crowd-monitor",
  "/live-trains",
  "/stations",
  "/alerts",
  "/analytics",
  "/profile",
  "/ai-prediction",
  "/checkin-checkout",
  "/enquiries",
  "/notifications",
  "/reports",
  "/system-logs",
  "/system-status",
  "/users",
];

const AUTH_DISABLED = process.env.NEXT_PUBLIC_AUTH_DISABLED === "true";

export async function proxy(request: NextRequest) {
  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    request.nextUrl.pathname.startsWith(prefix),
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  if (AUTH_DISABLED) {
    
    if (!request.cookies.get(MOCK_AUTH_COOKIE_NAME)?.value) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirectTo", request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  const { response, user } = await updateSession(request);

  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/train-scheduling/:path*",
    "/crowd-monitor/:path*",
    "/live-trains/:path*",
    "/stations/:path*",
    "/alerts/:path*",
    "/analytics/:path*",
    "/profile/:path*",
    "/ai-prediction/:path*",
    "/checkin-checkout/:path*",
    "/enquiries/:path*",
    "/notifications/:path*",
    "/reports/:path*",
    "/system-logs/:path*",
    "/system-status/:path*",
    "/users/:path*",
  ],
};
