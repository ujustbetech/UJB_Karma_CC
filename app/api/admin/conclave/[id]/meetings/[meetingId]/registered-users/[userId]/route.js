import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/adminRequestAuth.mjs";
import { hasAdminAccess } from "@/lib/auth/accessControl";
import { adminDb } from "@/lib/firebase/firebaseAdmin";
import { COLLECTIONS } from "@/lib/utility_collection";

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
        { message: "Admin conclave API is not configured." },
        { status: 500 }
      ),
    };
  }

  return { ok: true };
}

export async function PATCH(req, { params }) {
  const guard = validateAdmin(req);
  if (!guard.ok) {
    return guard.response;
  }

  try {
    const conclaveId = String(params?.id || "").trim();
    const meetingId = String(params?.meetingId || "").trim();
    const userId = String(params?.userId || "").trim();
    const body = await req.json();

    await adminDb
      .collection(COLLECTIONS.conclaves)
      .doc(conclaveId)
      .collection("meetings")
      .doc(meetingId)
      .collection("registeredUsers")
      .doc(userId)
      .set(
        {
          attendanceStatus: body?.attendanceStatus === true,
          updatedAt: new Date(),
        },
        { merge: true }
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { message: error?.message || "Failed to update attendance" },
      { status: 500 }
    );
  }
}


