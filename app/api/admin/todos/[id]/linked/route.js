import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/adminRequestAuth.mjs";
import { hasAdminAccess } from "@/lib/auth/accessControl";
import {
  adminDb,
  getFirebaseAdminInitError,
} from "@/lib/firebase/firebaseAdmin";
import { publicEnv } from "@/lib/config/publicEnv";
import {
  buildTodoCollection,
  buildTodoDocCollection,
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

function firstNonEmpty(...values) {
  for (const value of values) {
    if (value == null) continue;
    if (Array.isArray(value)) {
      if (value.length > 0) return value.join(", ");
      continue;
    }
    const normalized = String(value).trim();
    if (normalized) return normalized;
  }
  return "";
}

function mapLinkedProfile(todo, linkedDoc) {
  const type = String(todo?.user_type || "").trim().toLowerCase();
  const isProspect = type === "prospect";

  return {
    type: type || "-",
    code: isProspect
      ? firstNonEmpty(linkedDoc?.id)
      : firstNonEmpty(linkedDoc?.UJBCode, linkedDoc?.ujbCode, linkedDoc?.id),
    name: firstNonEmpty(
      linkedDoc?.prospectName,
      linkedDoc?.name,
      linkedDoc?.Name,
      todo?.linked_name
    ),
    email: firstNonEmpty(linkedDoc?.email, linkedDoc?.Email),
    phone: firstNonEmpty(
      linkedDoc?.prospectPhone,
      linkedDoc?.phone,
      linkedDoc?.Phone,
      linkedDoc?.MobileNo,
      linkedDoc?.["Mobile no"]
    ),
    category: firstNonEmpty(
      linkedDoc?.Category,
      linkedDoc?.category,
      isProspect ? "Prospect" : "Orbitor"
    ),
    preferredCommunication: firstNonEmpty(
      linkedDoc?.PreferredCommunication,
      linkedDoc?.preferredCommunication,
      linkedDoc?.communicationOptions
    ),
  };
}

export async function GET(req, { params }) {
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

    const todo = { id: todoSnap.id, ...todoSnap.data() };
    if (
      isOpsAdmin(authResult.admin) &&
      String(todo.assign_to || "").trim().toLowerCase() !==
        String(authResult.admin.email || "").trim().toLowerCase()
    ) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const isProspect = String(todo.user_type || "").trim().toLowerCase() === "prospect";
    const linkedCollection = isProspect
      ? publicEnv.collections.prospect
      : publicEnv.collections.userDetail;
    const linkedId = isProspect ? String(todo.prospect_id || "").trim() : String(todo.orbitor_id || "").trim();

    let linkedDoc = null;
    if (linkedCollection && linkedId) {
      const linkedSnap = await dbResult.db.collection(linkedCollection).doc(linkedId).get();
      if (linkedSnap.exists) {
        linkedDoc = { id: linkedSnap.id, ...linkedSnap.data() };
      }
    }

    const allTodosSnap = await buildTodoCollection(dbResult.db).get();
    const relatedBase = allTodosSnap.docs
      .map((docSnap) => serializeTodoRecord(docSnap.data(), docSnap.id))
      .filter((entry) => {
        if (entry.id === id) return false;
        if (isProspect) {
          return (
            String(entry.user_type || "").trim().toLowerCase() === "prospect" &&
            String(entry.prospect_id || "").trim() === linkedId
          );
        }

        return (
          String(entry.user_type || "").trim().toLowerCase() === "orbitor" &&
          String(entry.orbitor_id || "").trim() === linkedId
        );
      })
      .sort(
        (left, right) =>
          new Date(right.created_at || 0).getTime() - new Date(left.created_at || 0).getTime()
      )
      .slice(0, 5);

    const related = await Promise.all(
      relatedBase.map(async (entry) => {
        const docsSnap = await buildTodoDocCollection(dbResult.db)
          .where("todo_id", "==", entry.id)
          .get();
        const docs = docsSnap.docs
          .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
          .sort(
            (a, b) =>
              new Date(b.uploaded_date || 0).getTime() - new Date(a.uploaded_date || 0).getTime()
          );

        return {
          ...entry,
          docs,
        };
      })
    );

    return NextResponse.json({
      profile: mapLinkedProfile(todo, linkedDoc),
      recentTodos: related,
    });
  } catch (error) {
    return NextResponse.json(
      { message: error?.message || "Failed to load linked details" },
      { status: error?.status || 500 }
    );
  }
}
