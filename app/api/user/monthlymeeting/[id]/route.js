import { API_ERROR_CODES } from "@/lib/api/contracts.mjs";
import { logAuthFailure, logProviderFailure } from "@/lib/api/logging.mjs";
import { jsonError, jsonSuccess } from "@/lib/api/response.mjs";
import { requireUserSession } from "@/lib/auth/userRequestAuth.mjs";
import { getDataProvider } from "@/lib/data/provider.mjs";
import { adminDb } from "@/lib/firebase/firebaseAdmin";
import { publicEnv } from "@/lib/config/publicEnv";

function buildUserProfileMap(snapshot) {
  const map = {};

  snapshot.forEach((docSnap) => {
    const data = docSnap.data() || {};
    const phone = String(data.MobileNo || docSnap.id || "").trim();

    if (!phone) {
      return;
    }

    map[phone] = {
      name: data.Name || "Unknown",
      category: data.Category || "",
      ujbCode: data.UJBCode || "",
    };
  });

  return map;
}

export async function GET(req, { params }) {
  const authResult = await requireUserSession(req);

  if (!authResult.ok) {
    logAuthFailure({
      route: "/api/user/monthlymeeting/[id]",
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
    const eventId = String((await params)?.id || "").trim();

    if (!eventId) {
      return jsonError("Missing event id", {
        status: 400,
        code: API_ERROR_CODES.INVALID_INPUT,
      });
    }

    const provider = getDataProvider();
    const event = await provider.meetings.getById(eventId);

    if (!event) {
      return jsonError("Monthly meeting not found", {
        status: 404,
        code: API_ERROR_CODES.NOT_FOUND,
      });
    }

    const [registrations, usersSnapshot] = await Promise.all([
      provider.meetings.listRegisteredUsers(eventId),
      adminDb.collection(publicEnv.collections.userDetail).get(),
    ]);

    const userMap = buildUserProfileMap(usersSnapshot);
    const users = registrations.map((registration) => {
      const phone = String(registration.id || "").trim();
      const profile = userMap[phone] || {};

      return {
        phone,
        name: profile.name || registration.name || "Unknown",
        category: profile.category || "",
        ujbCode: profile.ujbCode || "",
        attendance:
          registration.attendanceStatus === true ? "Present" : "Pending",
        feedback: Array.isArray(registration.feedback)
          ? registration.feedback
          : [],
      };
    });

    return jsonSuccess({ event, users });
  } catch (error) {
    logProviderFailure({
      route: "/api/user/monthlymeeting/[id]",
      provider: "firebase",
      code: error?.code || API_ERROR_CODES.PROVIDER_FAILURE,
      error,
    });

    return jsonError("Failed to load monthly meeting details", {
      status: 500,
      code: error?.code || API_ERROR_CODES.PROVIDER_FAILURE,
    });
  }
}


