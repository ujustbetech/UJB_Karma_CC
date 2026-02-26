// /app/api/logout/route.js

import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { db } from "@/firebaseConfig";
import { doc, updateDoc } from "firebase/firestore";

export async function POST(req) {
  const token = req.cookies.get("crm_token")?.value;

  if (token) {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    await updateDoc(doc(db, "user_sessions", decoded.sessionId), {
      revoked: true,
    });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set("crm_token", "", { expires: new Date(0) });

  return response;
}