import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { db } from "@/firebaseConfig";
import { doc, updateDoc } from "firebase/firestore";

export async function POST(req) {

  try {

    const token = req.cookies.get("crm_token")?.value;

    if (token) {

      try {

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const sessionRef = doc(db, "user_sessions", decoded.sessionId);

        await updateDoc(sessionRef, {
          revoked: true
        });

      } catch (err) {
        console.log("Session already expired");
      }

    }

  } catch (err) {
    console.log("Logout error");
  }

  // 🔴 ALWAYS DELETE COOKIE
  const response = NextResponse.json({ success: true });

  response.cookies.set("crm_token", "", {
    httpOnly: true,
    expires: new Date(0),
    path: "/",                 // 🔥 VERY IMPORTANT
    secure: true,
    sameSite: "strict"
  });

  return response;
}