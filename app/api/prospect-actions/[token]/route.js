import { NextResponse } from "next/server";
import { adminDb, getFirebaseAdminInitError } from "@/lib/firebase/firebaseAdmin";
import {
  consumeProspectActionToken,
  issueProspectActionToken,
} from "@/lib/prospectAutomation/actionTokens.mjs";
import {
  buildEnrollmentRowsUpdate,
  sendEnrollmentStatusProspectEmail,
} from "@/lib/prospectAutomation/notifications.mjs";
import { buildProspectEngagementUpdate } from "@/lib/prospectEngagement";
import { publicEnv } from "@/lib/config/publicEnv";
const AUTOMATION_ISSUES_COLLECTION = "prospect_automation_issues";

function baseUrl(req) {
  const origin = new URL(req.url).origin;
  return origin.replace(/\/+$/, "");
}

function buildEnrollmentLog(action, label, status) {
  return {
    id: `enrollment-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    action,
    targetLabel: label,
    clickedBy: "Prospect (email action)",
    clickedAt: new Date().toISOString(),
    status,
    date: new Date().toISOString().slice(0, 10),
    label,
  };
}

async function loadProspect(db, prospectId) {
  const ref = db.collection(publicEnv.collections.prospect).doc(prospectId);
  const snap = await ref.get();
  if (!snap.exists) return null;
  return { ref, data: { id: snap.id, ...(snap.data() || {}) } };
}

async function createEmailDeliveryIssue({
  db,
  prospect = {},
  ruleKey,
  reason,
  details = "",
}) {
  try {
    await db.collection(AUTOMATION_ISSUES_COLLECTION).add({
      prospect_id: String(prospect.id || "").trim(),
      prospect_name: String(prospect.prospectName || "").trim() || "Prospect",
      issue_type: "email_delivery_failed",
      status: "open",
      rule_key: String(ruleKey || "").trim(),
      message: `Prospect action email failed: ${String(reason || "unknown_error")}`.trim(),
      details: String(details || "").trim(),
      created_at: new Date(),
      resolved_at: null,
    });
  } catch (error) {
    console.error("Failed to persist email delivery issue:", error);
  }
}

export async function GET(req, { params }) {
  try {
    if (getFirebaseAdminInitError() || !adminDb) {
      return NextResponse.json(
        { message: "Admin Firebase access is not configured." },
        { status: 500 }
      );
    }

    const token = String((await params)?.token || "").trim();
    if (!token) {
      return NextResponse.json({ message: "Missing token." }, { status: 400 });
    }

    const consumed = await consumeProspectActionToken(adminDb, token);
    if (!consumed.ok) {
      return NextResponse.redirect(`${baseUrl(req)}/user/prospects/invalid-action`);
    }

    const prospectBundle = await loadProspect(adminDb, consumed.prospectId);
    if (!prospectBundle) {
      return NextResponse.json({ message: "Prospect not found." }, { status: 404 });
    }
    const { ref: prospectRef, data: prospect } = prospectBundle;
    const action = consumed.action;
    const today = new Date().toISOString().slice(0, 10);

    if (action === "choose_to_enroll_yes") {
      const rowsInit = buildEnrollmentRowsUpdate(
        prospect.enrollmentStages,
        "Enrollment Initiation",
        "Initiation completed",
        today
      );
      const rowsFinal = buildEnrollmentRowsUpdate(
        rowsInit,
        "Enrollment documents mail",
        "Documents sent",
        today
      );
      const existingLogs = Array.isArray(prospect.enrollmentStageLogs)
        ? prospect.enrollmentStageLogs
        : [];

      await prospectRef.set(
        {
          enrollmentStages: rowsFinal,
          enrollmentStageLogs: [
            ...existingLogs,
            buildEnrollmentLog("email_action", "Enrollment Initiation", "Initiation completed"),
            buildEnrollmentLog("email_action", "Enrollment documents mail", "Documents sent"),
          ],
          ...buildProspectEngagementUpdate("Prospect accepted journey from email action."),
        },
        { merge: true }
      );

      const emailResult = await sendEnrollmentStatusProspectEmail({
        prospect,
        rowLabel: "Enrollment documents mail",
        rowStatus: "Documents sent",
        rowDate: today,
      });
      if (!emailResult?.ok) {
        console.error("Prospect action email failed:", {
          action,
          prospectId: prospect.id,
          reason: emailResult?.reason,
          details: emailResult?.details,
        });
        await createEmailDeliveryIssue({
          db: adminDb,
          prospect,
          ruleKey: "choose_to_enroll_yes_documents_sent_email",
          reason: emailResult?.reason,
          details: emailResult?.details,
        });
      }

      return NextResponse.redirect(`${baseUrl(req)}/prospect-actions/thanks`);
    }

    if (action === "choose_to_enroll_need_time") {
      const existingChoiceLogs = Array.isArray(prospect.authenticChoiceLogs)
        ? prospect.authenticChoiceLogs
        : [];
      await prospectRef.set(
        {
          authenticChoiceLogs: [
            ...existingChoiceLogs,
            {
              action: "need_time_link_clicked",
              source: "prospect_email_action",
              status: "Need some time",
              previousStatus: String(prospect.status || "No status yet"),
              note: "",
              clickedBy: "Prospect (email action)",
              clickedAt: new Date(),
            },
          ],
          ...buildProspectEngagementUpdate(
            "Prospect opened Need Some Time note page from email action."
          ),
        },
        { merge: true }
      );

      const noteToken = await issueProspectActionToken(adminDb, {
        prospectId: prospect.id,
        action: "choose_to_enroll_need_time_note",
        createdBy: "system",
      });
      return NextResponse.redirect(
        `${baseUrl(req)}/prospect-actions/note/${encodeURIComponent(noteToken.token)}`
      );
    }

    if (action === "enrollment_fee_option1" || action === "enrollment_fee_option2") {
      const status =
        action === "enrollment_fee_option1"
          ? "Upfront payment selected"
          : "Adjustment selected";
      const rows = buildEnrollmentRowsUpdate(
        prospect.enrollmentStages,
        "Enrollment fees Option Opted for",
        status,
        today
      );
      const existingLogs = Array.isArray(prospect.enrollmentStageLogs)
        ? prospect.enrollmentStageLogs
        : [];
      await prospectRef.set(
        {
          enrollmentStages: rows,
          enrollmentStageLogs: [
            ...existingLogs,
            buildEnrollmentLog("email_action", "Enrollment fees Option Opted for", status),
          ],
          ...buildProspectEngagementUpdate(`Enrollment fee option selected from email: ${status}.`),
        },
        { merge: true }
      );
      const emailResult = await sendEnrollmentStatusProspectEmail({
        prospect,
        rowLabel: "Enrollment fees Option Opted for",
        rowStatus: status,
        rowDate: today,
      });
      if (!emailResult?.ok) {
        console.error("Prospect action email failed:", {
          action,
          prospectId: prospect.id,
          reason: emailResult?.reason,
          details: emailResult?.details,
        });
        await createEmailDeliveryIssue({
          db: adminDb,
          prospect,
          ruleKey: `enrollment_fee_email_${action}`,
          reason: emailResult?.reason,
          details: emailResult?.details,
        });
      }

      return NextResponse.redirect(`${baseUrl(req)}/prospect-actions/thanks`);
    }

    return NextResponse.redirect(`${baseUrl(req)}/user/prospects/invalid-action`);
  } catch (error) {
    console.error("Prospect action consume error:", error);
    return NextResponse.json({ message: "Failed to process action link." }, { status: 500 });
  }
}
