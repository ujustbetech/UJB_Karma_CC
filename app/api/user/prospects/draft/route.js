import { API_ERROR_CODES } from "@/lib/api/contracts.mjs";
import { logAuthFailure, logProviderFailure } from "@/lib/api/logging.mjs";
import { readJsonObject } from "@/lib/api/request.mjs";
import { jsonError, jsonSuccess } from "@/lib/api/response.mjs";
import { requireUserSession } from "@/lib/auth/userRequestAuth.mjs";
import { getDataProvider } from "@/lib/data/provider.mjs";
import { buildProspectEngagementUpdate } from "@/lib/prospectEngagement";
import {
  buildProspectAssessmentTemplateValues,
  triggerProspectAssessmentMessages,
} from "@/lib/prospect/prospectAssessmentMessaging.mjs";

const INDIA_DIAL_CODE = "+91";
const INDIAN_MOBILE_REGEX = /^[6-9]\d{9}$/;
const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const USER_PROSPECT_SOURCE = "Orbiter";
const USER_PROSPECT_OCCASION = "orbiter_connection";

function getAdultDobMax() {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 18);
  return date;
}

function normalizePhoneDigits(value) {
  return String(value || "").replace(/\D/g, "").slice(-10);
}

function canAccessProspect(authContext, prospect = {}) {
  const authUjbCode = String(authContext?.ujbCode || "").trim();
  const authPhone = normalizePhoneDigits(authContext?.phone || "");
  const prospectUjbCode = String(prospect?.mentorUjbCode || "").trim();
  const prospectPhone = normalizePhoneDigits(prospect?.orbiterContact || "");

  if (authUjbCode && prospectUjbCode && authUjbCode === prospectUjbCode) {
    return true;
  }

  if (authPhone && prospectPhone && authPhone === prospectPhone) {
    return true;
  }

  return false;
}

function normalizeProspectPayload(payload = {}) {
  return {
    prospectName: String(payload.prospectName || "").trim(),
    prospectPhone: normalizePhoneDigits(payload.prospectPhone),
    email: String(payload.email || "").trim(),
    dob: String(payload.dob || "").trim(),
    occupation: String(payload.occupation || "").trim(),
    hobbies: String(payload.hobbies || "").trim(),
    source: USER_PROSPECT_SOURCE,
    type: USER_PROSPECT_OCCASION,
  };
}

function isAdultDob(value) {
  const dobDate = new Date(String(value || ""));
  if (Number.isNaN(dobDate.getTime())) {
    return false;
  }
  return dobDate <= getAdultDobMax();
}

function validateProspectPayload(payload) {
  if (!payload.prospectName) return "Prospect name is required";
  if (!INDIAN_MOBILE_REGEX.test(payload.prospectPhone)) {
    return "Enter a valid 10-digit Indian mobile number";
  }
  if (!payload.email || !EMAIL_REGEX.test(payload.email)) {
    return "Enter a valid email address";
  }
  if (!payload.dob || !isAdultDob(payload.dob)) {
    return "Prospect must be at least 18 years old";
  }
  if (!payload.occupation) return "Occupation is required";
  return "";
}

function normalizeMentorProfile(mentor = {}, authContext = {}) {
  const name = String(mentor?.Name || mentor?.name || "").trim();
  const email = String(mentor?.Email || mentor?.email || "").trim();
  const phone = String(
    mentor?.MobileNo || mentor?.["Mobile no"] || mentor?.phone || authContext?.phone || ""
  ).trim();
  const mentorUjbCode = String(
    mentor?.UJBCode || mentor?.ujbCode || authContext?.ujbCode || ""
  ).trim();

  return { name, email, phone, mentorUjbCode };
}

function buildDraftProspectPayload(payload, mentorProfile, now) {
  return {
    userType: "prospect",
    prospectName: payload.prospectName,
    prospectPhone: `${INDIA_DIAL_CODE}${payload.prospectPhone}`,
    occupation: payload.occupation,
    hobbies: payload.hobbies,
    email: payload.email,
    dob: payload.dob,
    source: payload.source,
    type: payload.type,
    orbiterName: mentorProfile.name || mentorProfile.mentorUjbCode,
    orbiterContact: mentorProfile.phone,
    orbiterEmail: mentorProfile.email,
    mentorUjbCode: mentorProfile.mentorUjbCode,
    assignedOpsUserId: "",
    assignedOpsName: "",
    assignedOpsEmail: "",
    approvalStatus: "draft",
    status: "draft",
    isDraft: true,
    recordStatus: "Draft",
    lifecycleStatus: "Draft",
    ...buildProspectEngagementUpdate(
      "Prospect added by MentOrbiter via user enrollment flow.",
      { lastEngagementDate: now, updatedAt: now }
    ),
    registeredAt: now,
    createdAt: now,
    updatedAt: now,
  };
}

export async function POST(req) {
  const authResult = await requireUserSession(req);

  if (!authResult.ok) {
    logAuthFailure({
      route: "/api/user/prospects/draft",
      status: authResult.status,
      code: authResult.code,
      reason: authResult.reason,
    });

    return jsonError(authResult.message, {
      status: authResult.status,
      code: authResult.code,
    });
  }

  const bodyResult = await readJsonObject(req);

  if (!bodyResult.ok) {
    return jsonError(bodyResult.message, {
      status: bodyResult.status,
      code: bodyResult.code,
    });
  }

  const payload = normalizeProspectPayload(bodyResult.data);
  const validationError = validateProspectPayload(payload);

  if (validationError) {
    return jsonError(validationError, {
      status: 422,
      code: API_ERROR_CODES.INVALID_INPUT,
    });
  }

  try {
    const provider = getDataProvider();
    const mentor = authResult.context.ujbCode
      ? await provider.users.getByUjbCode(authResult.context.ujbCode)
      : null;
    const mentorProfile = normalizeMentorProfile(mentor, authResult.context);
    const now = new Date();

    const draftPayload = buildDraftProspectPayload(payload, mentorProfile, now);
    const prospect = await provider.prospects.create(draftPayload);

    const baseUrl = new URL(req.url).origin;
    const formLink = `${baseUrl}/user/prospects/${prospect.id}`;
    const templateValues = buildProspectAssessmentTemplateValues({
      orbiterName: draftPayload.orbiterName,
      prospectName: draftPayload.prospectName,
      formLink,
      orbiterEmail: draftPayload.orbiterEmail,
      orbiterPhone: draftPayload.orbiterContact,
    });

    const messageTrigger = await triggerProspectAssessmentMessages(templateValues, {
      skipEmail: true,
    });
    const messageTriggerSnapshot = {
      success: messageTrigger.success,
      email: messageTrigger.email || null,
      whatsapp: messageTrigger.whatsapp || null,
      triggeredAt: messageTrigger.triggeredAt,
      lastError: messageTrigger.success
        ? ""
        : [
            !messageTrigger.email?.ok
              ? messageTrigger.email?.details || messageTrigger.email?.reason || "email_failed"
              : "",
            !messageTrigger.whatsapp?.ok
              ? messageTrigger.whatsapp?.details ||
                messageTrigger.whatsapp?.reason ||
                "whatsapp_failed"
              : "",
          ]
            .filter(Boolean)
            .join("; "),
    };

    const updatedProspect = await provider.prospects.updateById(prospect.id, {
      assessmentMessageTrigger: messageTriggerSnapshot,
      updatedAt: new Date(),
    });

    return jsonSuccess(
      {
        prospect: updatedProspect,
        messageTrigger: messageTriggerSnapshot,
      },
      { status: 201 }
    );
  } catch (error) {
    logProviderFailure({
      route: "/api/user/prospects/draft",
      provider: "firebase",
      code: error?.code || API_ERROR_CODES.PROVIDER_FAILURE,
      error,
    });

    return jsonError("Failed to create draft prospect", {
      status: 500,
      code: error?.code || API_ERROR_CODES.PROVIDER_FAILURE,
    });
  }
}

export async function PATCH(req) {
  const authResult = await requireUserSession(req);

  if (!authResult.ok) {
    logAuthFailure({
      route: "/api/user/prospects/draft",
      status: authResult.status,
      code: authResult.code,
      reason: authResult.reason,
    });

    return jsonError(authResult.message, {
      status: authResult.status,
      code: authResult.code,
    });
  }

  const bodyResult = await readJsonObject(req);

  if (!bodyResult.ok) {
    return jsonError(bodyResult.message, {
      status: bodyResult.status,
      code: bodyResult.code,
    });
  }

  const prospectId = String(bodyResult.data?.id || "").trim();
  const note = String(bodyResult.data?.note || "").trim();
  const currentStage = String(bodyResult.data?.currentStage || "").trim();

  if (!prospectId || !note) {
    return jsonError("Prospect id and note are required", {
      status: 422,
      code: API_ERROR_CODES.INVALID_INPUT,
    });
  }

  try {
    const provider = getDataProvider();
    const existingProspect = await provider.prospects.getById(prospectId);

    if (!existingProspect) {
      return jsonError("Prospect not found", {
        status: 404,
        code: API_ERROR_CODES.NOT_FOUND,
      });
    }

    if (!canAccessProspect(authResult.context, existingProspect)) {
      return jsonError("Unauthorized", {
        status: 403,
        code: API_ERROR_CODES.AUTH_REQUIRED,
      });
    }

    const updatedProspect = await provider.prospects.updateById(prospectId, {
      ...buildProspectEngagementUpdate(note, { lastEngagementDate: new Date() }),
      ...(currentStage ? { currentStage } : {}),
    });

    return jsonSuccess({ prospect: updatedProspect });
  } catch (error) {
    logProviderFailure({
      route: "/api/user/prospects/draft",
      provider: "firebase",
      code: error?.code || API_ERROR_CODES.PROVIDER_FAILURE,
      error,
    });

    return jsonError("Failed to update draft note", {
      status: 500,
      code: error?.code || API_ERROR_CODES.PROVIDER_FAILURE,
    });
  }
}
