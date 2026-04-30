import { API_ERROR_CODES } from "@/lib/api/contracts.mjs";
import { logAuthFailure, logProviderFailure } from "@/lib/api/logging.mjs";
import { jsonError, jsonSuccess } from "@/lib/api/response.mjs";
import { requireUserSession } from "@/lib/auth/userRequestAuth.mjs";
import { getDataProvider } from "@/lib/data/provider.mjs";
import { adminDb } from "@/lib/firebase/firebaseAdmin";
import { publicEnv } from "@/lib/config/publicEnv";

async function buildLeaderNamesMap(conclaves = []) {
  const phones = [...new Set(
    conclaves.map((item) => String(item?.leader || "").trim()).filter(Boolean)
  )];

  if (!phones.length) {
    return {};
  }

  const entries = await Promise.all(
    phones.map(async (phone) => {
      const snap = await adminDb
        .collection(publicEnv.collections.userDetail)
        .where("MobileNo", "==", phone)
        .limit(1)
        .get();

      const leaderName = !snap.empty
        ? String(snap.docs[0].data()?.Name || "").trim() || "User"
        : "User";

      return [phone, leaderName];
    })
  );

  return Object.fromEntries(entries);
}

export async function GET(req) {
  const authResult = await requireUserSession(req);

  if (!authResult.ok) {
    logAuthFailure({
      route: "/api/user/conclave",
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
    const conclaves = await provider.conclaves.listAll();
    const leaderNames = await buildLeaderNamesMap(conclaves);

    const records = conclaves.map((item) => ({
      ...item,
      orbiterCount: Array.isArray(item.orbiters) ? item.orbiters.length : 0,
      ntMemberCount: Array.isArray(item.ntMembers) ? item.ntMembers.length : 0,
      leaderName: leaderNames[String(item.leader || "").trim()] || "User",
    }));

    return jsonSuccess({ conclaves: records });
  } catch (error) {
    logProviderFailure({
      route: "/api/user/conclave",
      provider: "firebase",
      code: error?.code || API_ERROR_CODES.PROVIDER_FAILURE,
      error,
    });

    return jsonError("Failed to load conclaves", {
      status: 500,
      code: error?.code || API_ERROR_CODES.PROVIDER_FAILURE,
    });
  }
}


