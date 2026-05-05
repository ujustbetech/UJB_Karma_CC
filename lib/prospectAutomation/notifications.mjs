import { adminDb } from "@/lib/firebase/firebaseAdmin";
import { getFallbackJourneyEmailTemplate } from "@/lib/journey/journey_email";
import { issueProspectActionToken, buildActionUrl } from "@/lib/prospectAutomation/actionTokens.mjs";

const JOURNEY_TEMPLATES_COLLECTION = "journey_templates";

function normalize(value) {
  return String(value || "").trim();
}

function applyTemplateVariables(template = "", values = {}) {
  return String(template || "").replace(/\{\{\s*(.*?)\s*\}\}/g, (_, key) => {
    const normalizedKey = normalize(key);
    return values[normalizedKey] ?? `{{${normalizedKey}}}`;
  });
}

async function fetchJourneyTemplate(templateId) {
  try {
    const snap = await adminDb.collection(JOURNEY_TEMPLATES_COLLECTION).doc(templateId).get();
    if (snap.exists) {
      return snap.data() || null;
    }
  } catch (error) {
    console.error("fetchJourneyTemplate failed:", error);
  }
  return null;
}

export async function sendEmailViaEmailJs(channel, templateParams) {
  const serviceId = normalize(channel?.serviceId);
  const templateId = normalize(channel?.templateId);
  const publicKey = normalize(channel?.publicKey);
  if (!serviceId || !templateId || !publicKey) {
    return { ok: false, reason: "missing_emailjs_config" };
  }

  try {
    const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: serviceId,
        template_id: templateId,
        user_id: publicKey,
        template_params: templateParams,
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { ok: false, reason: `emailjs_http_${res.status}`, details: text };
    }
    return { ok: true };
  } catch (error) {
    return { ok: false, reason: "emailjs_fetch_error", details: error?.message || "unknown" };
  }
}

function toVariantKey(label, status) {
  return `${normalize(label)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")}_${normalize(status)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")}`;
}

function getEnrollmentRow(rows, label) {
  return (Array.isArray(rows) ? rows : []).find((row) => normalize(row?.label) === normalize(label));
}

export function buildEnrollmentRowsUpdate(rows, label, status, dateIso) {
  const nowDate = normalize(dateIso || new Date().toISOString().slice(0, 10));
  const nextRows = Array.isArray(rows) ? [...rows] : [];
  const idx = nextRows.findIndex((row) => normalize(row?.label) === normalize(label));
  const entry = {
    label,
    checked: true,
    date: nowDate,
    status,
    sent: false,
  };
  if (idx >= 0) {
    nextRows[idx] = {
      ...nextRows[idx],
      ...entry,
    };
  } else {
    nextRows.push(entry);
  }
  return nextRows;
}

export async function sendEnrollmentStatusProspectEmail({
  prospect = {},
  rowLabel,
  rowStatus,
  rowDate,
  extraVariables = {},
}) {
  const email = normalize(prospect?.email);
  if (!email) return { ok: false, reason: "missing_prospect_email" };

  const dynamicTemplate = await fetchJourneyTemplate("enrollment_status");
  const fallback = getFallbackJourneyEmailTemplate("enrollment_status");
  const channel = dynamicTemplate?.channels?.email || fallback;
  const variantKey = toVariantKey(rowLabel, rowStatus);
  const recipientTemplate =
    channel?.variants?.[variantKey]?.recipients?.prospect ||
    fallback?.variants?.[variantKey]?.recipients?.prospect;

  const body = applyTemplateVariables(recipientTemplate?.body, {
    prospect_name: prospect?.prospectName || "Prospect",
    date: rowDate || new Date().toISOString().slice(0, 10),
    ...extraVariables,
  });

  return sendEmailViaEmailJs(channel, {
    to_email: email,
    prospect_name: prospect?.prospectName || "Prospect",
    body,
  });
}

export async function sendAuthenticChoiceProspectEmail({
  prospect = {},
  variantKey,
  variables = {},
}) {
  const email = normalize(prospect?.email);
  if (!email || !variantKey) return { ok: false, reason: "missing_email_or_variant" };
  const dynamicTemplate = await fetchJourneyTemplate("authentic_choice");
  const fallback = getFallbackJourneyEmailTemplate("authentic_choice");
  const channel = dynamicTemplate?.channels?.email || fallback;
  const recipientTemplate =
    channel?.variants?.[variantKey]?.recipients?.prospect ||
    fallback?.variants?.[variantKey]?.recipients?.prospect;
  const body = applyTemplateVariables(recipientTemplate?.body, {
    prospect_name: prospect?.prospectName || "Prospect",
    ...variables,
  });
  return sendEmailViaEmailJs(channel, {
    to_email: email,
    prospect_name: prospect?.prospectName || "Prospect",
    body,
  });
}

export async function sendChooseToEnrollProspectEmailWithLinks({
  db,
  req,
  prospect = {},
  createdBy = "system",
}) {
  const email = normalize(prospect?.email);
  const prospectId = normalize(prospect?.id);
  if (!email || !prospectId) {
    return { ok: false, reason: "missing_email_or_prospect" };
  }

  const baseUrl = req ? buildActionUrl(req ? new URL(req.url).origin : "", "") : "";
  const rootUrl = req ? new URL(req.url).origin : "";
  const yesToken = await issueProspectActionToken(db, {
    prospectId,
    action: "choose_to_enroll_yes",
    createdBy,
  });
  const needTimeToken = await issueProspectActionToken(db, {
    prospectId,
    action: "choose_to_enroll_need_time",
    createdBy,
  });
  const yesUrl = buildActionUrl(rootUrl, yesToken.token);
  const needTimeUrl = buildActionUrl(rootUrl, needTimeToken.token);

  const dynamicTemplate = await fetchJourneyTemplate("authentic_choice");
  const fallback = getFallbackJourneyEmailTemplate("authentic_choice");
  const channel = dynamicTemplate?.channels?.email || fallback;
  const recipientTemplate =
    channel?.variants?.choose_to_enroll?.recipients?.prospect ||
    fallback?.variants?.choose_to_enroll?.recipients?.prospect;
  const bodyCore = applyTemplateVariables(recipientTemplate?.body, {
    prospect_name: prospect?.prospectName || "Prospect",
  });
  const body = `${bodyCore}\n\nYes to This Journey: ${yesUrl}\nNeed Some Time: ${needTimeUrl}`;

  const result = await sendEmailViaEmailJs(channel, {
    to_email: email,
    prospect_name: prospect?.prospectName || "Prospect",
    body,
  });

  return { ...result, yesUrl, needTimeUrl };
}

export async function sendEnrollmentFeeOptionEmailWithLinks({
  db,
  req,
  prospect = {},
  createdBy = "system",
}) {
  const email = normalize(prospect?.email);
  const prospectId = normalize(prospect?.id);
  if (!email || !prospectId) {
    return { ok: false, reason: "missing_email_or_prospect" };
  }

  const rootUrl = req ? new URL(req.url).origin : "";
  const option1Token = await issueProspectActionToken(db, {
    prospectId,
    action: "enrollment_fee_option1",
    createdBy,
  });
  const option2Token = await issueProspectActionToken(db, {
    prospectId,
    action: "enrollment_fee_option2",
    createdBy,
  });
  const option1Url = buildActionUrl(rootUrl, option1Token.token);
  const option2Url = buildActionUrl(rootUrl, option2Token.token);

  const dynamicTemplate = await fetchJourneyTemplate("enrollment_status");
  const fallback = getFallbackJourneyEmailTemplate("enrollment_status");
  const channel = dynamicTemplate?.channels?.email || fallback;
  const variantKey = toVariantKey("Enrollment Fees Mail Status", "Fee mail sent");
  const recipientTemplate =
    channel?.variants?.[variantKey]?.recipients?.prospect ||
    fallback?.variants?.[variantKey]?.recipients?.prospect;
  const bodyCore = applyTemplateVariables(recipientTemplate?.body, {
    prospect_name: prospect?.prospectName || "Prospect",
    date: new Date().toISOString().slice(0, 10),
  });
  const body = `${bodyCore}\n\nOption 1: ${option1Url}\nOption 2: ${option2Url}`;

  const result = await sendEmailViaEmailJs(channel, {
    to_email: email,
    prospect_name: prospect?.prospectName || "Prospect",
    body,
  });

  return { ...result, option1Url, option2Url };
}

export function getEnrollmentFeeOptionRow(rows) {
  return getEnrollmentRow(rows, "Enrollment fees Option Opted for");
}
