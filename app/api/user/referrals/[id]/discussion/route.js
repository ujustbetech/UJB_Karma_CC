import { API_ERROR_CODES } from "@/lib/api/contracts.mjs";
import { jsonError, jsonSuccess } from "@/lib/api/response.mjs";
import { logAuthFailure, logProviderFailure } from "@/lib/api/logging.mjs";
import { readJsonObject, requiredString } from "@/lib/api/request.mjs";
import { requireUserSession } from "@/lib/auth/userRequestAuth.mjs";
import { getDataProvider } from "@/lib/data/provider.mjs";
import { getReferralParticipantRole } from "@/lib/referrals/referralServerWorkflow.mjs";

async function requireReferralAccess(req, params, route) {
  const authResult = await requireUserSession(req);

  if (!authResult.ok) {
    logAuthFailure({
      route,
      status: authResult.status,
      code: authResult.code,
      reason: authResult.reason,
    });

    return {
      ok: false,
      response: jsonError(authResult.message, {
        status: authResult.status,
        code: authResult.code,
      }),
    };
  }

  const id = String((await params)?.id || "").trim();

  if (!id) {
    return {
      ok: false,
      response: jsonError("Missing referral id", {
        status: 422,
        code: API_ERROR_CODES.INVALID_INPUT,
      }),
    };
  }

  const provider = getDataProvider();
  const referral = await provider.referrals.getById(id);

  if (!referral) {
    return {
      ok: false,
      response: jsonError("Referral not found", {
        status: 404,
        code: API_ERROR_CODES.NOT_FOUND,
      }),
    };
  }

  const userRole = getReferralParticipantRole({
    referral,
    sessionUjbCode: authResult.context.ujbCode,
  });

  if (!userRole) {
    return {
      ok: false,
      response: jsonError("You cannot access this referral", {
        status: 403,
        code: API_ERROR_CODES.FORBIDDEN,
      }),
    };
  }

  return {
    ok: true,
    id,
    provider,
    context: authResult.context,
    referral,
    userRole,
  };
}

export async function GET(req, { params }) {
  const route = "/api/user/referrals/[id]/discussion";

  try {
    const access = await requireReferralAccess(req, params, route);

    if (!access.ok) {
      return access.response;
    }

    const messages = await access.provider.referrals.listDiscussionMessages(
      access.id
    );

    return jsonSuccess({ messages });
  } catch (error) {
    logProviderFailure({
      route,
      provider: "firebase",
      code: error?.code || API_ERROR_CODES.PROVIDER_FAILURE,
      error,
    });

    return jsonError("Failed to load discussion", {
      status: 500,
      code: error?.code || API_ERROR_CODES.PROVIDER_FAILURE,
    });
  }
}

export async function POST(req, { params }) {
  const route = "/api/user/referrals/[id]/discussion";

  try {
    const access = await requireReferralAccess(req, params, route);

    if (!access.ok) {
      return access.response;
    }

    const bodyResult = await readJsonObject(req);

    if (!bodyResult.ok) {
      return jsonError(bodyResult.message, {
        status: bodyResult.status,
        code: bodyResult.code,
      });
    }

    const textResult = requiredString(bodyResult.data.text, "message");

    if (!textResult.ok) {
      return jsonError(textResult.message, {
        status: textResult.status,
        code: textResult.code,
      });
    }

    const message = await access.provider.referrals.addDiscussionMessage({
      referralId: access.id,
      senderUjbCode: access.context.ujbCode,
      text: textResult.value,
    });

    return jsonSuccess({ message }, { status: 201 });
  } catch (error) {
    logProviderFailure({
      route,
      provider: "firebase",
      code: error?.code || API_ERROR_CODES.PROVIDER_FAILURE,
      error,
    });

    return jsonError("Failed to send discussion message", {
      status: 500,
      code: error?.code || API_ERROR_CODES.PROVIDER_FAILURE,
    });
  }
}



