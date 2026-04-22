import { NextResponse } from "next/server";
import {
  adminAuth,
  adminDb,
  getFirebaseAdminInitError,
} from "@/lib/firebase/firebaseAdmin";
import { hasAdminAccess } from "@/lib/auth/accessControl";
import {
  buildBootstrapAdminRecord,
  buildAdminSessionPayload,
  findAuthorizedAdmin,
  shouldBootstrapAdmin,
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
    const adminUsersCollection = adminDb.collection("AdminUsers");
    const adminSnapshot = await adminUsersCollection.get();

    if (shouldBootstrapAdmin(adminSnapshot.docs)) {
      const bootstrapAdmin = buildBootstrapAdminRecord(decoded);

      if (!bootstrapAdmin.email) {
        return NextResponse.json(
          { success: false, message: "Missing admin email" },
          { status: 401 }
        );
      }

      await adminUsersCollection.doc(bootstrapAdmin.email).set(bootstrapAdmin);

      const sessionPayload = buildAdminSessionPayload(bootstrapAdmin, decoded);
      const response = NextResponse.json({
        success: true,
        admin: sessionPayload,
        bootstrap: true,
      });

      setAdminSessionCookie(response, createAdminSessionToken(sessionPayload));

      return response;
    }

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
