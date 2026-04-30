import { API_ERROR_CODES } from "@/lib/api/contracts.mjs";
import { jsonError, jsonSuccess } from "@/lib/api/response.mjs";
import { logAuthFailure, logProviderFailure } from "@/lib/api/logging.mjs";
import { readJsonObject, requiredString } from "@/lib/api/request.mjs";
import { requireUserSession } from "@/lib/auth/userRequestAuth.mjs";
import { getDataProvider } from "@/lib/data/provider.mjs";
import {
  attachCcReferralFile,
  ensureCcReferralAccess,
  fetchCcReferralDetail,
  previewOrApplyCcAdjustment,
  recordCcCosmoPayment,
  recordCcUjbPayout,
  replaceCcFollowups,
  saveCcDealLog,
  updateCcReferralStatus,
} from "@/lib/referrals/ccReferralServerWorkflow.mjs";

const ROUTE = "/api/user/ccreferrals/[id]";

const RECIPIENT_FIELD_MAP = Object.freeze({
  Orbiter: "paidToOrbiter",
  OrbiterMentor: "paidToOrbiterMentor",
  CosmoMentor: "paidToCosmoMentor",
});

async function requireCcReferralAccess(req, params) {
  const authResult = await requireUserSession(req);

  if (!authResult.ok) {
    logAuthFailure({
      route: ROUTE,
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
      response: jsonError("Missing CC referral id", {
        status: 422,
        code: API_ERROR_CODES.INVALID_INPUT,
      }),
    };
  }

  const provider = getDataProvider();
  const detail = await fetchCcReferralDetail({ provider, id });

  if (!detail) {
    return {
      ok: false,
      response: jsonError("CC referral not found", {
        status: 404,
        code: API_ERROR_CODES.NOT_FOUND,
      }),
    };
  }

  const userRole = ensureCcReferralAccess({
    referral: detail.referral,
    sessionUjbCode: authResult.context.ujbCode,
  });

  if (!userRole) {
    return {
      ok: false,
      response: jsonError("You cannot access this CC referral", {
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
    detail: {
      ...detail,
      userRole,
    },
  };
}

export async function GET(req, { params }) {
  try {
    const access = await requireCcReferralAccess(req, params);

    if (!access.ok) {
      return access.response;
    }

    return jsonSuccess(access.detail);
  } catch (error) {
    logProviderFailure({
      route: ROUTE,
      provider: "firebase",
      code: error?.code || API_ERROR_CODES.PROVIDER_FAILURE,
      error,
    });

    return jsonError("Failed to load CC referral", {
      status: 500,
      code: error?.code || API_ERROR_CODES.PROVIDER_FAILURE,
    });
  }
}

export async function PATCH(req, { params }) {
  try {
    const access = await requireCcReferralAccess(req, params);

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

    const actionResult = requiredString(bodyResult.data.action, "action");

    if (!actionResult.ok) {
      return jsonError(actionResult.message, {
        status: actionResult.status,
        code: actionResult.code,
      });
    }

    const { provider, id } = access;
    const { referral } = access.detail;
    const action = actionResult.value;
    let mutationResult = null;

    switch (action) {
      case "updateStatus":
        mutationResult = await updateCcReferralStatus({
          provider,
          referral,
          id,
          nextStatus: bodyResult.data.status,
          rejectReason: bodyResult.data.rejectReason || "",
        });
        break;
      case "saveDealLog":
        mutationResult = await saveCcDealLog({
          provider,
          referral,
          id,
          distribution: bodyResult.data.distribution || {},
        });
        break;
      case "replaceFollowups":
        mutationResult = await replaceCcFollowups({
          provider,
          id,
          followups: bodyResult.data.followups || [],
        });
        break;
      case "attachFile":
        mutationResult = await attachCcReferralFile({
          provider,
          referral,
          id,
          type: bodyResult.data.type,
          url: bodyResult.data.url,
          name: bodyResult.data.name,
        });
        break;
      case "recordCosmoPayment":
        mutationResult = await recordCcCosmoPayment({
          provider,
          referral,
          id,
          entry: bodyResult.data.entry || {},
        });
        break;
      case "recordUjbPayout": {
        const recipient = String(bodyResult.data.recipient || "").trim();
        const recipientField = RECIPIENT_FIELD_MAP[recipient];

        if (!recipientField) {
          return jsonError("Invalid payout recipient", {
            status: 422,
            code: API_ERROR_CODES.INVALID_INPUT,
          });
        }

        mutationResult = await recordCcUjbPayout({
          provider,
          referral,
          id,
          entry: bodyResult.data.entry || {},
          recipientField,
        });
        break;
      }
      case "previewAdjustment":
      case "applyAdjustment":
        mutationResult = await previewOrApplyCcAdjustment({
          provider,
          referral,
          role: bodyResult.data.role,
          requestedAmount: bodyResult.data.requestedAmount,
          dealValue: bodyResult.data.dealValue,
          ujbCode: bodyResult.data.ujbCode,
          previewOnly: action === "previewAdjustment",
        });
        return jsonSuccess({ adjustment: mutationResult });
      default:
        return jsonError("Unsupported CC referral action", {
          status: 422,
          code: API_ERROR_CODES.INVALID_INPUT,
        });
    }

    const refreshed = await fetchCcReferralDetail({ provider, id });

    return jsonSuccess({
      referral: refreshed?.referral || mutationResult,
      orbiter: refreshed?.orbiter || null,
      cosmoOrbiter: refreshed?.cosmoOrbiter || null,
      userRole:
        refreshed &&
        ensureCcReferralAccess({
          referral: refreshed.referral,
          sessionUjbCode: access.context.ujbCode,
        }),
    });
  } catch (error) {
    logProviderFailure({
      route: ROUTE,
      provider: "firebase",
      code: error?.code || API_ERROR_CODES.PROVIDER_FAILURE,
      error,
    });

    return jsonError(error?.message || "Failed to update CC referral", {
      status: error?.status || 500,
      code: error?.code || API_ERROR_CODES.PROVIDER_FAILURE,
    });
  }
}


