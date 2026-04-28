import { API_ERROR_CODES } from "@/lib/api/contracts.mjs";
import { logAuthFailure, logProviderFailure } from "@/lib/api/logging.mjs";
import { readJsonObject } from "@/lib/api/request.mjs";
import { jsonError, jsonSuccess } from "@/lib/api/response.mjs";
import { requireUserSession } from "@/lib/auth/userRequestAuth.mjs";
import { getDataProvider } from "@/lib/data/provider.mjs";

const EMAIL_REGEX = /^\S+@\S+\.\S+$/;

function normalizeProspectPhone(value) {
  return String(value || "").replace(/\D/g, "").slice(0, 10);
}

function normalizeProspectPayload(payload = {}) {
  return {
    prospectName: String(payload.prospectName || "").trim(),
    prospectPhone: normalizeProspectPhone(payload.prospectPhone),
    prospectEmail: String(payload.prospectEmail || "").trim(),
    occupation: String(payload.occupation || "").trim(),
    hobbies: String(payload.hobbies || "").trim(),
    source: String(payload.source || "").trim(),
  };
}

function validateProspectPayload(payload) {
  if (!payload.prospectName) {
    return "Prospect name is required";
  }

  if (!/^\d{10}$/.test(payload.prospectPhone)) {
    return "Phone number must be 10 digits";
  }

  if (payload.prospectEmail && !EMAIL_REGEX.test(payload.prospectEmail)) {
    return "Invalid email address";
  }

  if (!payload.occupation) {
    return "Please select occupation";
  }

  if (!payload.source) {
    return "Please select source";
  }

  return "";
}

function buildLegacyProspectDate(now) {
  return now.toLocaleString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export async function GET(req) {
  const authResult = await requireUserSession(req);

  if (!authResult.ok) {
    logAuthFailure({
      route: "/api/user/prospects",
      status: authResult.status,
      code: authResult.code,
      reason: authResult.reason,
    });

    return jsonError(authResult.message, {
      status: authResult.status,
      code: authResult.code,
    });
  }

  try {
    const provider = getDataProvider();
    const prospects = await provider.prospects.listForUser({
      ujbCode: authResult.context.ujbCode,
      phone: authResult.context.phone,
    });

    return jsonSuccess({ prospects });
  } catch (error) {
    logProviderFailure({
      route: "/api/user/prospects",
      provider: "firebase",
      code: error?.code || API_ERROR_CODES.PROVIDER_FAILURE,
      error,
    });

    return jsonError("Failed to load prospects", {
      status: 500,
      code: error?.code || API_ERROR_CODES.PROVIDER_FAILURE,
    });
  }
}

export async function POST(req) {
  const authResult = await requireUserSession(req);

  if (!authResult.ok) {
    logAuthFailure({
      route: "/api/user/prospects",
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
    const now = new Date();

    const prospect = await provider.prospects.create({
      prospectName: payload.prospectName,
      prospectPhone: payload.prospectPhone,
      email: payload.prospectEmail,
      occupation: payload.occupation,
      hobbies: payload.hobbies,
      source: payload.source,
      orbiterName:
        String(mentor?.Name || mentor?.name || "").trim() ||
        authResult.context.ujbCode,
      orbiterContact: String(authResult.context.phone || "").trim(),
      orbiterEmail: String(mentor?.Email || mentor?.email || "").trim(),
      mentorUjbCode: String(authResult.context.ujbCode || "").trim(),
      date: buildLegacyProspectDate(now),
      registeredAt: now,
      userType: "orbiter",
      createdAt: now,
      updatedAt: now,
    });

    return jsonSuccess({ prospect }, { status: 201 });
  } catch (error) {
    logProviderFailure({
      route: "/api/user/prospects",
      provider: "firebase",
      code: error?.code || API_ERROR_CODES.PROVIDER_FAILURE,
      error,
    });

    return jsonError("Failed to create prospect", {
      status: 500,
      code: error?.code || API_ERROR_CODES.PROVIDER_FAILURE,
    });
  }
}
