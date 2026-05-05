import { randomUUID } from "crypto";
import { publicEnv } from "@/lib/config/publicEnv";
import { buildProspectEngagementUpdate } from "@/lib/prospectEngagement";
import {
  buildEnrollmentRowsUpdate,
  getEnrollmentFeeOptionRow,
  sendEnrollmentStatusProspectEmail,
} from "@/lib/prospectAutomation/notifications.mjs";

const TODO_COLLECTION = "TODO";
const AUTOMATION_SOURCE = "prospect_automation";

function normalize(value) {
  return String(value || "").trim();
}

function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value?.toDate === "function") {
    const v = value.toDate();
    return v instanceof Date && !Number.isNaN(v.getTime()) ? v : null;
  }
  if (typeof value?.seconds === "number") {
    const v = new Date(value.seconds * 1000);
    return Number.isNaN(v.getTime()) ? null : v;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function dateDiffDays(fromDate, toDate = new Date()) {
  const from = toDateOnlyStart(fromDate);
  const to = toDateOnlyStart(toDate);
  if (!from || !to) return null;
  const diffMs = to.getTime() - from.getTime();
  return Math.floor(diffMs / (24 * 60 * 60 * 1000));
}

function toDateOnlyStart(value) {
  const parsed = toDate(value);
  if (!parsed) return null;
  const next = new Date(parsed);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function deriveProspectStage(prospect = {}) {
  if (prospect.assessmentMail?.sent) {
    return "Assessment Completed";
  }
  if (prospect.caseStudy2?.sent) {
    return "Case Study 2";
  }
  if (prospect.caseStudy1?.sent) {
    return "Case Study 1";
  }
  if (prospect.knowledgeSeries10_evening?.sent) {
    return "Knowledge Series 10";
  }
  if (prospect.knowledgeSeries5_morning?.sent) {
    return "Knowledge Series";
  }
  if (prospect.ntIntro?.sent) {
    return "NT Intro";
  }
  if (Array.isArray(prospect.sections) && prospect.sections.length > 0) {
    return "Assessment Form";
  }
  if (Array.isArray(prospect.introevent) && prospect.introevent.length > 0) {
    return "Intro Meeting";
  }
  return "Prospect Created";
}

function buildTodoPurposeForRule(ruleKey) {
  if (ruleKey.includes("assessment")) return "Assessment Form";
  return "Other";
}

function buildTodoMessage(ruleKey, prospect) {
  const name = normalize(prospect?.prospectName || prospect?.name || "-");
  const email = normalize(prospect?.email || "-");
  const phone = normalize(prospect?.prospectPhone || prospect?.phone || "-");

  if (ruleKey === "assessment_form_pending") {
    return `The assessment form has not been received yet. Please contact the MentOrbiter to complete the assessment form. Prospect details: ${name}, ${email}, ${phone}.`;
  }
  if (ruleKey === "feedback_form_pending_2d") {
    return "Feedback form is pending. Please follow up with the prospect to complete the form.";
  }
  if (ruleKey === "authentic_choice_need_time_2d") {
    return "Authentic Choice is set to Need Some Time. Please follow up with the prospect.";
  }
  if (ruleKey === "assessment_submitted_schedule_meeting") {
    return `Assessment form submitted. Schedule a meeting with the prospect within 2 days. Prospect details: ${name}, ${email}, ${phone}.`;
  }
  if (ruleKey === "need_time_followup_after_button") {
    return "Prospect selected Need Some Time from email action. Please follow up after 2 days.";
  }
  return `Prospect follow-up required for rule: ${ruleKey}`;
}

export async function createRuleTodoIfMissing({
  db,
  prospect,
  ruleKey,
  followUpDate,
}) {
  const prospectId = normalize(prospect?.id);
  const assignTo = normalize(prospect?.assignedOpsEmail).toLowerCase();
  if (!prospectId || !assignTo) return { created: false, reason: "missing_target_or_ops" };

  const todoSnap = await db
    .collection(TODO_COLLECTION)
    .where("prospect_id", "==", prospectId)
    .get();

  const hasOpen = todoSnap.docs.some((doc) => {
    const data = doc.data() || {};
    const status = normalize(data.status);
    return (
      normalize(data.rule_key) === ruleKey &&
      (status === "Pending" || status === "In Progress")
    );
  });
  if (hasOpen) return { created: false, reason: "open_todo_exists" };

  const now = new Date();
  const targetDate = followUpDate || now.toISOString().slice(0, 10);
  const payload = {
    uuid: randomUUID(),
    assign_to: assignTo,
    assign_to_name: normalize(prospect?.assignedOpsName),
    prospect_id: prospectId,
    orbitor_id: "",
    user_type: "prospect",
    linked_name: normalize(prospect?.prospectName || prospect?.name),
    purpose: buildTodoPurposeForRule(ruleKey),
    follow_up_date: targetDate,
    discussion_details: buildTodoMessage(ruleKey, prospect),
    status: "Pending",
    start_time: null,
    completion_date: null,
    completion_time: null,
    added_by: AUTOMATION_SOURCE,
    created_at: now,
    updated_at: now,
    rule_key: ruleKey,
    automation_source: AUTOMATION_SOURCE,
  };

  await db.collection(TODO_COLLECTION).add(payload);
  return { created: true };
}

function getActionDoneAt(prospect, actionKey) {
  return toDate(prospect?.automation?.actions?.[actionKey]?.doneAt);
}

export async function markActionDone(db, prospectId, actionKey, extra = {}) {
  await db
    .collection(publicEnv.collections.prospect)
    .doc(prospectId)
    .set(
      {
        automation: {
          lastProcessedAt: new Date(),
          actions: {
            [actionKey]: {
              doneAt: new Date(),
              ...extra,
            },
          },
        },
      },
      { merge: true }
    );
}

function findFeedbackFormSentAt(prospect = {}) {
  const logs = Array.isArray(prospect?.formAuditLogs) ? prospect.formAuditLogs : [];
  const sentEntry = [...logs]
    .reverse()
    .find(
      (log) =>
        normalize(log?.formName) === "Feedback Form" &&
        normalize(log?.actionType).toLowerCase() === "sent"
    );
  return toDate(sentEntry?.performedAt || sentEntry?.createdAt || sentEntry?.timestamp);
}

function findNeedSomeTimeSetAt(prospect = {}) {
  const logs = Array.isArray(prospect?.authenticChoiceLogs) ? prospect.authenticChoiceLogs : [];
  const entry = [...logs]
    .reverse()
    .find((log) => normalize(log?.status).toLowerCase() === "need some time");
  return toDate(entry?.clickedAt);
}

function findEnrollmentFeeOptionDate(prospect = {}, statusValue) {
  const rows = Array.isArray(prospect?.enrollmentStages) ? prospect.enrollmentStages : [];
  const row = rows.find(
    (item) =>
      normalize(item?.label) === "Enrollment fees Option Opted for" &&
      normalize(item?.status) === normalize(statusValue)
  );
  if (!row) return null;
  return toDate(row.date);
}

export async function runProspectCronAutomation(db) {
  const snapshot = await db.collection(publicEnv.collections.prospect).get();
  const now = new Date();
  const stats = {
    scanned: 0,
    todosCreated: 0,
    feeAutoAdjusted: 0,
  };

  for (const doc of snapshot.docs) {
    const prospect = { id: doc.id, ...(doc.data() || {}) };
    if (normalize(prospect?.recordStatus) === "Archive") continue;
    stats.scanned += 1;
    const stage = deriveProspectStage(prospect);
    const lastEngagement = toDate(prospect?.lastEngagementDate);

    // 1) Assessment form pending
    if (stage === "Assessment Form" && !lastEngagement) {
      const formsSnap = await db
        .collection(publicEnv.collections.prospect)
        .doc(prospect.id)
        .collection("prospectform")
        .limit(1)
        .get();
      if (formsSnap.empty) {
        const result = await createRuleTodoIfMissing({
          db,
          prospect,
          ruleKey: "assessment_form_pending",
          followUpDate: now.toISOString().slice(0, 10),
        });
        if (result.created) stats.todosCreated += 1;
      }
    }

    // 2) Feedback form pending >2 days after sent
    const feedbackSentAt = findFeedbackFormSentAt(prospect);
    if (feedbackSentAt && dateDiffDays(feedbackSentAt, now) >= 2) {
      const feedbackSnap = await db
        .collection(publicEnv.collections.prospect)
        .doc(prospect.id)
        .collection("prospectfeedbackform")
        .limit(1)
        .get();
      if (feedbackSnap.empty) {
        const result = await createRuleTodoIfMissing({
          db,
          prospect,
          ruleKey: "feedback_form_pending_2d",
          followUpDate: now.toISOString().slice(0, 10),
        });
        if (result.created) stats.todosCreated += 1;
      }
    }

    // 3) Need some time >2 days
    if (normalize(prospect?.status).toLowerCase() === "need some time") {
      const setAt = findNeedSomeTimeSetAt(prospect);
      if (setAt && dateDiffDays(setAt, now) >= 2) {
        const result = await createRuleTodoIfMissing({
          db,
          prospect,
          ruleKey: "authentic_choice_need_time_2d",
          followUpDate: now.toISOString().slice(0, 10),
        });
        if (result.created) stats.todosCreated += 1;
      }
    }

    // 4) Upfront payment selected not confirmed in 2 days
    const selectedDate = findEnrollmentFeeOptionDate(prospect, "Upfront payment selected");
    const confirmedDate = findEnrollmentFeeOptionDate(prospect, "Upfront payment confirmed");
    if (selectedDate && !confirmedDate && dateDiffDays(selectedDate, now) >= 2) {
      const feeRow = getEnrollmentFeeOptionRow(prospect.enrollmentStages);
      if (normalize(feeRow?.status) === "Upfront payment selected") {
        const nextRows = buildEnrollmentRowsUpdate(
          prospect.enrollmentStages,
          "Enrollment fees Option Opted for",
          "No response - adjustment applied",
          now.toISOString().slice(0, 10)
        );

        await db
          .collection(publicEnv.collections.prospect)
          .doc(prospect.id)
          .set(
            {
              enrollmentStages: nextRows,
              ...buildProspectEngagementUpdate("Enrollment fee auto-adjustment applied due to no response."),
            },
            { merge: true }
          );
        await sendEnrollmentStatusProspectEmail({
          prospect,
          rowLabel: "Enrollment fees Option Opted for",
          rowStatus: "No response - adjustment applied",
          rowDate: now.toISOString().slice(0, 10),
        });
        stats.feeAutoAdjusted += 1;
      }
    }

    await db
      .collection(publicEnv.collections.prospect)
      .doc(prospect.id)
      .set(
        {
          automation: {
            lastProcessedAt: now,
          },
        },
        { merge: true }
      );
  }

  return stats;
}

export async function triggerAssessmentSubmittedAutomation(db, prospect) {
  return createRuleTodoIfMissing({
    db,
    prospect,
    ruleKey: "assessment_submitted_schedule_meeting",
    followUpDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  });
}

export async function triggerPreEnrollmentOrMeetingDoneAutomation(db, prospect, reason = "") {
  const prospectId = normalize(prospect?.id);
  if (!prospectId) return { triggered: false, reason: "missing_prospect" };
  const doneAt = getActionDoneAt(prospect, "feedback_form_triggered");
  if (doneAt) return { triggered: false, reason: "already_done" };

  const formLinkBase =
    process.env.NEXT_PUBLIC_APP_URL || process.env.APP_BASE_URL || "http://localhost:3000";
  const feedbackFormLink = `${formLinkBase.replace(/\/+$/, "")}/user/prospects/${encodeURIComponent(
    prospectId
  )}/feedback`;
  await sendEnrollmentStatusProspectEmail({
    prospect,
    rowLabel: "Pre Enrollment Form",
    rowStatus: "Feedback Form Triggered",
    rowDate: new Date().toISOString().slice(0, 10),
    extraVariables: { form_link: feedbackFormLink },
  });

  await db
    .collection(publicEnv.collections.prospect)
    .doc(prospectId)
    .set(
      {
        feedbackFormTriggeredAt: new Date(),
        feedbackFormSource: reason || "automation",
        ...buildProspectEngagementUpdate("Feedback form stage triggered by automation."),
      },
      { merge: true }
    );

  await markActionDone(db, prospectId, "feedback_form_triggered", { reason: reason || "automation" });
  return { triggered: true };
}

