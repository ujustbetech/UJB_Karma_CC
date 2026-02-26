// /app/api/admin/force-logout/route.js

import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, updateDoc } from "firebase/firestore";

export async function POST(req) {
  const { phone } = await req.json();

  const q = query(
    collection(db, "user_sessions"),
    where("phone", "==", phone)
  );

  const snapshot = await getDocs(q);

  for (const docSnap of snapshot.docs) {
    await updateDoc(docSnap.ref, { revoked: true });
  }

  return NextResponse.json({ success: true });
}