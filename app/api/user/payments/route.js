import { API_ERROR_CODES } from "@/lib/api/contracts.mjs";
import { logAuthFailure, logProviderFailure } from "@/lib/api/logging.mjs";
import { jsonError, jsonSuccess } from "@/lib/api/response.mjs";
import { requireUserSession } from "@/lib/auth/userRequestAuth.mjs";
import { adminDb } from "@/lib/firebase/firebaseAdmin";
import { publicEnv } from "@/lib/config/publicEnv";
import { getDataProvider } from "@/lib/data/provider.mjs";
import { buildUserPaymentsSummary } from "@/lib/redeem/userRedeemApiWorkflow.mjs";

const ROUTE = "/api/user/payments";

export async function GET(req) {
  const authResult = await requireUserSession(req);

  if (!authResult.ok) {
    logAuthFailure({
      route: ROUTE,
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
    const user = await provider.users.getByUjbCode(authResult.context.ujbCode);

    if (!user) {
      return jsonError("Profile not found", {
        status: 404,
        code: API_ERROR_CODES.NOT_FOUND,
      });
    }

    const summary = await buildUserPaymentsSummary({
      adminDb,
      ujbCode: authResult.context.ujbCode,
      category: user.Category || user.category || "",
      referralCollectionName: publicEnv.collections.referral,
    });

    return jsonSuccess(summary);
  } catch (error) {
    logProviderFailure({
      route: ROUTE,
      provider: "firebase",
      code: error?.code || API_ERROR_CODES.PROVIDER_FAILURE,
      error,
    });

    return jsonError("Failed to load payments", {
      status: 500,
      code: error?.code || API_ERROR_CODES.PROVIDER_FAILURE,
    });
  }
}
