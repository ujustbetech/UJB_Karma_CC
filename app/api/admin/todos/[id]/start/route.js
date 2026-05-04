import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/adminRequestAuth.mjs";
import { hasAdminAccess } from "@/lib/auth/accessControl";
import {
  adminDb,
  getFirebaseAdminInitError,
} from "@/lib/firebase/firebaseAdmin";
import {
  buildTodoCollection,
  isOpsAdmin,
  serializeTodoRecord,
} from "@/lib/todo/adminTodoServer.mjs";

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

export async function POST(req, { params }) {
  try {
    const dbResult = getDbOrError();
    if (!dbResult.ok) return dbResult.response;

    const authResult = getAdminOrError(req);
    if (!authResult.ok) return authResult.response;

    const { id } = await params;
    const todoRef = buildTodoCollection(dbResult.db).doc(id);
    const todoSnap = await todoRef.get();

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

    if (String(todo.status || "").trim() !== "Pending") {
      return NextResponse.json(
        { message: "Only pending TODOs can be started." },
        { status: 400 }
      );
    }

    const now = new Date();
    await todoRef.set(
      {
        status: "In Progress",
        start_time: now,
        updated_at: now,
      },
      { merge: true }
    );

    const updatedSnap = await todoRef.get();
    return NextResponse.json({
      success: true,
      todo: serializeTodoRecord(updatedSnap.data() || {}, updatedSnap.id),
    });
  } catch (error) {
    return NextResponse.json(
      { message: error?.message || "Failed to start TODO" },
      { status: error?.status || 500 }
    );
  }
}
