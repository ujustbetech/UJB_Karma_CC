import { API_ERROR_CODES } from "@/lib/api/contracts.mjs";
import { logAuthFailure, logProviderFailure } from "@/lib/api/logging.mjs";
import { readJsonObject } from "@/lib/api/request.mjs";
import { jsonError, jsonSuccess } from "@/lib/api/response.mjs";
import { requireUserSession } from "@/lib/auth/userRequestAuth.mjs";
import { getDataProvider } from "@/lib/data/provider.mjs";
import { adminDb } from "@/lib/firebase/firebaseAdmin";
import { publicEnv } from "@/lib/config/publicEnv";

async function getUserNameByPhone(phone) {
  const value = String(phone || "").trim();

  if (!value) {
    return "";
  }

  const snap = await adminDb
    .collection(publicEnv.collections.userDetail)
    .where("MobileNo", "==", value)
    .limit(1)
    .get();

  if (snap.empty) {
    return "";
  }

  return String(snap.docs[0].data()?.Name || "").trim();
}

export async function GET(req, { params }) {
  const authResult = await requireUserSession(req);

  if (!authResult.ok) {
    logAuthFailure({
      route: "/api/user/conclave/[id]/meetings/[meetingId]",
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
    const conclaveId = String((await params)?.id || "").trim();
    const meetingId = String((await params)?.meetingId || "").trim();

    if (!conclaveId || !meetingId) {
      return jsonError("Missing conclave or meeting id", {
        status: 400,
        code: API_ERROR_CODES.INVALID_INPUT,
      });
    }

    const provider = getDataProvider();
    const [conclave, meeting, userName] = await Promise.all([
      provider.conclaves.getById(conclaveId),
      provider.conclaves.getMeetingById(conclaveId, meetingId),
      getUserNameByPhone(authResult.context.phone),
    ]);

    if (!conclave || !meeting) {
      return jsonError("Meeting not found", {
        status: 404,
        code: API_ERROR_CODES.NOT_FOUND,
      });
    }

    return jsonSuccess({
      conclave,
      meeting,
      currentUser: {
        name: userName,
        phoneNumber: authResult.context.phone,
      },
    });
  } catch (error) {
    logProviderFailure({
      route: "/api/user/conclave/[id]/meetings/[meetingId]",
      provider: "firebase",
      code: error?.code || API_ERROR_CODES.PROVIDER_FAILURE,
      error,
    });

    return jsonError("Failed to load meeting details", {
      status: 500,
      code: error?.code || API_ERROR_CODES.PROVIDER_FAILURE,
    });
  }
}

export async function PATCH(req, { params }) {
  const authResult = await requireUserSession(req);

  if (!authResult.ok) {
    logAuthFailure({
      route: "/api/user/conclave/[id]/meetings/[meetingId]",
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
    const conclaveId = String((await params)?.id || "").trim();
    const meetingId = String((await params)?.meetingId || "").trim();
    const response = String(bodyResult.data?.response || "").trim();
    const reason = String(bodyResult.data?.reason || "").trim();

    if (!conclaveId || !meetingId) {
      return jsonError("Missing conclave or meeting id", {
        status: 400,
        code: API_ERROR_CODES.INVALID_INPUT,
      });
    }

    if (!["Accepted", "Declined"].includes(response)) {
      return jsonError("Invalid response value", {
        status: 422,
        code: API_ERROR_CODES.INVALID_INPUT,
      });
    }

    if (response === "Declined" && !reason) {
      return jsonError("Reason is required for declined response", {
        status: 422,
        code: API_ERROR_CODES.INVALID_INPUT,
      });
    }

    const name = await getUserNameByPhone(authResult.context.phone);
    const provider = getDataProvider();
    const registered = await provider.conclaves.upsertMeetingResponse(
      conclaveId,
      meetingId,
      authResult.context.phone,
      {
        name,
        response,
        reason: response === "Declined" ? reason : "",
      }
    );

    return jsonSuccess({ registered });
  } catch (error) {
    logProviderFailure({
      route: "/api/user/conclave/[id]/meetings/[meetingId]",
      provider: "firebase",
      code: error?.code || API_ERROR_CODES.PROVIDER_FAILURE,
      error,
    });

    return jsonError("Failed to update meeting response", {
      status: 500,
      code: error?.code || API_ERROR_CODES.PROVIDER_FAILURE,
    });
  }
}
