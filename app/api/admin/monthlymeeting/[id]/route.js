import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/adminRequestAuth.mjs";
import { hasAdminAccess } from "@/lib/auth/accessControl";
import { adminDb } from "@/lib/firebase/firebaseAdmin";
import { COLLECTIONS } from "@/lib/utility_collection";
import { mapAdminMeetingListEntry } from "@/lib/monthlymeeting/adminMonthlyMeetingApiWorkflow.mjs";

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
      response: NextResponse.json(
        { message: "Admin monthly meeting API is not configured." },
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
    const resolvedParams = await params;
    const id = String(resolvedParams?.id || "").trim();
    const docSnap = await adminDb.collection(COLLECTIONS.monthlyMeeting).doc(id).get();

    if (!docSnap.exists) {
      return NextResponse.json({ message: "Monthly meeting not found" }, { status: 404 });
    }

    const registeredUsers = await docSnap.ref.collection("registeredUsers").get();
    return NextResponse.json({
      event: mapAdminMeetingListEntry(docSnap, registeredUsers.size),
    });
  } catch (error) {
    return NextResponse.json(
      { message: error?.message || "Failed to load monthly meeting" },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  const guard = validateAdmin(req);
  if (!guard.ok) {
    return guard.response;
  }

  try {
    const resolvedParams = await params;
    const id = String(resolvedParams?.id || "").trim();
    if (!id) {
      return NextResponse.json({ message: "Missing event id" }, { status: 400 });
    }

    await adminDb.collection(COLLECTIONS.monthlyMeeting).doc(id).delete();
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { message: error?.message || "Failed to delete monthly meeting" },
      { status: 500 }
    );
  }
}

