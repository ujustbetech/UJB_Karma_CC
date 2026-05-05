import { API_ERROR_CODES } from "@/lib/api/contracts.mjs";
import { logAuthFailure, logProviderFailure } from "@/lib/api/logging.mjs";
import { jsonError, jsonSuccess } from "@/lib/api/response.mjs";
import { requireUserSession } from "@/lib/auth/userRequestAuth.mjs";
import { adminDb } from "@/lib/firebase/firebaseAdmin";

function serializeValue(value) {
  if (!value) return value;
  if (typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (Array.isArray(value)) {
    return value.map((item) => serializeValue(item));
  }
  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, serializeValue(entry)])
    );
  }
  return value;
}

function getTimeMs(value) {
  if (!value) return 0;
  if (value instanceof Date) return value.getTime();
  if (typeof value?.toDate === "function") return value.toDate().getTime();
  if (typeof value?.seconds === "number") return value.seconds * 1000;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
}

function isFeaturedContent(item) {
  return String(item?.contentType || "").trim().toLowerCase() === "featured";
}

export async function GET(req) {
  const authResult = await requireUserSession(req);

  if (!authResult.ok) {
    logAuthFailure({
      route: "/api/user/dewdrop",
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
      .collection("ContentData")
      .where("switchValue", "==", true)
      .orderBy("AdminCreatedby", "desc")
      .get();

    const contents = snapshot.docs
      .map((docSnap) => ({
        id: docSnap.id,
        ...serializeValue(docSnap.data()),
      }))
      .filter((item) => String(item.status || "").toLowerCase() === "published")
      .sort((left, right) => {
        const leftFeatured = isFeaturedContent(left);
        const rightFeatured = isFeaturedContent(right);
        if (leftFeatured !== rightFeatured) {
          return leftFeatured ? -1 : 1;
        }
        return getTimeMs(right.AdminCreatedby) - getTimeMs(left.AdminCreatedby);
      });

    return jsonSuccess({ contents });
  } catch (error) {
    logProviderFailure({
      route: "/api/user/dewdrop",
      provider: "firebase",
      code: error?.code || API_ERROR_CODES.PROVIDER_FAILURE,
      error,
    });

    return jsonError("Failed to load content", {
      status: 500,
      code: error?.code || API_ERROR_CODES.PROVIDER_FAILURE,
    });
  }
}


