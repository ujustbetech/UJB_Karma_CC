import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { db } from "@/firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export async function GET(req) {
  try {
    const token = req.cookies.get("crm_token")?.value;

    if (!token) {
      return NextResponse.json({ message: "No token" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const sessionRef = doc(db, "user_sessions", decoded.sessionId);
    const sessionSnap = await getDoc(sessionRef);

    if (!sessionSnap.exists()) {
      return NextResponse.json({ message: "Session not found" }, { status: 401 });
    }

    const session = sessionSnap.data();

    if (session.revoked || Date.now() > session.expiry) {
      return NextResponse.json({ message: "Session invalid" }, { status: 401 });
    }

    // Sliding refresh
    const sevenDays = 1000 * 60 * 60 * 24 * 7;
    if (session.expiry - Date.now() < sevenDays) {
      await updateDoc(sessionRef, {
        expiry: Date.now() + 1000 * 60 * 60 * 24 * 180,
      });
    }

    return NextResponse.json({
      phone: session.phone,
      role: "user",
      profile: {
        ujbCode: session.ujbCode,
        name: session.name,
        type: session.type,
      },
    });

  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
}