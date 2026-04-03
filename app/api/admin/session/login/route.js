import { NextResponse } from "next/server";
import {
  adminAuth,
  adminDb,
  getFirebaseAdminInitError,
} from "@/lib/firebase/firebaseAdmin";
import { hasAdminAccess } from "@/lib/auth/accessControl";
import {
  buildAdminSessionPayload,
  findAuthorizedAdmin,
} from "@/lib/auth/adminAccessWorkflow.mjs";
import {
  createAdminSessionToken,
  setAdminSessionCookie,
} from "@/lib/auth/adminSession";

export async function POST(req) {
  try {
    const firebaseAdminInitError = getFirebaseAdminInitError();

    if (firebaseAdminInitError || !adminAuth || !adminDb) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Admin login is not configured. Missing or invalid Firebase Admin credentials.",
        },
        { status: 500 }
      );
    }

    const { idToken } = await req.json();

    if (!idToken) {
      return NextResponse.json(
        { success: false, message: "Missing id token" },
        { status: 400 }
      );
    }

    const decoded = await adminAuth.verifyIdToken(idToken);
    const adminSnapshot = await adminDb.collection("AdminUsers").get();
    const adminMatch = findAuthorizedAdmin(
      adminSnapshot.docs,
      decoded.email,
      hasAdminAccess
    );

    if (!adminMatch.ok) {
      return NextResponse.json(
        { success: false, message: adminMatch.message },
        { status: adminMatch.status }
      );
    }

    const sessionPayload = buildAdminSessionPayload(adminMatch.adminData, decoded);
    const response = NextResponse.json({
      success: true,
      admin: sessionPayload,
    });

    setAdminSessionCookie(response, createAdminSessionToken(sessionPayload));

    return response;
  } catch (error) {
    console.error("Admin login error:", error);

    return NextResponse.json(
      { success: false, message: "Admin login failed" },
      { status: 500 }
    );
  }
}
