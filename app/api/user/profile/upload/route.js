import { randomUUID } from "crypto";
import { API_ERROR_CODES } from "@/lib/api/contracts.mjs";
import { logAuthFailure, logProviderFailure } from "@/lib/api/logging.mjs";
import { jsonError, jsonSuccess } from "@/lib/api/response.mjs";
import { requireUserSession } from "@/lib/auth/userRequestAuth.mjs";
import {
  getAdminStorageBucket,
  getFirebaseAdminInitError,
} from "@/lib/firebase/firebaseAdmin";

const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_PATH_PREFIXES = [
  "UserAssets/",
  "businessLogos/",
  "productImages/",
  "serviceImages/",
  "userProfile/",
];
const FOLDER_PATH_BUILDERS = Object.freeze({
  achievements: ({ ujbCode, safeFilename }) =>
    `userProfile/${ujbCode}/achievements/${Date.now()}-${safeFilename}`,
  bank: ({ ujbCode, safeFilename }) =>
    `userProfile/${ujbCode}/bank/${Date.now()}-${safeFilename}`,
  businessKYC: ({ ujbCode, safeFilename, keyPrefix }) =>
    `userProfile/${ujbCode}/businessKYC/${keyPrefix}${Date.now()}-${safeFilename}`,
  personalKYC: ({ ujbCode, safeFilename, keyPrefix }) =>
    `userProfile/${ujbCode}/personalKYC/${keyPrefix}${Date.now()}-${safeFilename}`,
  businessLogo: ({ ujbCode, safeFilename }) =>
    `businessLogos/${ujbCode}/${Date.now()}-${safeFilename}`,
  productImage: ({ ujbCode, safeFilename }) =>
    `productImages/${ujbCode}/${Date.now()}-${safeFilename}`,
  serviceImage: ({ ujbCode, safeFilename }) =>
    `serviceImages/${ujbCode}/${Date.now()}-${safeFilename}`,
});

function sanitizePath(value) {
  return String(value || "").replace(/\\/g, "/").trim();
}

function isAllowedPath(path) {
  return ALLOWED_PATH_PREFIXES.some((prefix) => path.startsWith(prefix));
}

function sanitizeFilename(name) {
  const trimmed = String(name || "").trim();
  const normalized = trimmed
    .replace(/[^\w.\- ]+/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

  return normalized || "upload";
}

function sanitizeKeyPrefix(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) {
    return "";
  }

  return `${trimmed.replace(/[^\w-]+/g, "")}-`;
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
      route: "/api/user/profile/upload",
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
    return jsonError("File upload is not configured.", {
      status: 500,
      code: API_ERROR_CODES.PROVIDER_UNAVAILABLE,
    });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const explicitPath = sanitizePath(formData.get("path"));
    const folder = String(formData.get("folder") || "").trim();
    const keyPrefix = sanitizeKeyPrefix(formData.get("key"));
    const buildPath = FOLDER_PATH_BUILDERS[folder];

    if (!(file instanceof File) || file.size <= 0) {
      return jsonError("Upload file is required.", {
        status: 400,
        code: API_ERROR_CODES.INVALID_INPUT,
      });
    }

    if (!explicitPath && !buildPath) {
      return jsonError("Invalid upload folder.", {
        status: 400,
        code: API_ERROR_CODES.INVALID_INPUT,
      });
    }

    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      return jsonError("Upload file must be 10MB or smaller.", {
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
    const objectPath = explicitPath
      ? explicitPath
      : buildPath({
          ujbCode,
          safeFilename,
          keyPrefix,
        });

    if (!objectPath || !isAllowedPath(objectPath)) {
      return jsonError("Invalid upload path.", {
        status: 400,
        code: API_ERROR_CODES.INVALID_INPUT,
      });
    }
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

    return jsonSuccess({
      url: buildDownloadUrl(adminStorageBucket.name, objectPath, token),
      path: objectPath,
      fileName: file.name,
    });
  } catch (error) {
    logProviderFailure({
      route: "/api/user/profile/upload",
      provider: "firebase",
      code: error?.code || API_ERROR_CODES.PROVIDER_FAILURE,
      error,
    });

    return jsonError("Failed to upload file", {
      status: 500,
      code: error?.code || API_ERROR_CODES.PROVIDER_FAILURE,
    });
  }
}
