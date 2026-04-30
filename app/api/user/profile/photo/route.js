import { randomUUID } from "crypto";
import { API_ERROR_CODES } from "@/lib/api/contracts.mjs";
import { logAuthFailure, logProviderFailure } from "@/lib/api/logging.mjs";
import { jsonError, jsonSuccess } from "@/lib/api/response.mjs";
import { requireUserSession } from "@/lib/auth/userRequestAuth.mjs";
import {
  getAdminStorageBucket,
  getFirebaseAdminInitError,
} from "@/lib/firebase/firebaseAdmin";
import { getDataProvider } from "@/lib/data/provider.mjs";

const MAX_PROFILE_PHOTO_SIZE_BYTES = 10 * 1024 * 1024;

function sanitizeFilename(name) {
  const trimmed = String(name || "").trim();
  const normalized = trimmed
    .replace(/[^\w.\- ]+/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

  return normalized || "profile-photo";
}

function buildDownloadUrl(bucketName, objectPath, token) {
  return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(
    objectPath
  )}?alt=media&token=${token}`;
}

export async function POST(req) {
  const authResult = await requireUserSession(req);

  if (!authResult.ok) {
    logAuthFailure({
      route: "/api/user/profile/photo",
      status: authResult.status,
      code: authResult.code,
      reason: authResult.reason,
    });

    return jsonError(authResult.message, {
      status: authResult.status,
      code: authResult.code,
    });
  }

  const adminStorageBucket = getAdminStorageBucket();

  if (getFirebaseAdminInitError() || !adminStorageBucket) {
    return jsonError("Profile photo upload is not configured.", {
      status: 500,
      code: API_ERROR_CODES.PROVIDER_UNAVAILABLE,
    });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File) || file.size <= 0) {
      return jsonError("Profile photo file is required.", {
        status: 400,
        code: API_ERROR_CODES.INVALID_INPUT,
      });
    }

    if (!String(file.type || "").startsWith("image/")) {
      return jsonError("Only image uploads are allowed.", {
        status: 400,
        code: API_ERROR_CODES.INVALID_INPUT,
      });
    }

    if (file.size > MAX_PROFILE_PHOTO_SIZE_BYTES) {
      return jsonError("Profile photo must be 10MB or smaller.", {
        status: 400,
        code: API_ERROR_CODES.INVALID_INPUT,
      });
    }

    const ujbCode = String(authResult.context?.ujbCode || "").trim();

    if (!ujbCode) {
      return jsonError("Missing user session.", {
        status: 401,
        code: API_ERROR_CODES.AUTH_REQUIRED,
      });
    }

    const safeFilename = sanitizeFilename(file.name);
    const objectPath = `userProfile/${ujbCode}/profilePhoto/${Date.now()}-${safeFilename}`;
    const token = randomUUID();
    const bucketFile = adminStorageBucket.file(objectPath);
    const buffer = Buffer.from(await file.arrayBuffer());

    await bucketFile.save(buffer, {
      resumable: false,
      contentType: file.type || "application/octet-stream",
      metadata: {
        cacheControl: "public,max-age=3600",
        metadata: {
          firebaseStorageDownloadTokens: token,
        },
      },
    });

    const url = buildDownloadUrl(adminStorageBucket.name, objectPath, token);
    const provider = getDataProvider();
    const user = await provider.users.updateByUjbCode(ujbCode, {
      ProfilePhotoURL: url,
    });

    return jsonSuccess({
      user,
      url,
      path: objectPath,
    });
  } catch (error) {
    logProviderFailure({
      route: "/api/user/profile/photo",
      provider: "firebase",
      code: error?.code || API_ERROR_CODES.PROVIDER_FAILURE,
      error,
    });

    return jsonError("Failed to upload profile photo", {
      status: 500,
      code: error?.code || API_ERROR_CODES.PROVIDER_FAILURE,
    });
  }
}
