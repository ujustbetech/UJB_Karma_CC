import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/adminRequestAuth.mjs";
import { hasAdminAccess } from "@/lib/auth/accessControl";
import { adminDb } from "@/lib/firebase/firebaseAdmin";
import { COLLECTIONS } from "@/lib/utility_collection";
import {
  deleteBirthdayEntry,
  fetchBirthdayEntry,
  updateBirthdayEntry,
} from "@/lib/birthday/adminBirthdayApiWorkflow.mjs";
import { parseDobInput } from "@/services/birthdayShared";

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

export async function GET(req, { params }) {
  const guard = validateAdmin(req);
  if (!guard.ok) return guard.response;

  try {
    const entry = await fetchBirthdayEntry(adminDb, COLLECTIONS.birthdayCanva, params?.id);
    if (!entry) {
      return NextResponse.json({ message: "Birthday record not found" }, { status: 404 });
    }
    return NextResponse.json({ entry });
  } catch (error) {
    return NextResponse.json(
      { message: error?.message || "Failed to load birthday entry" },
      { status: 500 }
    );
  }
}

export async function PATCH(req, { params }) {
  const guard = validateAdmin(req);
  if (!guard.ok) return guard.response;

  try {
    const body = await req.json();
    await updateBirthdayEntry(adminDb, COLLECTIONS.birthdayCanva, params?.id, {
      ...body,
      dobTimestamp: body?.dob ? parseDobInput(body.dob) : undefined,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { message: error?.message || "Failed to update birthday entry" },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  const guard = validateAdmin(req);
  if (!guard.ok) return guard.response;

  try {
    await deleteBirthdayEntry(adminDb, COLLECTIONS.birthdayCanva, params?.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { message: error?.message || "Failed to delete birthday entry" },
      { status: 500 }
    );
  }
}


