import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/adminRequestAuth.mjs";
import { hasAdminAccess } from "@/lib/auth/accessControl";
import {
  getAdminStorageBucket,
  getFirebaseAdminInitError,
} from "@/lib/firebase/firebaseAdmin";

const DEFAULT_MAX_UPLOAD_SIZE_BYTES = 25 * 1024 * 1024;
const VIDEO_MAX_UPLOAD_SIZE_BYTES = 200 * 1024 * 1024;

function sanitizeFileName(fileName) {
  return String(fileName || "upload")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "");
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

  const storageBucket = getAdminStorageBucket();
  if (getFirebaseAdminInitError() || !storageBucket) {
    return NextResponse.json(
      { success: false, message: "Content upload is not configured." },
      { status: 500 }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File) || file.size <= 0) {
      return NextResponse.json(
        { success: false, message: "Upload file is required." },
        { status: 400 }
      );
    }

    const isVideo = String(file.type || "").toLowerCase().startsWith("video/");
    const maxUploadSize = isVideo
      ? VIDEO_MAX_UPLOAD_SIZE_BYTES
      : DEFAULT_MAX_UPLOAD_SIZE_BYTES;

    if (file.size > maxUploadSize) {
      const maxLabel = isVideo ? "200MB" : "25MB";
      return NextResponse.json(
        { success: false, message: `Upload file must be ${maxLabel} or smaller.` },
        { status: 400 }
      );
    }

    const token = randomUUID();
    const extension = sanitizeFileName(file.name).split(".").pop() || "bin";
    const objectPath = `content/${Date.now()}-${randomUUID()}.${extension}`;
    const bucketFile = storageBucket.file(objectPath);
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
      data: {
        url: buildDownloadUrl(storageBucket.name, objectPath, token),
        path: objectPath,
        fileName: bucketFile.name.split("/").pop() || file.name,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to upload file." },
      { status: 500 }
    );
  }
}
