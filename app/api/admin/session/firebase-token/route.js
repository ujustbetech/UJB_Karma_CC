import { NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken } from "@/lib/auth/adminSession";
import { hasAdminAccess } from "@/lib/auth/accessControl";
import { adminAuth } from "@/lib/firebase/firebaseAdmin";

export async function GET(req) {
  try {
    const token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json({ message: "No admin token" }, { status: 401 });
    }

    const decoded = verifyAdminSessionToken(token);

    if (!decoded?.email || !hasAdminAccess(decoded.role)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    if (!adminAuth) {
      return NextResponse.json({ message: "Firebase admin is not configured" }, { status: 500 });
    }

    const uid = `admin:${String(decoded.email).toLowerCase()}`;
    const customToken = await adminAuth.createCustomToken(uid, {
      role: decoded.role || "Admin",
      email: String(decoded.email).toLowerCase(),
      admin: true,
    });

    return NextResponse.json({ success: true, customToken });
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
}
