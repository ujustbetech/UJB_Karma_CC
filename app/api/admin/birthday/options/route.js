import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/adminRequestAuth.mjs";
import { hasAdminAccess } from "@/lib/auth/accessControl";
import { adminDb } from "@/lib/firebase/firebaseAdmin";
import { COLLECTIONS } from "@/lib/utility_collection";
import { fetchBirthdayUserOptions } from "@/lib/birthday/adminBirthdayApiWorkflow.mjs";

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

export async function GET(req) {
  const guard = validateAdmin(req);
  if (!guard.ok) return guard.response;

  try {
    const users = await fetchBirthdayUserOptions(adminDb, COLLECTIONS.userDetail);
    return NextResponse.json({ users });
  } catch (error) {
    return NextResponse.json(
      { message: error?.message || "Failed to load birthday users" },
      { status: 500 }
    );
  }
}


