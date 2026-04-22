import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE_NAME,
  USER_COOKIE_NAME,
} from "@/lib/auth/accessControl";

export function proxy(req) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/user")) {
    const token = req.cookies.get(USER_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  if (pathname.startsWith("/admin")) {
    const adminToken = req.cookies.get(ADMIN_COOKIE_NAME)?.value;

    if (!adminToken) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/user/:path*", "/admin/:path*"],
};
