import { NextResponse } from "next/server";
import { adminDb, getFirebaseAdminInitError } from "@/lib/firebase/firebaseAdmin";
import { consumeProspectActionToken } from "@/lib/prospectAutomation/actionTokens.mjs";
import { createRuleTodoIfMissing } from "@/lib/prospectAutomation/service.mjs";
import { sendAuthenticChoiceProspectEmail } from "@/lib/prospectAutomation/notifications.mjs";
import { buildProspectEngagementUpdate } from "@/lib/prospectEngagement";
import { publicEnv } from "@/lib/config/publicEnv";

async function loadProspect(db, prospectId) {
  const ref = db.collection(publicEnv.collections.prospect).doc(prospectId);
  const snap = await ref.get();
  if (!snap.exists) return null;
  return { ref, data: { id: snap.id, ...(snap.data() || {}) } };
}

export async function POST(req, { params }) {
  try {
    if (getFirebaseAdminInitError() || !adminDb) {
      return NextResponse.json(
        { message: "Admin Firebase access is not configured." },
        { status: 500 }
      );
    }

    const token = String((await params)?.token || "").trim();
    const body = await req.json().catch(() => ({}));
    const note = String(body?.note || "").trim();
    if (!token) {
      return NextResponse.json({ message: "Missing token." }, { status: 400 });
    }
    if (!note) {
      return NextResponse.json({ message: "Note is required." }, { status: 400 });
    }

    const consumed = await consumeProspectActionToken(
      adminDb,
      token,
      "choose_to_enroll_need_time_note"
    );
    if (!consumed.ok) {
      return NextResponse.json({ message: "Action token invalid." }, { status: 400 });
    }

    const prospectBundle = await loadProspect(adminDb, consumed.prospectId);
    if (!prospectBundle) {
      return NextResponse.json({ message: "Prospect not found." }, { status: 404 });
    }
    const { ref: prospectRef, data: prospect } = prospectBundle;

    const existingLogs = Array.isArray(prospect.authenticChoiceLogs)
      ? prospect.authenticChoiceLogs
      : [];
    await prospectRef.set(
      {
        status: "Need some time",
        statusNote: note,
        declineReason: "",
        authenticChoiceLogs: [
          ...existingLogs,
          {
            status: "Need some time",
            previousStatus: String(prospect.status || "No status yet"),
            note,
            clickedBy: "Prospect (email action)",
            clickedAt: new Date(),
          },
        ],
        ...buildProspectEngagementUpdate("Prospect selected Need Some Time from email action."),
      },
      { merge: true }
    );

    await sendAuthenticChoiceProspectEmail({
      prospect,
      variantKey: "need_some_time",
      variables: { note },
    });

    await createRuleTodoIfMissing({
      db: adminDb,
      prospect,
      ruleKey: "need_time_followup_after_button",
      followUpDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Prospect need-time note submit error:", error);
    return NextResponse.json(
      { message: "Failed to submit note." },
      { status: 500 }
    );
  }
}

