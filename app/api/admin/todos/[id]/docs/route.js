import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/adminRequestAuth.mjs";
import { hasAdminAccess } from "@/lib/auth/accessControl";
import {
  adminDb,
  getAdminStorageBucket,
  getFirebaseAdminInitError,
} from "@/lib/firebase/firebaseAdmin";
import {
  buildTodoCollection,
  buildTodoDocCollection,
  isOpsAdmin,
} from "@/lib/todo/adminTodoServer.mjs";

const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;

function getDbOrError() {
  if (getFirebaseAdminInitError() || !adminDb) {
    return {
      ok: false,
      response: NextResponse.json(
        { message: "Admin Firebase access is not configured." },
        { status: 500 }
      ),
    };
  }

  return { ok: true, db: adminDb };
}

function getAdminOrError(req) {
  const auth = requireAdminSession(req, hasAdminAccess);

  if (!auth.ok) {
    return {
      ok: false,
      response: NextResponse.json(
        { message: auth.message },
        { status: auth.status }
      ),
    };
  }

  return { ok: true, admin: auth.admin };
}

function sanitizeFilename(name) {
  return String(name || "upload")
    .replace(/[^\w.\- ]+/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function buildDownloadUrl(bucketName, objectPath, token) {
  return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(
    objectPath
  )}?alt=media&token=${token}`;
}

export async function GET(req, { params }) {
  try {
    const dbResult = getDbOrError();
    if (!dbResult.ok) return dbResult.response;

    const authResult = getAdminOrError(req);
    if (!authResult.ok) return authResult.response;

    const { id } = await params;
    const todoSnap = await buildTodoCollection(dbResult.db).doc(id).get();

    if (!todoSnap.exists) {
      return NextResponse.json({ message: "TODO not found" }, { status: 404 });
    }

    const todo = todoSnap.data() || {};
    if (
      isOpsAdmin(authResult.admin) &&
      String(todo.assign_to || "").trim().toLowerCase() !==
        String(authResult.admin.email || "").trim().toLowerCase()
    ) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const docsSnap = await buildTodoDocCollection(dbResult.db)
      .where("todo_id", "==", id)
      .get();

    const docs = docsSnap.docs
      .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
      .sort((a, b) => new Date(b.uploaded_date || 0).getTime() - new Date(a.uploaded_date || 0).getTime());

    return NextResponse.json({ docs });
  } catch (error) {
    return NextResponse.json(
      { message: error?.message || "Failed to load TODO docs" },
      { status: error?.status || 500 }
    );
  }
}

export async function POST(req, { params }) {
  try {
    const dbResult = getDbOrError();
    if (!dbResult.ok) return dbResult.response;

    const authResult = getAdminOrError(req);
    if (!authResult.ok) return authResult.response;

    const storageBucket = getAdminStorageBucket();
    if (!storageBucket) {
      return NextResponse.json(
        { message: "File upload is not configured." },
        { status: 500 }
      );
    }

    const { id } = await params;
    const todoSnap = await buildTodoCollection(dbResult.db).doc(id).get();

    if (!todoSnap.exists) {
      return NextResponse.json({ message: "TODO not found" }, { status: 404 });
    }

    const todo = todoSnap.data() || {};
    if (
      isOpsAdmin(authResult.admin) &&
      String(todo.assign_to || "").trim().toLowerCase() !==
        String(authResult.admin.email || "").trim().toLowerCase()
    ) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File) || file.size <= 0) {
      return NextResponse.json(
        { message: "Upload file is required." },
        { status: 400 }
      );
    }

    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      return NextResponse.json(
        { message: "Upload file must be 10MB or smaller." },
        { status: 400 }
      );
    }

    const token = randomUUID();
    const safeFilename = sanitizeFilename(file.name);
    const objectPath = `todoDocs/${id}/${Date.now()}-${safeFilename}`;
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

    const uploadedDate = new Date();
    const docsFile = {
      url: buildDownloadUrl(storageBucket.name, objectPath, token),
      path: objectPath,
      fileName: file.name,
      size: file.size,
      type: file.type || "",
    };

    const docRef = await buildTodoDocCollection(dbResult.db).add({
      uuid: randomUUID(),
      todo_id: id,
      docs_file: docsFile,
      uploaded_date: uploadedDate,
    });

    return NextResponse.json({
      success: true,
      doc: {
        id: docRef.id,
        uuid: docRef.id,
        todo_id: id,
        docs_file: docsFile,
        uploaded_date: uploadedDate,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { message: error?.message || "Failed to upload TODO doc" },
      { status: error?.status || 500 }
    );
  }
}
