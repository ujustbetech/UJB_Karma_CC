import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/adminRequestAuth.mjs";
import { hasAdminAccess } from "@/lib/auth/accessControl";
import { adminDb } from "@/lib/firebase/firebaseAdmin";
import { COLLECTIONS } from "@/lib/utility_collection";
import {
  buildConclaveMeetingPayload,
  mapConclaveMeetingEntry,
} from "@/lib/conclave/adminConclaveApiWorkflow.mjs";

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

function getMeetingRef(conclaveId, meetingId) {
  return adminDb
    .collection(COLLECTIONS.conclaves)
    .doc(conclaveId)
    .collection("meetings")
    .doc(meetingId);
}

export async function GET(req, { params }) {
  const guard = validateAdmin(req);
  if (!guard.ok) {
    return guard.response;
  }

  try {
    const conclaveId = String(params?.id || "").trim();
    const meetingId = String(params?.meetingId || "").trim();
    const snap = await getMeetingRef(conclaveId, meetingId).get();

    if (!snap.exists) {
      return NextResponse.json({ message: "Meeting not found" }, { status: 404 });
    }

    return NextResponse.json({
      meeting: mapConclaveMeetingEntry(snap),
    });
  } catch (error) {
    return NextResponse.json(
      { message: error?.message || "Failed to load conclave meeting" },
      { status: 500 }
    );
  }
}

export async function PATCH(req, { params }) {
  const guard = validateAdmin(req);
  if (!guard.ok) {
    return guard.response;
  }

  try {
    const conclaveId = String(params?.id || "").trim();
    const meetingId = String(params?.meetingId || "").trim();
    const body = await req.json();
    const payload = buildConclaveMeetingPayload(body);

    if (!payload.datetime) {
      return NextResponse.json(
        { message: "Invalid meeting datetime" },
        { status: 400 }
      );
    }

    payload.updatedAt = new Date();

    await getMeetingRef(conclaveId, meetingId).set(payload, { merge: true });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { message: error?.message || "Failed to update conclave meeting" },
      { status: 500 }
    );
  }
}


