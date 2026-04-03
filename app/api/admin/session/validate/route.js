import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE_NAME,
  verifyAdminSessionToken,
} from "@/lib/auth/adminSession";
import { hasAdminAccess } from "@/lib/auth/accessControl";
import { validateAdminSessionAccess } from "@/lib/auth/adminAccessWorkflow.mjs";

export async function GET(req) {
  try {
    const token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json({ message: "No admin token" }, { status: 401 });
    }

    const decoded = verifyAdminSessionToken(token);
    const validation = validateAdminSessionAccess(decoded, hasAdminAccess);

    if (!validation.ok) {
      return NextResponse.json(
        { message: validation.message },
        { status: validation.status }
      );
    }

    return NextResponse.json({ admin: validation.admin });
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
}
