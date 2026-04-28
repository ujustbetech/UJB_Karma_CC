import { API_ERROR_CODES } from "@/lib/api/contracts.mjs";
import { logAuthFailure, logProviderFailure } from "@/lib/api/logging.mjs";
import { jsonError, jsonSuccess } from "@/lib/api/response.mjs";
import {
  adminDb,
} from "@/lib/firebase/firebaseAdmin";
import { publicEnv } from "@/lib/config/publicEnv";
import { requireUserSession } from "@/lib/auth/userRequestAuth.mjs";

const userCollectionName = publicEnv.collections.userDetail;

function mapCosmoOrbiter(docSnap) {
  const data = docSnap.data() || {};
  const servicesArr = data.services ? Object.values(data.services) : [];
  const productsArr = data.products ? Object.values(data.products) : [];

  return {
    id: docSnap.id,
    businessName: data.BusinessName || "N/A",
    city: data.City || "",
    locality: data.Locality || "",
    state: data.State || "",
    category1: data.Category1 || "",
    verified: Boolean(data.Verified),
    logo:
      data.BusinessLogo ||
      data["Business Logo"] ||
      data.ProfilePhotoURL ||
      "",
    aiScore:
      servicesArr.length * 2 +
      productsArr.length +
      (data.Verified ? 5 : 0),
  };
}

export async function GET(req) {
  const authResult = await requireUserSession(req);

  if (!authResult.ok) {
    logAuthFailure({
      route: "/api/user/cosmorbiters",
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
    const snapshot = await adminDb
      .collection(userCollectionName)
      .where("Category", "==", "CosmOrbiter")
      .get();

    return jsonSuccess({
      businesses: snapshot.docs.map(mapCosmoOrbiter),
    });
  } catch (error) {
    logProviderFailure({
      route: "/api/user/cosmorbiters",
      provider: "firebase",
      code: error?.code || API_ERROR_CODES.PROVIDER_FAILURE,
      error,
    });

    return jsonError(error?.message || "Failed to fetch CosmOrbiters", {
      status: 500,
      code: error?.code || API_ERROR_CODES.PROVIDER_FAILURE,
    });
  }
}
