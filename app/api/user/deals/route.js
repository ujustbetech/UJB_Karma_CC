import { API_ERROR_CODES } from "@/lib/api/contracts.mjs";
import { logAuthFailure, logProviderFailure } from "@/lib/api/logging.mjs";
import { jsonError, jsonSuccess } from "@/lib/api/response.mjs";
import { requireUserSession } from "@/lib/auth/userRequestAuth.mjs";
import {
  listApprovedRedemptionDeals,
} from "@/lib/redeem/userRedeemApiWorkflow.mjs";
import { adminDb } from "@/lib/firebase/firebaseAdmin";

const ROUTE = "/api/user/deals";

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
    const deals = await listApprovedRedemptionDeals(adminDb);
    return jsonSuccess({ deals });
  } catch (error) {
    logProviderFailure({
      route: ROUTE,
      provider: "firebase",
      code: error?.code || API_ERROR_CODES.PROVIDER_FAILURE,
      error,
    });

    return jsonError("Failed to load deals", {
      status: 500,
      code: error?.code || API_ERROR_CODES.PROVIDER_FAILURE,
    });
  }
}


