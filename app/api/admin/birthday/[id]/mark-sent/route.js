import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/adminRequestAuth.mjs";
import { hasAdminAccess } from "@/lib/auth/accessControl";
import { adminDb } from "@/lib/firebase/firebaseAdmin";
import { COLLECTIONS } from "@/lib/utility_collection";
import { markBirthdayMessageSent } from "@/lib/birthday/adminBirthdayApiWorkflow";

function validateAdmin(req) {
  const auth = requireAdminSession(req, hasAdminAccess);
  if (!auth.ok) {
    return {
      ok: false,
      response: NextResponse.json({ message: auth.message }, { status: auth.status }),
    };
  }
  if (!adminDb) {
    return {
      ok: false,
      response: NextResponse.json({ message: "Birthday API is not configured." }, { status: 500 }),
    };
  }
  return { ok: true };
}

export async function PATCH(req, { params }) {
  const guard = validateAdmin(req);
  if (!guard.ok) return guard.response;

  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    await markBirthdayMessageSent(
      adminDb,
      COLLECTIONS.userDetail,
      id,
      body?.sentDate || ""
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { message: error?.message || "Failed to mark birthday message sent" },
      { status: 500 }
    );
  }
}


