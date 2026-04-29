import { API_ERROR_CODES } from "@/lib/api/contracts.mjs";
import { jsonError, jsonSuccess } from "@/lib/api/response.mjs";
import { logAuthFailure, logProviderFailure } from "@/lib/api/logging.mjs";
import { readJsonObject, requiredString } from "@/lib/api/request.mjs";
import { requireUserSession } from "@/lib/auth/userRequestAuth.mjs";
import { getDataProvider } from "@/lib/data/provider.mjs";
import { getReferralParticipantRole } from "@/lib/referrals/referralServerWorkflow.mjs";

function normalizeUjbCode(value) {
  return String(value || "").trim();
}

function getParticipantCodes(referral) {
  return [
    normalizeUjbCode(referral?.cosmoUjbCode || referral?.cosmoOrbiter?.ujbCode),
    normalizeUjbCode(
      referral?.orbiterUJBCode ||
        referral?.orbiter?.ujbCode ||
        referral?.orbiter?.UJBCode
    ),
  ].filter(Boolean);
}

async function requireChatAccess(req, params, otherUjbCode, route) {
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

  const id = String(params?.id || "").trim();

  if (!id) {
    return {
      ok: false,
      response: jsonError("Missing referral id", {
        status: 422,
        code: API_ERROR_CODES.INVALID_INPUT,
      }),
    };
  }

  const otherCode = normalizeUjbCode(otherUjbCode);

  if (!otherCode) {
    return {
      ok: false,
      response: jsonError("Missing chat participant", {
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
  const participantCodes = getParticipantCodes(referral);

  if (
    !userRole ||
    !participantCodes.includes(otherCode) ||
    otherCode === authResult.context.ujbCode
  ) {
    return {
      ok: false,
      response: jsonError("You cannot access this referral chat", {
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
    otherUjbCode: otherCode,
  };
}

export async function GET(req, { params }) {
  const route = "/api/user/referrals/[id]/chat";

  try {
    const access = await requireChatAccess(
      req,
      params,
      req.nextUrl.searchParams.get("otherUjbCode"),
      route
    );

    if (!access.ok) {
      return access.response;
    }

    const messages = await access.provider.referrals.listChatMessages({
      referralId: access.id,
      currentUserUjbCode: access.context.ujbCode,
      otherUjbCode: access.otherUjbCode,
    });

    return jsonSuccess({ messages });
  } catch (error) {
    logProviderFailure({
      route,
      provider: "firebase",
      code: error?.code || API_ERROR_CODES.PROVIDER_FAILURE,
      error,
    });

    return jsonError("Failed to load chat", {
      status: 500,
      code: error?.code || API_ERROR_CODES.PROVIDER_FAILURE,
    });
  }
}

export async function POST(req, { params }) {
  const route = "/api/user/referrals/[id]/chat";

  try {
    const bodyResult = await readJsonObject(req);

    if (!bodyResult.ok) {
      return jsonError(bodyResult.message, {
        status: bodyResult.status,
        code: bodyResult.code,
      });
    }

    const otherResult = requiredString(
      bodyResult.data.otherUjbCode,
      "chat participant"
    );

    if (!otherResult.ok) {
      return jsonError(otherResult.message, {
        status: otherResult.status,
        code: otherResult.code,
      });
    }

    const access = await requireChatAccess(
      req,
      params,
      otherResult.value,
      route
    );

    if (!access.ok) {
      return access.response;
    }

    const textResult = requiredString(bodyResult.data.text, "message");

    if (!textResult.ok) {
      return jsonError(textResult.message, {
        status: textResult.status,
        code: textResult.code,
      });
    }

    const message = await access.provider.referrals.addChatMessage({
      referralId: access.id,
      currentUserUjbCode: access.context.ujbCode,
      otherUjbCode: access.otherUjbCode,
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

    return jsonError("Failed to send chat message", {
      status: 500,
      code: error?.code || API_ERROR_CODES.PROVIDER_FAILURE,
    });
  }
}



