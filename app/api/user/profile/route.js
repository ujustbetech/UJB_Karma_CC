import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import {
  adminDb,
  getFirebaseAdminInitError,
} from "@/lib/firebase/firebaseAdmin";
import { publicEnv } from "@/lib/config/publicEnv";
import { serverEnv } from "@/lib/config/serverEnv";
import {
  shouldRefreshUserSession,
  USER_SESSION_MAX_AGE_MS,
  validateUserSessionRecord,
} from "@/lib/auth/userSessionWorkflow.mjs";

const userCollectionName = publicEnv.collections.userDetail;

async function validateUserRequest(req) {
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

function getRequestedUjbCode(req, session) {
  const requested = String(req.nextUrl.searchParams.get("ujbCode") || "").trim();
  const sessionUjbCode = String(session?.ujbCode || "").trim();

  if (requested && requested !== sessionUjbCode) {
    return null;
  }

  return sessionUjbCode || requested;
}

export async function GET(req) {
  const authResult = await validateUserRequest(req);

  if (!authResult.ok) {
    return authResult.response;
  }

  const ujbCode = getRequestedUjbCode(req, authResult.session);

  if (!ujbCode) {
    return NextResponse.json(
      { message: "Missing ujbCode" },
      { status: 400 }
    );
  }

  const docSnap = await adminDb.collection(userCollectionName).doc(ujbCode).get();

  if (!docSnap.exists) {
    return NextResponse.json({ message: "Profile not found" }, { status: 404 });
  }

  return NextResponse.json({
    user: {
      id: docSnap.id,
      ...docSnap.data(),
    },
  });
}

export async function PATCH(req) {
  const authResult = await validateUserRequest(req);

  if (!authResult.ok) {
    return authResult.response;
  }

  const ujbCode = getRequestedUjbCode(req, authResult.session);

  if (!ujbCode) {
    return NextResponse.json(
      { message: "Missing ujbCode" },
      { status: 400 }
    );
  }

  const body = await req.json();
  const update = body && typeof body.update === "object" ? body.update : {};

  await adminDb
    .collection(userCollectionName)
    .doc(ujbCode)
    .set(
      {
        ...update,
        updatedAt: new Date(),
      },
      { merge: true }
    );

  const updatedSnap = await adminDb.collection(userCollectionName).doc(ujbCode).get();

  return NextResponse.json({
    success: true,
    user: {
      id: updatedSnap.id,
      ...updatedSnap.data(),
    },
  });
}
