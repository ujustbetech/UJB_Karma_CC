import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";
import { serverEnv } from "@/lib/config/serverEnv";
import {
  shouldRefreshUserSession,
  USER_SESSION_MAX_AGE_MS,
  validateUserSessionRecord,
} from "@/lib/auth/userSessionWorkflow.mjs";

export async function validateUserRequest(req, adminDb, getFirebaseAdminInitError) {
  const firebaseAdminInitError = getFirebaseAdminInitError();

  if (firebaseAdminInitError || !adminDb) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          message:
            "Profile access is not configured. Missing or invalid Firebase Admin credentials.",
        },
        { status: 500 }
      ),
    };
  }

  const token = req.cookies.get("crm_token")?.value;

  if (!token) {
    return {
      ok: false,
      response: NextResponse.json({ message: "Unauthorized" }, { status: 401 }),
    };
  }

  try {
    const decoded = jwt.verify(token, serverEnv.jwtSecret);
    const sessionRef = adminDb.collection("user_sessions").doc(decoded.sessionId);
    const sessionSnap = await sessionRef.get();

    if (!sessionSnap.exists) {
      return {
        ok: false,
        response: NextResponse.json(
          { message: "Session not found" },
          { status: 401 }
        ),
      };
    }

    const session = sessionSnap.data();
    const validation = validateUserSessionRecord(session, Date.now());

    if (!validation.ok) {
      return {
        ok: false,
        response: NextResponse.json(
          { message: "Session invalid" },
          { status: 401 }
        ),
      };
    }

    if (shouldRefreshUserSession(session, Date.now())) {
      await sessionRef.update({
        expiry: Date.now() + USER_SESSION_MAX_AGE_MS,
      });
    }

    return { ok: true, session };
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ message: "Unauthorized" }, { status: 401 }),
    };
  }
}
