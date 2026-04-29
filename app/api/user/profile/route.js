import { API_ERROR_CODES } from "@/lib/api/contracts.mjs";
import { logAuthFailure, logProviderFailure } from "@/lib/api/logging.mjs";
import { readJsonObject } from "@/lib/api/request.mjs";
import { jsonError, jsonSuccess } from "@/lib/api/response.mjs";
import { requireUserSession } from "@/lib/auth/userRequestAuth.mjs";
import { getDataProvider } from "@/lib/data/provider.mjs";

export async function GET(req) {
  const authResult = await requireUserSession(req);

  if (!authResult.ok) {
    logAuthFailure({
      route: "/api/user/profile",
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

    return jsonSuccess({ user });
  } catch (error) {
    logProviderFailure({
      route: "/api/user/profile",
      provider: "firebase",
      code: error?.code || API_ERROR_CODES.PROVIDER_FAILURE,
      error,
    });

    return jsonError("Failed to load profile", {
      status: 500,
      code: error?.code || API_ERROR_CODES.PROVIDER_FAILURE,
    });
  }
}

export async function PATCH(req) {
  const authResult = await requireUserSession(req);

  if (!authResult.ok) {
    logAuthFailure({
      route: "/api/user/profile",
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

  const update =
    bodyResult.data.update && typeof bodyResult.data.update === "object"
      ? bodyResult.data.update
      : {};

  try {
    const provider = getDataProvider();
    const user = await provider.users.updateByUjbCode(
      authResult.context.ujbCode,
      update
    );

    return jsonSuccess({ user });
  } catch (error) {
    logProviderFailure({
      route: "/api/user/profile",
      provider: "firebase",
      code: error?.code || API_ERROR_CODES.PROVIDER_FAILURE,
      error,
    });

    return jsonError("Failed to update profile", {
      status: 500,
      code: error?.code || API_ERROR_CODES.PROVIDER_FAILURE,
    });
  }
}


