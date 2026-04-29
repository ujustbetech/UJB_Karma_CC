import { API_ERROR_CODES } from "@/lib/api/contracts.mjs";
import { logAuthFailure, logProviderFailure } from "@/lib/api/logging.mjs";
import { jsonError, jsonSuccess } from "@/lib/api/response.mjs";
import { requireUserSession } from "@/lib/auth/userRequestAuth.mjs";
import { getDataProvider } from "@/lib/data/provider.mjs";

export async function GET(req) {
  const authResult = await requireUserSession(req);

  if (!authResult.ok) {
    logAuthFailure({
      route: "/api/user/monthlymeeting",
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
    const events = await provider.meetings.listAll();
    const eventsWithRegistration = await Promise.all(
      events.map(async (event) => {
        const isUserRegistered = await provider.meetings.isUserRegistered(
          event.id,
          authResult.context.phone
        );

        return {
          ...event,
          isUserRegistered,
        };
      })
    );

    return jsonSuccess({ events: eventsWithRegistration });
  } catch (error) {
    logProviderFailure({
      route: "/api/user/monthlymeeting",
      provider: "firebase",
      code: error?.code || API_ERROR_CODES.PROVIDER_FAILURE,
      error,
    });

    return jsonError("Failed to load monthly meetings", {
      status: 500,
      code: error?.code || API_ERROR_CODES.PROVIDER_FAILURE,
    });
  }
}


