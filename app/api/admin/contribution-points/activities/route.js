import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/adminRequestAuth.mjs";
import { hasAdminAccess } from "@/lib/auth/accessControl";
import { adminDb } from "@/lib/firebase/firebaseAdmin";
import {
  fetchActiveCpActivityDefinitions,
  fetchCpActivityDefinitions,
  importCpActivities,
  saveCpActivityDefinition,
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

export async function GET(req) {
  const guard = validateAdmin(req);
  if (!guard.ok) {
    return guard.response;
  }

  try {
    const status = String(req.nextUrl.searchParams.get("status") || "").trim();
    const activities =
      status === "ACTIVE"
        ? await fetchActiveCpActivityDefinitions(adminDb)
        : await fetchCpActivityDefinitions(adminDb);

    return NextResponse.json({ activities });
  } catch (error) {
    return NextResponse.json(
      { message: error?.message || "Failed to fetch CP activities" },
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
    const action = String(body?.action || "").trim();

    if (action === "import") {
      const rows = Array.isArray(body?.rows) ? body.rows : [];
      await importCpActivities(adminDb, rows);
      return NextResponse.json({ success: true });
    }

    if (action === "create") {
      const id = await saveCpActivityDefinition(adminDb, body?.form || {});
      return NextResponse.json({ success: true, id });
    }

    return NextResponse.json({ message: "Invalid action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { message: error?.message || "Failed to save CP activity" },
      { status: 500 }
    );
  }
}
