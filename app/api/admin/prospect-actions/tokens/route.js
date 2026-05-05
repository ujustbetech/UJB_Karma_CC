import { NextResponse } from "next/server";
import { hasAdminAccess } from "@/lib/auth/accessControl";
import { requireAdminSession } from "@/lib/auth/adminRequestAuth.mjs";
import { adminDb, getFirebaseAdminInitError } from "@/lib/firebase/firebaseAdmin";
import {
  buildActionUrl,
  buildPublicBaseUrl,
  issueProspectActionToken,
} from "@/lib/prospectAutomation/actionTokens.mjs";

export async function POST(req) {
  try {
    if (getFirebaseAdminInitError() || !adminDb) {
      return NextResponse.json(
        { message: "Admin Firebase access is not configured." },
        { status: 500 }
      );
    }

    const auth = requireAdminSession(req, hasAdminAccess);
    if (!auth.ok) {
      return NextResponse.json({ message: auth.message }, { status: auth.status });
    }

    const body = await req.json();
    const prospectId = String(body?.prospectId || "").trim();
    const actions = Array.isArray(body?.actions)
      ? body.actions.map((value) => String(value || "").trim()).filter(Boolean)
      : [];
    if (!prospectId || actions.length === 0) {
      return NextResponse.json(
        { message: "prospectId and at least one action are required." },
        { status: 400 }
      );
    }

    const baseUrl = buildPublicBaseUrl(req);
    const urls = {};
    for (const action of actions) {
      const issued = await issueProspectActionToken(adminDb, {
        prospectId,
        action,
        createdBy: String(auth.admin?.email || auth.admin?.name || "admin"),
      });
      urls[action] = buildActionUrl(baseUrl, issued.token);
    }

    return NextResponse.json({ success: true, urls });
  } catch (error) {
    console.error("Prospect action token issue error:", error);
    return NextResponse.json(
      { message: "Failed to issue prospect action tokens." },
      { status: 500 }
    );
  }
}

