import { API_ERROR_CODES } from "@/lib/api/contracts.mjs";
import { jsonError, jsonSuccess } from "@/lib/api/response.mjs";
import { logAuthFailure, logProviderFailure } from "@/lib/api/logging.mjs";
import { requireUserSession } from "@/lib/auth/userRequestAuth.mjs";
import { getDataProvider } from "@/lib/data/provider.mjs";
import { getReferralParticipantRole } from "@/lib/referrals/referralServerWorkflow.mjs";

export async function GET(req, { params }) {
  const authResult = await requireUserSession(req);

  if (!authResult.ok) {
    logAuthFailure({
      route: "/api/user/referrals/[id]",
      status: authResult.status,
      code: authResult.code,
      reason: authResult.reason,
    });

    return jsonError(authResult.message, {
      status: authResult.status,
      code: authResult.code,
    });
  }

  const id = String((await params)?.id || "").trim();

  if (!id) {
    return jsonError("Missing referral id", {
      status: 422,
      code: API_ERROR_CODES.INVALID_INPUT,
    });
  }

  try {
    const provider = getDataProvider();
    const referral = await provider.referrals.getById(id);

    if (!referral) {
      return jsonError("Referral not found", {
        status: 404,
        code: API_ERROR_CODES.NOT_FOUND,
      });
    }

    const userRole = getReferralParticipantRole({
      referral,
      sessionUjbCode: authResult.context.ujbCode,
    });

    if (!userRole) {
      return jsonError("You cannot access this referral", {
        status: 403,
        code: API_ERROR_CODES.FORBIDDEN,
      });
    }

    return jsonSuccess({ referral, userRole });
  } catch (error) {
    logProviderFailure({
      route: "/api/user/referrals/[id]",
      provider: "firebase",
      code: error?.code || API_ERROR_CODES.PROVIDER_FAILURE,
      error,
    });

    return jsonError("Failed to load referral", {
      status: 500,
      code: error?.code || API_ERROR_CODES.PROVIDER_FAILURE,
    });
  }
}

