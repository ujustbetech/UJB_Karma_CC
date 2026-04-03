import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { adminDb } from "@/lib/firebase/firebaseAdmin";
import { clearAdminSessionCookie } from "@/lib/auth/adminSession";
import { serverEnv } from "@/lib/config/serverEnv";
import { getLogoutCookieOptions } from "@/lib/auth/userSessionWorkflow.mjs";

export async function POST(req) {
  try {
    const token = req.cookies.get("crm_token")?.value;

    if (token) {
      try {
        const decoded = jwt.verify(token, serverEnv.jwtSecret);
        const sessionRef = adminDb.collection("user_sessions").doc(decoded.sessionId);

        await sessionRef.update({ revoked: true });
      } catch {
        console.log("Session already expired");
      }
    }
  } catch {
    console.log("Logout error");
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(
    "crm_token",
    "",
    getLogoutCookieOptions(serverEnv.isProduction)
  );
  clearAdminSessionCookie(response);

  return response;
}
