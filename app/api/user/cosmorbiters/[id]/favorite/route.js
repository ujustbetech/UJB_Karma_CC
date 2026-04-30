import { API_ERROR_CODES } from "@/lib/api/contracts.mjs";
import { logAuthFailure, logProviderFailure } from "@/lib/api/logging.mjs";
import { jsonError, jsonSuccess } from "@/lib/api/response.mjs";
import {
  adminDb,
} from "@/lib/firebase/firebaseAdmin";
import { requireUserSession } from "@/lib/auth/userRequestAuth.mjs";

const favoritesCollectionName = "favorites";

export async function POST(req, { params }) {
  const authResult = await requireUserSession(req);

  if (!authResult.ok) {
    logAuthFailure({
      route: "/api/user/cosmorbiters/[id]/favorite",
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
    const { id } = await params;
    const sessionUjbCode = String(authResult.context?.ujbCode || "").trim();

    if (!id || !sessionUjbCode) {
      return jsonError("Missing favorite context", {
        status: 400,
        code: API_ERROR_CODES.INVALID_INPUT,
      });
    }

    await adminDb
      .collection(favoritesCollectionName)
      .doc(`${sessionUjbCode}_${id}`)
      .set({
        orbiter: sessionUjbCode,
        cosmoUjbCode: id,
        timestamp: new Date(),
      });

    return jsonSuccess({});
  } catch (error) {
    logProviderFailure({
      route: "/api/user/cosmorbiters/[id]/favorite",
      provider: "firebase",
      code: error?.code || API_ERROR_CODES.PROVIDER_FAILURE,
      error,
    });

    return jsonError(error?.message || "Failed to add favorite", {
      status: 500,
      code: error?.code || API_ERROR_CODES.PROVIDER_FAILURE,
    });
  }
}

export async function DELETE(req, { params }) {
  const authResult = await requireUserSession(req);

  if (!authResult.ok) {
    logAuthFailure({
      route: "/api/user/cosmorbiters/[id]/favorite",
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
    const { id } = await params;
    const sessionUjbCode = String(authResult.context?.ujbCode || "").trim();

    if (!id || !sessionUjbCode) {
      return jsonError("Missing favorite context", {
        status: 400,
        code: API_ERROR_CODES.INVALID_INPUT,
      });
    }

    await adminDb
      .collection(favoritesCollectionName)
      .doc(`${sessionUjbCode}_${id}`)
      .delete();

    return jsonSuccess({});
  } catch (error) {
    logProviderFailure({
      route: "/api/user/cosmorbiters/[id]/favorite",
      provider: "firebase",
      code: error?.code || API_ERROR_CODES.PROVIDER_FAILURE,
      error,
    });

    return jsonError(error?.message || "Failed to remove favorite", {
      status: 500,
      code: error?.code || API_ERROR_CODES.PROVIDER_FAILURE,
    });
  }
}


