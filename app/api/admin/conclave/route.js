import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/adminRequestAuth.mjs";
import { hasAdminAccess } from "@/lib/auth/accessControl";
import { adminDb } from "@/lib/firebase/firebaseAdmin";
import { COLLECTIONS } from "@/lib/utility_collection";
import {
  buildConclaveCreatePayload,
  mapConclaveAdminUser,
  mapConclaveListEntry,
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

async function loadUsers() {
  const snapshot = await adminDb.collection(COLLECTIONS.userDetail).get();
  return snapshot.docs.map(mapConclaveAdminUser);
}

export async function GET(req) {
  const guard = validateAdmin(req);
  if (!guard.ok) {
    return guard.response;
  }

  try {
    const view = String(req.nextUrl.searchParams.get("view") || "").trim();

    if (view === "users") {
      return NextResponse.json({ users: await loadUsers() });
    }

    const snapshot = await adminDb.collection(COLLECTIONS.conclaves).get();
    return NextResponse.json({
      conclaves: snapshot.docs.map(mapConclaveListEntry),
    });
  } catch (error) {
    return NextResponse.json(
      { message: error?.message || "Failed to fetch conclaves" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  const guard = validateAdmin(req);
  if (!guard.ok) {
    return guard.response;
  }

  try {
    const body = await req.json();

    if (!body?.conclaveStream || !body?.startDate || !body?.initiationDate || !body?.leader) {
      return NextResponse.json(
        { message: "Missing required conclave fields" },
        { status: 400 }
      );
    }

    const payload = buildConclaveCreatePayload(body);
    if (!payload.startDate || !payload.initiationDate) {
      return NextResponse.json(
        { message: "Invalid conclave dates" },
        { status: 400 }
      );
    }
    const created = await adminDb.collection(COLLECTIONS.conclaves).add(payload);

    return NextResponse.json({
      success: true,
      id: created.id,
    });
  } catch (error) {
    return NextResponse.json(
      { message: error?.message || "Failed to create conclave" },
      { status: 500 }
    );
  }
}


