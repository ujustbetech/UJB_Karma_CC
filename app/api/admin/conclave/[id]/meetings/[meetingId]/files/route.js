import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/adminRequestAuth.mjs";
import { hasAdminAccess } from "@/lib/auth/accessControl";
import {
  getAdminStorageBucket,
  getFirebaseAdminInitError,
} from "@/lib/firebase/firebaseAdmin";

const MAX_UPLOAD_SIZE_BYTES = 25 * 1024 * 1024;
const ALLOWED_MODULES = new Set(["knowledgeDocs", "documents"]);

function sanitizeSegment(value) {
  return String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9._/-]/g, "_")
    .replace(/\\/g, "/")
    .replace(/\/+/g, "/")
    .replace(/^\/|\/$/g, "");
}

function sanitizeFileName(name) {
  return String(name || "file")
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, "_");
}

function buildDownloadUrl(bucketName, objectPath, token) {
  return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(
    objectPath
  )}?alt=media&token=${token}`;
}

export async function POST(req, context) {
  const auth = requireAdminSession(req, hasAdminAccess);
  if (!auth.ok) {
    return NextResponse.json({ success: false, message: auth.message }, { status: auth.status });
  }

  const storageBucket = getAdminStorageBucket();
  if (getFirebaseAdminInitError() || !storageBucket) {
    return NextResponse.json(
      { success: false, message: "Conclave upload is not configured." },
      { status: 500 }
    );
  }

  try {
    const params = await context.params;
    const conclaveId = sanitizeSegment(params?.id);
    const meetingId = sanitizeSegment(params?.meetingId);
    const formData = await req.formData();
    const file = formData.get("file");
    const moduleName = sanitizeSegment(formData.get("module"));

    if (!conclaveId || !meetingId) {
      return NextResponse.json({ success: false, message: "Missing conclave or meeting id." }, { status: 400 });
    }
    if (!(file instanceof File) || file.size <= 0) {
      return NextResponse.json({ success: false, message: "Upload file is required." }, { status: 400 });
    }
    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      return NextResponse.json(
        { success: false, message: "Upload file must be 25MB or smaller." },
        { status: 400 }
      );
    }
    if (!ALLOWED_MODULES.has(moduleName)) {
      return NextResponse.json({ success: false, message: "Invalid module." }, { status: 400 });
    }

    const fileName = sanitizeFileName(file.name);
    const nonce = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const objectPath = `conclaves/${conclaveId}/meetings/${meetingId}/${moduleName}/${nonce}_${fileName}`;
    const token = randomUUID();
    const buffer = Buffer.from(await file.arrayBuffer());
    const bucketFile = storageBucket.file(objectPath);

    await bucketFile.save(buffer, {
      resumable: false,
      contentType: file.type || "application/octet-stream",
      metadata: {
        cacheControl: "public,max-age=3600",
        metadata: {
          firebaseStorageDownloadTokens: token,
          conclaveId,
          meetingId,
          module: moduleName,
        },
      },
    });

    return NextResponse.json({
      success: true,
      url: buildDownloadUrl(storageBucket.name, objectPath, token),
      path: objectPath,
      fileName,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to upload file." },
      { status: 500 }
    );
  }
}

export async function DELETE(req, context) {
  const auth = requireAdminSession(req, hasAdminAccess);
  if (!auth.ok) {
    return NextResponse.json({ success: false, message: auth.message }, { status: auth.status });
  }

  const storageBucket = getAdminStorageBucket();
  if (getFirebaseAdminInitError() || !storageBucket) {
    return NextResponse.json(
      { success: false, message: "Conclave upload is not configured." },
      { status: 500 }
    );
  }

  try {
    const params = await context.params;
    const conclaveId = sanitizeSegment(params?.id);
    const meetingId = sanitizeSegment(params?.meetingId);
    const { path = "", module: rawModule = "" } = await req.json().catch(() => ({}));
    const moduleName = sanitizeSegment(rawModule);
    const objectPath = sanitizeSegment(path);

    if (!conclaveId || !meetingId || !objectPath || !moduleName) {
      return NextResponse.json({ success: false, message: "Missing delete payload." }, { status: 400 });
    }
    if (!ALLOWED_MODULES.has(moduleName)) {
      return NextResponse.json({ success: false, message: "Invalid module." }, { status: 400 });
    }

    const requiredPrefix = `conclaves/${conclaveId}/meetings/${meetingId}/${moduleName}/`;
    if (!objectPath.startsWith(requiredPrefix)) {
      return NextResponse.json({ success: false, message: "Invalid object path." }, { status: 400 });
    }

    await storageBucket.file(objectPath).delete({ ignoreNotFound: true });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to delete file." },
      { status: 500 }
    );
  }
}
