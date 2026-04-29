import { NextResponse } from "next/server";
import { requireUserSession } from "@/lib/auth/userRequestAuth.mjs";
import { adminDb } from "@/lib/firebase/firebaseAdmin";
import { fetchCpBoardSummaryByUjbCode } from "@/lib/contribution-points/apiWorkflow.mjs";

export async function GET(req) {
  const auth = requireUserSession(req);
  if (!auth.ok) {
    return NextResponse.json(
      { message: auth.message },
      { status: auth.status }
    );
  }

  if (!adminDb) {
    return NextResponse.json(
      { message: "Contribution point API is not configured." },
      { status: 500 }
    );
  }

  try {
    const summary = await fetchCpBoardSummaryByUjbCode(adminDb, auth.user.ujbCode);
    return NextResponse.json(summary);
  } catch (error) {
    return NextResponse.json(
      { message: error?.message || "Failed to fetch contribution points" },
      { status: 500 }
    );
  }
}
