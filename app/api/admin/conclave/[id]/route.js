import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/adminRequestAuth.mjs";
import { hasAdminAccess } from "@/lib/auth/accessControl";
import { adminDb } from "@/lib/firebase/firebaseAdmin";
import { COLLECTIONS } from "@/lib/utility_collection";
import {
  buildConclaveUpdatePayload,
  mapConclaveListEntry,
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

export async function GET(req, { params }) {
  const guard = validateAdmin(req);
  if (!guard.ok) {
    return guard.response;
  }

  try {
    const id = String(params?.id || "").trim();
    const docRef = adminDb.collection(COLLECTIONS.conclaves).doc(id);
    const [conclaveSnap, meetingsSnap] = await Promise.all([
      docRef.get(),
      docRef.collection("meetings").get(),
    ]);

    if (!conclaveSnap.exists) {
      return NextResponse.json({ message: "Conclave not found" }, { status: 404 });
    }

    const meetings = meetingsSnap.docs.map(mapConclaveMeetingEntry);
    meetings.sort(
      (a, b) =>
        new Date(b.datetime || 0).getTime() - new Date(a.datetime || 0).getTime()
    );

    return NextResponse.json({
      conclave: mapConclaveListEntry(conclaveSnap),
      meetings,
    });
  } catch (error) {
    return NextResponse.json(
      { message: error?.message || "Failed to load conclave" },
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
    const id = String(params?.id || "").trim();
    const body = await req.json();
    const payload = buildConclaveUpdatePayload(body);

    if (!payload.startDate || !payload.initiationDate) {
      return NextResponse.json(
        { message: "Invalid conclave dates" },
        { status: 400 }
      );
    }

    await adminDb.collection(COLLECTIONS.conclaves).doc(id).set(payload, { merge: true });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { message: error?.message || "Failed to update conclave" },
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
    const id = String(params?.id || "").trim();
    await adminDb.collection(COLLECTIONS.conclaves).doc(id).delete();
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { message: error?.message || "Failed to delete conclave" },
      { status: 500 }
    );
  }
}


