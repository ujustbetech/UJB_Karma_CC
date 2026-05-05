import { NextResponse } from "next/server";
import { adminDb, getFirebaseAdminInitError } from "@/lib/firebase/firebaseAdmin";
import { runProspectCronAutomation } from "@/lib/prospectAutomation/service.mjs";

function getCronSecret() {
  return String(process.env.PROSPECT_AUTOMATION_CRON_SECRET || "").trim();
}

function getRequestSecret(req) {
  return String(req.headers.get("x-cron-secret") || "").trim();
}

export async function POST(req) {
  try {
    if (getFirebaseAdminInitError() || !adminDb) {
      return NextResponse.json(
        { message: "Admin Firebase access is not configured." },
        { status: 500 }
      );
    }

    const expected = getCronSecret();
    if (!expected) {
      return NextResponse.json(
        { message: "Missing PROSPECT_AUTOMATION_CRON_SECRET server configuration." },
        { status: 500 }
      );
    }

    if (getRequestSecret(req) !== expected) {
      return NextResponse.json({ message: "Unauthorized cron request." }, { status: 401 });
    }

    const stats = await runProspectCronAutomation(adminDb);
    return NextResponse.json({ success: true, stats });
  } catch (error) {
    console.error("Prospect automation cron error:", error);
    return NextResponse.json(
      { message: "Failed to run prospect automation cron." },
      { status: 500 }
    );
  }
}

