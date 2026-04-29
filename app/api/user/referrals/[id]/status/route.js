import { API_ERROR_CODES } from "@/lib/api/contracts.mjs";
import { logAuthFailure, logProviderFailure } from "@/lib/api/logging.mjs";
import { readJsonObject } from "@/lib/api/request.mjs";
import { jsonError, jsonSuccess } from "@/lib/api/response.mjs";
import {
  adminDb,
} from "@/lib/firebase/firebaseAdmin";
import { publicEnv } from "@/lib/config/publicEnv";
import { requireUserSession } from "@/lib/auth/userRequestAuth.mjs";
import {
  canUserUpdateReferralStatus,
  getReferralParticipantRole,
  updateReferralStatusRecord,
} from "@/lib/referrals/referralServerWorkflow.mjs";

const referralCollectionName = publicEnv.collections.referral;

export async function PATCH(req, { params }) {
  const authResult = await requireUserSession(req);

  if (!authResult.ok) {
    logAuthFailure({
      route: "/api/user/referrals/[id]/status",
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
    const { id } = await params;
    const nextStatus = bodyResult.data?.status;
    const rejectReason = bodyResult.data?.rejectReason || "";
    const referralSnap = await adminDb.collection(referralCollectionName).doc(id).get();

    if (!referralSnap.exists) {
      return jsonError("Referral not found", {
        status: 404,
        code: API_ERROR_CODES.NOT_FOUND,
      });
    }

    const referral = referralSnap.data();
    const sessionUjbCode = String(authResult.context?.ujbCode || "").trim();
    const actorRole = getReferralParticipantRole({
      referral,
      sessionUjbCode,
    });

    if (!canUserUpdateReferralStatus({ referral, sessionUjbCode })) {
      return jsonError("Only the assigned COSM or Orbiter can update this referral", {
        status: 403,
        code: API_ERROR_CODES.FORBIDDEN,
      });
    }

    const updated = await updateReferralStatusRecord({
      adminDb,
      referralCollectionName,
      referralId: id,
      nextStatus,
      rejectReason,
    });

    return jsonSuccess({ referral: updated, actorRole });
  } catch (error) {
    logProviderFailure({
      route: "/api/user/referrals/[id]/status",
      provider: "firebase",
      code: error?.code || API_ERROR_CODES.PROVIDER_FAILURE,
      error,
    });

    return jsonError(error?.message || "Failed to update referral", {
      status: error?.status || 500,
      code: error?.code || API_ERROR_CODES.PROVIDER_FAILURE,
    });
  }
}


