// /app/api/admin/force-logout/route.js

import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/firebaseAdmin";

export async function POST(req) {
  const { phone } = await req.json();

  const snapshot = await adminDb
    .collection("user_sessions")
    .where("phone", "==", phone)
    .get();

  for (const docSnap of snapshot.docs) {
    await docSnap.ref.update({ revoked: true });
  }

  return NextResponse.json({ success: true });
}
