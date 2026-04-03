import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { adminDb } from "@/lib/firebase/firebaseAdmin";
import { serverEnv } from "@/lib/config/serverEnv";
import {
  buildUserSessionResponse,
  shouldRefreshUserSession,
  USER_SESSION_MAX_AGE_MS,
  validateUserSessionRecord,
} from "@/lib/auth/userSessionWorkflow.mjs";

export async function GET(req) {
  try {
    const token = req.cookies.get("crm_token")?.value;

    if (!token) {
      return NextResponse.json({ message: "No token" }, { status: 401 });
    }

    const decoded = jwt.verify(token, serverEnv.jwtSecret);
    const sessionRef = adminDb.collection("user_sessions").doc(decoded.sessionId);
    const sessionSnap = await sessionRef.get();

    if (!sessionSnap.exists()) {
      return NextResponse.json({ message: "Session not found" }, { status: 401 });
    }

    const session = sessionSnap.data();
    const validation = validateUserSessionRecord(session, Date.now());

    if (!validation.ok) {
      return NextResponse.json({ message: "Session invalid" }, { status: 401 });
    }

    if (shouldRefreshUserSession(session, Date.now())) {
      await sessionRef.update({
        expiry: Date.now() + USER_SESSION_MAX_AGE_MS,
      });
    }

    return NextResponse.json(buildUserSessionResponse(session));
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
}
