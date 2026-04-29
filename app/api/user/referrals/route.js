import { API_ERROR_CODES } from "@/lib/api/contracts.mjs";
import { readJsonObject } from "@/lib/api/request.mjs";
import { jsonError, jsonSuccess } from "@/lib/api/response.mjs";
import {
  adminDb,
} from "@/lib/firebase/firebaseAdmin";
import { publicEnv } from "@/lib/config/publicEnv";
import {
  requireUserSession,
} from "@/lib/auth/userRequestAuth.mjs";
import { logAuthFailure, logProviderFailure } from "@/lib/api/logging.mjs";
import { getDataProvider } from "@/lib/data/provider.mjs";
import { createReferralRecord } from "@/lib/referrals/referralServerWorkflow.mjs";

const referralCollectionName = publicEnv.collections.referral;
const userCollectionName = publicEnv.collections.userDetail;

export async function GET(req) {
  const authResult = await requireUserSession(req);

  if (!authResult.ok) {
    logAuthFailure({
      route: "/api/user/referrals",
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
    const referrals = await provider.referrals.listForUser(
      authResult.context.ujbCode
    );

    return jsonSuccess({
      ...referrals,
      counts: {
        my: referrals.my.length,
        passed: referrals.passed.length,
      },
    });
  } catch (error) {
    logProviderFailure({
      route: "/api/user/referrals",
      provider: "firebase",
      code: error?.code || API_ERROR_CODES.PROVIDER_FAILURE,
      error,
    });

    return jsonError("Failed to load referrals", {
      status: 500,
      code: error?.code || API_ERROR_CODES.PROVIDER_FAILURE,
    });
  }
}

export async function POST(req) {
  const authResult = await requireUserSession(req);

  if (!authResult.ok) {
    logAuthFailure({
      route: "/api/user/referrals",
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

  try {
    const payload = bodyResult.data;
    const sessionUjbCode = String(authResult.context?.ujbCode || "").trim();
    const orbiterUjbCode = String(payload?.orbiterDetails?.ujbCode || "").trim();

    if (!sessionUjbCode || sessionUjbCode !== orbiterUjbCode) {
      return jsonError("Unauthorized referral actor", {
        status: 403,
        code: API_ERROR_CODES.FORBIDDEN,
      });
    }

    const created = await createReferralRecord({
      adminDb,
      referralCollectionName,
      userCollectionName,
      payload,
    });

    return jsonSuccess({
      referralId: created.referralId,
      id: created.id,
    });
  } catch (error) {
    return jsonError(error?.message || "Failed to create referral", {
      status: error?.status || 500,
      code: error?.code || API_ERROR_CODES.PROVIDER_FAILURE,
    });
  }
}


