import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/adminRequestAuth.mjs";
import { hasAdminAccess } from "@/lib/auth/accessControl";
import {
  adminDb,
  getFirebaseAdminInitError,
} from "@/lib/firebase/firebaseAdmin";
import {
  buildTodoCollection,
  coerceTimestampToDate,
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

    if (String(todo.status || "").trim() !== "In Progress") {
      return NextResponse.json(
        { message: "Only in-progress TODOs can be completed." },
        { status: 400 }
      );
    }

    if (!todo.start_time) {
      return NextResponse.json(
        { message: "TODO is missing a start time." },
        { status: 400 }
      );
    }

    const startTime = coerceTimestampToDate(todo.start_time);
    if (!startTime) {
      return NextResponse.json(
        { message: "TODO start time is invalid." },
        { status: 400 }
      );
    }

    const endTime = new Date();
    const diffMinutes = Math.max(
      0,
      Math.round((endTime.getTime() - startTime.getTime()) / 60000)
    );

    await todoRef.set(
      {
        status: "Done",
        completion_date: endTime,
        completion_time: diffMinutes,
        updated_at: endTime,
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
      { message: error?.message || "Failed to complete TODO" },
      { status: error?.status || 500 }
    );
  }
}
