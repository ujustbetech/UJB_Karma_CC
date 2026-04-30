import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { adminDb } from "@/lib/firebase/firebaseAdmin";
import { serverEnv } from "@/lib/config/serverEnv";
import { getLogoutAllRevocations } from "@/lib/auth/userSessionWorkflow.mjs";

export async function POST(req) {
  const token = req.cookies.get("crm_token")?.value;
  const decoded = jwt.verify(token, serverEnv.jwtSecret);

  const snapshot = await adminDb
    .collection("user_sessions")
    .where("phone", "==", decoded.phone)
    .get();

  for (const sessionDoc of getLogoutAllRevocations(snapshot.docs)) {
    await sessionDoc.ref.update({ revoked: true });
  }

  return NextResponse.json({ success: true });
}


