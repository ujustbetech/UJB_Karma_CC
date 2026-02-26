// /app/api/logout-all/route.js

import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, updateDoc } from "firebase/firestore";

export async function POST(req) {
  const token = req.cookies.get("crm_token")?.value;
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  const q = query(
    collection(db, "user_sessions"),
    where("phone", "==", decoded.phone)
  );

  const snapshot = await getDocs(q);

  for (const docSnap of snapshot.docs) {
    await updateDoc(docSnap.ref, { revoked: true });
  }

  return NextResponse.json({ success: true });
}