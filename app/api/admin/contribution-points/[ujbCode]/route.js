import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/adminRequestAuth.mjs";
import { hasAdminAccess } from "@/lib/auth/accessControl";
import { adminDb } from "@/lib/firebase/firebaseAdmin";
import { fetchCpBoardSummaryByUjbCode } from "@/lib/contribution-points/apiWorkflow.mjs";

function validateAdmin(req) {
  const auth = requireAdminSession(req, hasAdminAccess);
  if (!auth.ok) {
    return {
      ok: false,
      response: NextResponse.json(
        { message: auth.message },
        { status: auth.status }
      ),
    };
  }

  if (!adminDb) {
    return {
      ok: false,
      response: NextResponse.json(
        { message: "Contribution point API is not configured." },
        { status: 500 }
      ),
    };
  }

  return { ok: true };
}

export async function GET(req, { params }) {
  const guard = validateAdmin(req);
  if (!guard.ok) {
    return guard.response;
  }

  try {
    const ujbCode = String(params?.ujbCode || "").trim();
    if (!ujbCode) {
      return NextResponse.json({ message: "Missing ujbCode" }, { status: 400 });
    }

    const summary = await fetchCpBoardSummaryByUjbCode(adminDb, ujbCode);
    return NextResponse.json(summary);
  } catch (error) {
    return NextResponse.json(
      { message: error?.message || "Failed to fetch CP summary" },
      { status: 500 }
    );
  }
}
