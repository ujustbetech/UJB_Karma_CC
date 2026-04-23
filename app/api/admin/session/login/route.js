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

function buildHistoryEntry({
  type,
  actorEmail = "",
  actorName = "",
  description = "",
}) {
  return {
    type: String(type || "").trim() || "login",
    actorEmail: String(actorEmail || "").trim(),
    actorName: String(actorName || "").trim(),
    description: String(description || "").trim(),
    timestamp: new Date(),
  };
}

function appendHistory(existingHistory, entry) {
  const nextHistory = Array.isArray(existingHistory) ? [...existingHistory] : [];
  nextHistory.push(entry);
  return nextHistory.slice(-25);
}

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
    const adminDocRef = adminMatch.adminDocId
      ? adminUsersCollection.doc(adminMatch.adminDocId)
      : null;

    if (adminDocRef) {
      const nextHistory = appendHistory(
        adminMatch.adminData.history,
        buildHistoryEntry({
          type:
            String(adminMatch.adminData.inviteStatus || "").trim().toLowerCase() === "active"
              ? "login"
              : "activated",
          actorEmail: decoded.email || "",
          actorName: adminMatch.adminData.name || decoded.name || "",
          description:
            String(adminMatch.adminData.inviteStatus || "").trim().toLowerCase() === "active"
              ? "Admin signed in successfully."
              : "Admin completed setup and became active.",
        })
      );

      await adminDocRef.set(
        {
          inviteStatus: "active",
          lastLoginAt: new Date(),
          uid: adminMatch.adminData.uid || decoded.uid || "",
          photo: adminMatch.adminData.photo || decoded.picture || null,
          updatedAt: new Date(),
          history: nextHistory,
        },
        { merge: true }
      );
    }

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
