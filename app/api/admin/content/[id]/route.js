import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/adminRequestAuth.mjs";
import { hasAdminAccess } from "@/lib/auth/accessControl";
import { adminDb } from "@/lib/firebase/firebaseAdmin";
import {
  buildContentWritePayload,
  CONTENT_COLLECTION,
  mapContentEntry,
} from "@/lib/content/adminContentApiWorkflow.mjs";

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
      response: NextResponse.json({ message: "Content API is not configured." }, { status: 500 }),
    };
  }

  return { ok: true };
}

export async function GET(req, { params }) {
  const guard = validateAdmin(req);
  if (!guard.ok) return guard.response;

  try {
    const id = String(params?.id || "").trim();
    const snap = await adminDb.collection(CONTENT_COLLECTION).doc(id).get();
    if (!snap.exists) {
      return NextResponse.json({ message: "Content not found" }, { status: 404 });
    }

    return NextResponse.json({ content: mapContentEntry(snap) });
  } catch (error) {
    return NextResponse.json(
      { message: error?.message || "Failed to fetch content" },
      { status: 500 }
    );
  }
}

export async function PATCH(req, { params }) {
  const guard = validateAdmin(req);
  if (!guard.ok) return guard.response;

  try {
    const id = String(params?.id || "").trim();
    const body = await req.json();
    const payload = buildContentWritePayload(body);
    payload.updatedAt = new Date();
    await adminDb.collection(CONTENT_COLLECTION).doc(id).set(payload, { merge: true });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { message: error?.message || "Failed to update content" },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  const guard = validateAdmin(req);
  if (!guard.ok) return guard.response;

  try {
    const id = String(params?.id || "").trim();
    await adminDb.collection(CONTENT_COLLECTION).doc(id).delete();
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { message: error?.message || "Failed to delete content" },
      { status: 500 }
    );
  }
}


