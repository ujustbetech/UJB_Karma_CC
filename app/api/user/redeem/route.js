import { API_ERROR_CODES } from "@/lib/api/contracts.mjs";
import { logAuthFailure, logProviderFailure } from "@/lib/api/logging.mjs";
import { readJsonObject } from "@/lib/api/request.mjs";
import { jsonError, jsonSuccess } from "@/lib/api/response.mjs";
import { requireUserSession } from "@/lib/auth/userRequestAuth.mjs";
import { getDataProvider } from "@/lib/data/provider.mjs";
import { adminDb } from "@/lib/firebase/firebaseAdmin";
import {
  buildRedeemProfile,
  buildRedeemRequestPayload,
  CC_REDEMPTION_COLLECTION,
} from "@/lib/redeem/userRedeemApiWorkflow.mjs";

const ROUTE = "/api/user/redeem";

async function requireRedeemProfile(ujbCode) {
  const provider = getDataProvider();
  const user = await provider.users.getByUjbCode(ujbCode);

  if (!user) {
    return null;
  }

  return buildRedeemProfile(user);
}

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
    const profile = await requireRedeemProfile(authResult.context.ujbCode);

    if (!profile) {
      return jsonError("Profile not found", {
        status: 404,
        code: API_ERROR_CODES.NOT_FOUND,
      });
    }

    return jsonSuccess({ profile });
  } catch (error) {
    logProviderFailure({
      route: ROUTE,
      provider: "firebase",
      code: error?.code || API_ERROR_CODES.PROVIDER_FAILURE,
      error,
    });

    return jsonError("Failed to load redemption profile", {
      status: 500,
      code: error?.code || API_ERROR_CODES.PROVIDER_FAILURE,
    });
  }
}

export async function PATCH(req) {
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
    const user = await provider.users.updateByUjbCode(authResult.context.ujbCode, {
      ccRedemptionAgreementAccepted: true,
      ccRedemptionAgreementAcceptedAt: new Date(),
    });

    return jsonSuccess({ profile: buildRedeemProfile(user) });
  } catch (error) {
    logProviderFailure({
      route: ROUTE,
      provider: "firebase",
      code: error?.code || API_ERROR_CODES.PROVIDER_FAILURE,
      error,
    });

    return jsonError("Failed to accept agreement", {
      status: 500,
      code: error?.code || API_ERROR_CODES.PROVIDER_FAILURE,
    });
  }
}

export async function POST(req) {
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

  const bodyResult = await readJsonObject(req);
  if (!bodyResult.ok) {
    return jsonError(bodyResult.message, {
      status: bodyResult.status,
      code: bodyResult.code,
    });
  }

  try {
    const profile = await requireRedeemProfile(authResult.context.ujbCode);

    if (!profile) {
      return jsonError("Profile not found", {
        status: 404,
        code: API_ERROR_CODES.NOT_FOUND,
      });
    }

    const mode = String(bodyResult.data?.mode || "").trim();
    const selectedItem = bodyResult.data?.selectedItem || null;
    const multipleItems = Array.isArray(bodyResult.data?.multipleItems)
      ? bodyResult.data.multipleItems
      : [];

    if (!mode) {
      return jsonError("Redeem mode is required", {
        status: 400,
        code: API_ERROR_CODES.INVALID_INPUT,
      });
    }

    if (mode === "single" && !selectedItem) {
      return jsonError("Select one item", {
        status: 400,
        code: API_ERROR_CODES.INVALID_INPUT,
      });
    }

    if (mode === "multiple" && multipleItems.length === 0) {
      return jsonError("Select at least one item", {
        status: 400,
        code: API_ERROR_CODES.INVALID_INPUT,
      });
    }

    const payload = buildRedeemRequestPayload({
      profile,
      mode,
      selectedItem,
      multipleItems,
      originalPercent: bodyResult.data?.originalPercent,
      enhanceRequired: bodyResult.data?.enhanceRequired,
      enhancedPercent: bodyResult.data?.enhancedPercent,
      finalPercent: bodyResult.data?.finalPercent,
    });

    const ref = await adminDb.collection(CC_REDEMPTION_COLLECTION).add(payload);
    return jsonSuccess({ requestId: ref.id });
  } catch (error) {
    logProviderFailure({
      route: ROUTE,
      provider: "firebase",
      code: error?.code || API_ERROR_CODES.PROVIDER_FAILURE,
      error,
    });

    return jsonError("Failed to submit redeem request", {
      status: 500,
      code: error?.code || API_ERROR_CODES.PROVIDER_FAILURE,
    });
  }
}


