import { API_ERROR_CODES } from "@/lib/api/contracts.mjs";
import { logAuthFailure, logProviderFailure } from "@/lib/api/logging.mjs";
import { readJsonObject } from "@/lib/api/request.mjs";
import { jsonError, jsonSuccess } from "@/lib/api/response.mjs";
import { requireUserSession } from "@/lib/auth/userRequestAuth.mjs";
import { getDataProvider } from "@/lib/data/provider.mjs";
import { adminDb } from "@/lib/firebase/firebaseAdmin";
import {
  buildCcReferralPayload,
  getApprovedRedemptionDealById,
} from "@/lib/redeem/userRedeemApiWorkflow.mjs";
import sanitizeForFirestore from "@/utils/sanitizeForFirestore";

const ROUTE = "/api/user/deals/[id]";

async function resolveDeal(params) {
  const resolved = await params;
  return String(resolved?.id || "").trim();
}

export async function GET(req, { params }) {
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
    const id = await resolveDeal(params);
    const deal = await getApprovedRedemptionDealById(adminDb, id);

    if (!deal) {
      return jsonError("Deal not found", {
        status: 404,
        code: API_ERROR_CODES.NOT_FOUND,
      });
    }

    const provider = getDataProvider();
    const user = await provider.users.getByUjbCode(authResult.context.ujbCode);

    if (!user) {
      return jsonError("Profile not found", {
        status: 404,
        code: API_ERROR_CODES.NOT_FOUND,
      });
    }

    const orbiter = {
      ujbCode: user.UJBCode || user.ujbCode || user.id || authResult.context.ujbCode,
      name: user.Name || user.name || "",
      phone: user.MobileNo || user.phone || "",
      email: user.Email || user.email || "",
      mentorName: user.mentorName || user.MentorName || "",
      mentorUJBCode: user.mentorUJBCode || user.MentorUJBCode || "",
      mentorResidentStatus:
        user.mentorResidentStatus || user.MentorResidentStatus || "Resident",
      residentStatus: user.residentStatus || user.ResidentStatus || "Resident",
    };

    return jsonSuccess({ deal, orbiter });
  } catch (error) {
    logProviderFailure({
      route: ROUTE,
      provider: "firebase",
      code: error?.code || API_ERROR_CODES.PROVIDER_FAILURE,
      error,
    });

    return jsonError("Failed to load deal", {
      status: 500,
      code: error?.code || API_ERROR_CODES.PROVIDER_FAILURE,
    });
  }
}

export async function POST(req, { params }) {
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
    const id = await resolveDeal(params);
    const leadDescription = String(bodyResult.data?.leadDescription || "").trim();

    if (!leadDescription) {
      return jsonError("Lead description is required", {
        status: 400,
        code: API_ERROR_CODES.INVALID_INPUT,
      });
    }

    const deal = await getApprovedRedemptionDealById(adminDb, id);
    if (!deal) {
      return jsonError("Deal not found", {
        status: 404,
        code: API_ERROR_CODES.NOT_FOUND,
      });
    }

    const provider = getDataProvider();
    const user = await provider.users.getByUjbCode(authResult.context.ujbCode);

    if (!user) {
      return jsonError("Profile not found", {
        status: 404,
        code: API_ERROR_CODES.NOT_FOUND,
      });
    }

    const orbiter = sanitizeForFirestore({
      ujbCode: user.UJBCode || user.ujbCode || user.id || authResult.context.ujbCode,
      name: user.Name || user.name || "",
      phone: user.MobileNo || user.phone || "",
      email: user.Email || user.email || "",
      mentorName: user.mentorName || user.MentorName || "",
      mentorUJBCode: user.mentorUJBCode || user.MentorUJBCode || "",
      mentorResidentStatus:
        user.mentorResidentStatus || user.MentorResidentStatus || "Resident",
      residentStatus: user.residentStatus || user.ResidentStatus || "Resident",
    });

    const payload = buildCcReferralPayload({
      deal,
      orbiter,
      leadDescription,
    });

    const ref = await adminDb.collection("CCReferral").add(payload);

    return jsonSuccess({ referralId: ref.id });
  } catch (error) {
    logProviderFailure({
      route: ROUTE,
      provider: "firebase",
      code: error?.code || API_ERROR_CODES.PROVIDER_FAILURE,
      error,
    });

    return jsonError("Failed to submit referral", {
      status: 500,
      code: error?.code || API_ERROR_CODES.PROVIDER_FAILURE,
    });
  }
}


