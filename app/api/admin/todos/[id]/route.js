import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/adminRequestAuth.mjs";
import { hasAdminAccess } from "@/lib/auth/accessControl";
import {
  adminDb,
  getFirebaseAdminInitError,
} from "@/lib/firebase/firebaseAdmin";
import {
  buildTodoCollection,
  buildTodoPayload,
  ensureTodoExists,
  isOpsAdmin,
  resolveLinkedTodoTarget,
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

async function getTodoDoc(db, id) {
  const snap = await buildTodoCollection(db).doc(id).get();

  if (!snap.exists) {
    return null;
  }

  return { id: snap.id, ...snap.data() };
}

function ensureTodoAccess(todo, admin) {
  if (!isOpsAdmin(admin)) {
    return;
  }

  const sessionEmail = String(admin?.email || "").trim().toLowerCase();
  const assignedEmail = String(todo?.assign_to || "").trim().toLowerCase();

  if (!sessionEmail || assignedEmail !== sessionEmail) {
    const error = new Error("Forbidden");
    error.status = 403;
    throw error;
  }
}

export async function GET(req, { params }) {
  try {
    const dbResult = getDbOrError();
    if (!dbResult.ok) return dbResult.response;

    const authResult = getAdminOrError(req);
    if (!authResult.ok) return authResult.response;

    const { id } = await params;
    const todo = await getTodoDoc(dbResult.db, id);

    if (!todo) {
      return NextResponse.json({ message: "TODO not found" }, { status: 404 });
    }

    ensureTodoAccess(todo, authResult.admin);
    return NextResponse.json({ todo: serializeTodoRecord(todo, id) });
  } catch (error) {
    return NextResponse.json(
      { message: error?.message || "Failed to fetch TODO" },
      { status: error?.status || 500 }
    );
  }
}

export async function PATCH(req, { params }) {
  try {
    const dbResult = getDbOrError();
    if (!dbResult.ok) return dbResult.response;

    const authResult = getAdminOrError(req);
    if (!authResult.ok) return authResult.response;

    const { id } = await params;
    const todo = await getTodoDoc(dbResult.db, id);

    if (!todo) {
      return NextResponse.json({ message: "TODO not found" }, { status: 404 });
    }

    ensureTodoAccess(todo, authResult.admin);
    ensureTodoExists(todo);

    const body = await req.json();
    const linkedTarget = await resolveLinkedTodoTarget(dbResult.db, body);
    const payload = buildTodoPayload({
      payload: body,
      linkedTarget,
      admin: authResult.admin,
      existingTodo: todo,
    });

    await buildTodoCollection(dbResult.db).doc(id).set(payload, { merge: true });

    return NextResponse.json({
      success: true,
      todo: {
        ...serializeTodoRecord(
          {
            ...todo,
            ...payload,
          },
          id
        ),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { message: error?.message || "Failed to update TODO" },
      { status: error?.status || 500 }
    );
  }
}
