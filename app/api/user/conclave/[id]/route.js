import { API_ERROR_CODES } from "@/lib/api/contracts.mjs";
import { logAuthFailure, logProviderFailure } from "@/lib/api/logging.mjs";
import { jsonError, jsonSuccess } from "@/lib/api/response.mjs";
import { requireUserSession } from "@/lib/auth/userRequestAuth.mjs";
import { getDataProvider } from "@/lib/data/provider.mjs";
import { adminDb } from "@/lib/firebase/firebaseAdmin";
import { publicEnv } from "@/lib/config/publicEnv";

async function getLeaderName(phone) {
  const value = String(phone || "").trim();
  if (!value) return "User";

  const snap = await adminDb
    .collection(publicEnv.collections.userDetail)
    .where("MobileNo", "==", value)
    .limit(1)
    .get();

  if (snap.empty) {
    return "User";
  }

  return String(snap.docs[0].data()?.Name || "").trim() || "User";
}

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function includesMember(values = [], probes = []) {
  const set = new Set((Array.isArray(values) ? values : []).map(normalize).filter(Boolean));
  return probes.some((probe) => set.has(normalize(probe)));
}

export async function GET(req, { params }) {
  const authResult = await requireUserSession(req);

  if (!authResult.ok) {
    logAuthFailure({
      route: "/api/user/conclave/[id]",
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

    if (!conclaveId) {
      return jsonError("Missing conclave id", {
        status: 400,
        code: API_ERROR_CODES.INVALID_INPUT,
      });
    }

    const provider = getDataProvider();
    const [conclave, meetings] = await Promise.all([
      provider.conclaves.getById(conclaveId),
      provider.conclaves.listMeetings(conclaveId),
    ]);

    if (!conclave) {
      return jsonError("Conclave not found", {
        status: 404,
        code: API_ERROR_CODES.NOT_FOUND,
      });
    }

    const [leaderName, currentUserName] = await Promise.all([
      getLeaderName(conclave.leader),
      getLeaderName(authResult.context.phone),
    ]);
    const currentPhone = String(authResult.context.phone || "").trim();
    const probes = [currentPhone, currentUserName];
    const isMember =
      normalize(conclave?.leader) === normalize(currentPhone) ||
      includesMember(conclave?.orbiters, probes) ||
      includesMember(conclave?.ntMembers, probes);

    if (!isMember) {
      return jsonError("You do not have access to this conclave", {
        status: 403,
        code: API_ERROR_CODES.FORBIDDEN,
      });
    }

    return jsonSuccess({
      conclave: {
        ...conclave,
        leaderName,
      },
      meetings,
    });
  } catch (error) {
    logProviderFailure({
      route: "/api/user/conclave/[id]",
      provider: "firebase",
      code: error?.code || API_ERROR_CODES.PROVIDER_FAILURE,
      error,
    });

    return jsonError("Failed to load conclave details", {
      status: 500,
      code: error?.code || API_ERROR_CODES.PROVIDER_FAILURE,
    });
  }
}


