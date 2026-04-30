import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/adminRequestAuth.mjs";
import { hasAdminAccess } from "@/lib/auth/accessControl";
import { adminDb } from "@/lib/firebase/firebaseAdmin";
import { COLLECTIONS } from "@/lib/utility_collection";
import { buildConclaveMeetingPayload } from "@/lib/conclave/adminConclaveApiWorkflow.mjs";

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

export async function POST(req, context) {
  const guard = validateAdmin(req);
  if (!guard.ok) {
    return guard.response;
  }

  try {
    const params = await context.params;
    const id = String(params?.id || "").trim();
    if (!id) throw new Error("ID is required");
    const body = await req.json();

    if (!body?.meetingName || !body?.datetime) {
      return NextResponse.json(
        { message: "Meeting name and datetime are required" },
        { status: 400 }
      );
    }

    const payload = buildConclaveMeetingPayload(body);
    if (!payload.datetime) {
      return NextResponse.json(
        { message: "Invalid meeting datetime" },
        { status: 400 }
      );
    }
    const created = await adminDb
      .collection(COLLECTIONS.conclaves)
      .doc(id)
      .collection("meetings")
      .add(payload);

    return NextResponse.json({
      success: true,
      id: created.id,
    });
  } catch (error) {
    return NextResponse.json(
      { message: error?.message || "Failed to create conclave meeting" },
      { status: 500 }
    );
  }
}


