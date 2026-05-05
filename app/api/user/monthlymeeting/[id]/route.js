import { API_ERROR_CODES } from "@/lib/api/contracts.mjs";
import { logAuthFailure, logProviderFailure } from "@/lib/api/logging.mjs";
import { jsonError, jsonSuccess } from "@/lib/api/response.mjs";
import { requireUserSession } from "@/lib/auth/userRequestAuth.mjs";
import { getDataProvider } from "@/lib/data/provider.mjs";
import { adminDb } from "@/lib/firebase/firebaseAdmin";
import { publicEnv } from "@/lib/config/publicEnv";
import { COLLECTIONS } from "@/lib/utility_collection";
import { normalizeMonthlyMeetingUserTabsConfig } from "@/lib/monthlymeeting/userTabsConfig";

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

function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value?.toDate === "function") return value.toDate();
  if (typeof value?.seconds === "number") return new Date(value.seconds * 1000);
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function isEnrollmentOpen(event) {
  if (typeof event?.enrollmentEnabled === "boolean") return event.enrollmentEnabled;
  const deadline = toDate(event?.enrollmentDeadline);
  if (!deadline) {
    return true;
  }
  return deadline.getTime() >= Date.now();
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
    const monthlyMeetingTabsSettingsSnap = await adminDb
      .collection("appSettings")
      .doc("monthlyMeetingUserTabs")
      .get();
    const isUserRegistered = await provider.meetings.isUserRegistered(
      eventId,
      authResult.context.phone
    );

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

    return jsonSuccess({
      event: {
        ...event,
        isUserRegistered,
        isEnrollmentOpen: isEnrollmentOpen(event),
      },
      users,
      visibleTabsConfig: normalizeMonthlyMeetingUserTabsConfig(
        monthlyMeetingTabsSettingsSnap.data()?.tabs
      ),
    });
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

export async function POST(req, { params }) {
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

    const user = await provider.users.getByUjbCode(authResult.context.ujbCode);
    const phone = String(user?.MobileNo || authResult.context.phone || "").trim();

    if (!phone) {
      return jsonError("User phone number is missing", {
        status: 400,
        code: API_ERROR_CODES.INVALID_INPUT,
      });
    }

    const alreadyRegistered = await provider.meetings.isUserRegistered(eventId, phone);
    if (!alreadyRegistered && !isEnrollmentOpen(event)) {
      return jsonError("Enrollment closed for this meeting", {
        status: 403,
        code: API_ERROR_CODES.FORBIDDEN,
      });
    }

    const registration = await provider.meetings.registerUser(eventId, {
      name: String(user?.Name || "").trim(),
      phone,
      phoneNumber: phone,
      ujbCode: String(user?.UJBCode || authResult.context.ujbCode || "").trim(),
      category: String(user?.Category || "").trim(),
      type: "member",
      interestedIn: {
        knowledgeSharing: false,
        e2a: false,
        oneToOne: false,
        none: true,
      },
      registrationSource: "user",
    });

    const eventRef = adminDb.collection(COLLECTIONS.monthlyMeeting).doc(eventId);
    const eventSnap = await eventRef.get();
    const existingLogs = Array.isArray(eventSnap.data()?.auditLogs)
      ? eventSnap.data().auditLogs
      : [];

    await eventRef.set(
      {
        auditLogs: [
          ...existingLogs,
          {
            id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            section: "Registration",
            field: "registeredUsers",
            before: registration.created ? "No prior registration" : "Existing registration",
            after: `${String(user?.Name || "Unknown").trim()} (${phone})`,
            timestamp: new Date().toISOString(),
            changedBy: {
              name: String(user?.Name || "User").trim(),
              role: "user",
              identity: String(authResult.context.ujbCode || "").trim(),
            },
          },
        ].slice(-100),
        updatedAt: new Date(),
      },
      { merge: true }
    );

    return jsonSuccess({
      registered: true,
      alreadyRegistered: !registration.created,
      registration: registration.record,
    });
  } catch (error) {
    logProviderFailure({
      route: "/api/user/monthlymeeting/[id]",
      provider: "firebase",
      code: error?.code || API_ERROR_CODES.PROVIDER_FAILURE,
      error,
    });

    return jsonError("Failed to register for monthly meeting", {
      status: 500,
      code: error?.code || API_ERROR_CODES.PROVIDER_FAILURE,
    });
  }
}


