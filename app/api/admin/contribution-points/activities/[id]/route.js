import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/adminRequestAuth.mjs";
import { hasAdminAccess } from "@/lib/auth/accessControl";
import { adminDb } from "@/lib/firebase/firebaseAdmin";
import {
  deleteCpActivityDefinition,
  saveCpActivityDefinition,
  toggleCpActivityStatus,
} from "@/lib/contribution-points/apiWorkflow.mjs";

function validateAdmin(req) {
  const auth = requireAdminSession(req, hasAdminAccess);
  if (!auth.ok) {
    return {
      ok: false,
      response: NextResponse.json(
        { message: auth.message },
        { status: auth.status }
      ),
    };
  }

  if (!adminDb) {
    return {
      ok: false,
      response: NextResponse.json(
        { message: "Contribution point API is not configured." },
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
    const resolvedParams = await params;
    const idFromParams = String(resolvedParams?.id || "").trim();
    const body = await req.json();
    const action = String(body?.action || "").trim();
    const id = idFromParams || String(body?.id || body?.form?.id || "").trim();

    if (!id) {
      return NextResponse.json({ message: "Missing activity id" }, { status: 400 });
    }

    if (action === "update") {
      await saveCpActivityDefinition(adminDb, body?.form || {}, id);
      return NextResponse.json({ success: true, id });
    }

    if (action === "toggle-status") {
      await toggleCpActivityStatus(adminDb, body?.activity || {});
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ message: "Invalid action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { message: error?.message || "Failed to update CP activity" },
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
    const idFromParams = String(resolvedParams?.id || "").trim();
    const body = await req.json().catch(() => ({}));
    const id = idFromParams || String(body?.id || "").trim();
    const activity = {
      ...(body?.activity || {}),
      id,
    };

    if (!id) {
      return NextResponse.json({ message: "Missing activity id" }, { status: 400 });
    }

    await deleteCpActivityDefinition(adminDb, activity);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { message: error?.message || "Failed to delete CP activity" },
      { status: 500 }
    );
  }
}


