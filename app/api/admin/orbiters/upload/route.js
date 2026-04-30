import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/adminRequestAuth.mjs";
import { hasAdminAccess } from "@/lib/auth/accessControl";
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
];

function sanitizePath(value) {
  return String(value || "").replace(/\\/g, "/").trim();
}

function isAllowedPath(path) {
  return ALLOWED_PATH_PREFIXES.some((prefix) => path.startsWith(prefix));
}

function buildDownloadUrl(bucketName, objectPath, token) {
  return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(
    objectPath
  )}?alt=media&token=${token}`;
}

export async function POST(req) {
  const auth = requireAdminSession(req, hasAdminAccess);

  if (!auth.ok) {
    return NextResponse.json(
      { success: false, message: auth.message },
      { status: auth.status }
    );
  }

  const adminStorageBucket = getAdminStorageBucket();

  if (getFirebaseAdminInitError() || !adminStorageBucket) {
    return NextResponse.json(
      {
        success: false,
        message: "Admin upload is not configured.",
      },
      { status: 500 }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const path = sanitizePath(formData.get("path"));

    if (!(file instanceof File) || file.size <= 0) {
      return NextResponse.json(
        { success: false, message: "Upload file is required." },
        { status: 400 }
      );
    }

    if (!path || !isAllowedPath(path)) {
      return NextResponse.json(
        { success: false, message: "Invalid upload path." },
        { status: 400 }
      );
    }

    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      return NextResponse.json(
        { success: false, message: "Upload file must be 10MB or smaller." },
        { status: 400 }
      );
    }

    const token = randomUUID();
    const bucketFile = adminStorageBucket.file(path);
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

    return NextResponse.json({
      success: true,
      url: buildDownloadUrl(adminStorageBucket.name, path, token),
      path,
      fileName: path.split("/").pop() || file.name,
    });
  } catch (error) {
    console.error("Admin orbiter upload error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to upload file",
      },
      { status: 500 }
    );
  }
}
