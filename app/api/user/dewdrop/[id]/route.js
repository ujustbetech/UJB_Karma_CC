import { FieldValue } from "firebase-admin/firestore";
import { API_ERROR_CODES } from "@/lib/api/contracts.mjs";
import { logAuthFailure, logProviderFailure } from "@/lib/api/logging.mjs";
import { readJsonObject } from "@/lib/api/request.mjs";
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

export async function GET(req, { params }) {
  const authResult = await requireUserSession(req);

  if (!authResult.ok) {
    logAuthFailure({
      route: "/api/user/dewdrop/[id]",
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
    const contentId = String((await params)?.id || "").trim();
    if (!contentId) {
      return jsonError("Missing content id", {
        status: 400,
        code: API_ERROR_CODES.INVALID_INPUT,
      });
    }

    const ref = adminDb.collection("ContentData").doc(contentId);
    const snap = await ref.get();

    if (!snap.exists) {
      return jsonError("Content not found", {
        status: 404,
        code: API_ERROR_CODES.NOT_FOUND,
      });
    }

    await ref.set({ totalViews: FieldValue.increment(1) }, { merge: true });
    const updated = await ref.get();

    return jsonSuccess({
      content: {
        id: updated.id,
        ...serializeValue(updated.data()),
      },
    });
  } catch (error) {
    logProviderFailure({
      route: "/api/user/dewdrop/[id]",
      provider: "firebase",
      code: error?.code || API_ERROR_CODES.PROVIDER_FAILURE,
      error,
    });

    return jsonError("Failed to load content details", {
      status: 500,
      code: error?.code || API_ERROR_CODES.PROVIDER_FAILURE,
    });
  }
}

export async function PATCH(req, { params }) {
  const authResult = await requireUserSession(req);

  if (!authResult.ok) {
    logAuthFailure({
      route: "/api/user/dewdrop/[id]",
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
    const contentId = String((await params)?.id || "").trim();
    if (!contentId) {
      return jsonError("Missing content id", {
        status: 400,
        code: API_ERROR_CODES.INVALID_INPUT,
      });
    }

    const action = String(bodyResult.data?.action || "").trim();
    if (action !== "like") {
      return jsonError("Invalid action", {
        status: 422,
        code: API_ERROR_CODES.INVALID_INPUT,
      });
    }

    const ref = adminDb.collection("ContentData").doc(contentId);
    await ref.set({ totallike: FieldValue.increment(1) }, { merge: true });
    const updated = await ref.get();

    return jsonSuccess({
      content: {
        id: updated.id,
        ...serializeValue(updated.data()),
      },
    });
  } catch (error) {
    logProviderFailure({
      route: "/api/user/dewdrop/[id]",
      provider: "firebase",
      code: error?.code || API_ERROR_CODES.PROVIDER_FAILURE,
      error,
    });

    return jsonError("Failed to update content", {
      status: 500,
      code: error?.code || API_ERROR_CODES.PROVIDER_FAILURE,
    });
  }
}


