import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/adminRequestAuth.mjs";
import { hasAdminAccess } from "@/lib/auth/accessControl";
import {
  adminDb,
  getFirebaseAdminInitError,
} from "@/lib/firebase/firebaseAdmin";
import {
  buildTodoCollection,
  buildTodoFilters,
  buildTodoPayload,
  isOpsAdmin,
  resolveLinkedTodoTarget,
  serializeTodoRecord,
  coerceTimestampToDate,
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

export async function GET(req) {
  try {
    const dbResult = getDbOrError();
    if (!dbResult.ok) return dbResult.response;

    const authResult = getAdminOrError(req);
    if (!authResult.ok) return authResult.response;

    const filters = buildTodoFilters({
      query: req.nextUrl.searchParams,
      admin: authResult.admin,
    });

    let snapshot;
    if (filters.isOps) {
      snapshot = await buildTodoCollection(dbResult.db)
        .where("assign_to", "==", String(authResult.admin.email || "").trim().toLowerCase())
        .get();
    } else {
      snapshot = await buildTodoCollection(dbResult.db).get();
    }

    let todos = snapshot.docs.map((docSnap) =>
      serializeTodoRecord(docSnap.data(), docSnap.id)
    );

    if (filters.status) {
      todos = todos.filter((todo) => String(todo.status || "").trim() === filters.status);
    }

    if (filters.purpose) {
      todos = todos.filter((todo) => String(todo.purpose || "").trim() === filters.purpose);
    }

    if (filters.assignTo && !filters.isOps) {
      todos = todos.filter(
        (todo) =>
          String(todo.assign_to || "").trim().toLowerCase() ===
          filters.assignTo.toLowerCase()
      );
    }

    if (filters.userType) {
      todos = todos.filter(
        (todo) =>
          String(todo.user_type || "").trim().toLowerCase() === filters.userType
      );
    }

    if (filters.search) {
      todos = todos.filter((todo) =>
        `${todo.linked_name || ""} ${todo.purpose || ""} ${todo.assign_to_name || ""}`
          .toLowerCase()
          .includes(filters.search)
      );
    }

    todos.sort((a, b) => {
      const aDate = coerceTimestampToDate(a.created_at)?.getTime() || 0;
      const bDate = coerceTimestampToDate(b.created_at)?.getTime() || 0;
      return bDate - aDate;
    });

    return NextResponse.json({ todos });
  } catch (error) {
    console.error("Admin TODO fetch error:", error);
    return NextResponse.json(
      { message: "Failed to fetch TODOs" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const dbResult = getDbOrError();
    if (!dbResult.ok) return dbResult.response;

    const authResult = getAdminOrError(req);
    if (!authResult.ok) return authResult.response;

    const body = await req.json();
    const linkedTarget = await resolveLinkedTodoTarget(dbResult.db, body);
    const payload = buildTodoPayload({
      payload: body,
      linkedTarget,
      admin: authResult.admin,
    });

    const docRef = await buildTodoCollection(dbResult.db).add(payload);

    return NextResponse.json({
      success: true,
      todo: {
        id: docRef.id,
        ...serializeTodoRecord(payload, docRef.id),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { message: error?.message || "Failed to create TODO" },
      { status: error?.status || 500 }
    );
  }
}
