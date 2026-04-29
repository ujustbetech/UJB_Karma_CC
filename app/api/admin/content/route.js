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

export async function GET(req) {
  const guard = validateAdmin(req);
  if (!guard.ok) return guard.response;

  try {
    const snapshot = await adminDb.collection(CONTENT_COLLECTION).get();
    return NextResponse.json({
      content: snapshot.docs.map(mapContentEntry),
    });
  } catch (error) {
    return NextResponse.json(
      { message: error?.message || "Failed to fetch content" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  const guard = validateAdmin(req);
  if (!guard.ok) return guard.response;

  try {
    const body = await req.json();
    const payload = buildContentWritePayload(body, { forCreate: true });
    const created = await adminDb.collection(CONTENT_COLLECTION).add(payload);

    return NextResponse.json({
      success: true,
      id: created.id,
    });
  } catch (error) {
    return NextResponse.json(
      { message: error?.message || "Failed to create content" },
      { status: 500 }
    );
  }
}


