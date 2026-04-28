import { NextResponse } from "next/server";
import {
  adminDb,
  getFirebaseAdminInitError,
} from "@/lib/firebase/firebaseAdmin";
import { hasAdminAccess, hasSuperAdminAccess } from "@/lib/auth/accessControl";
import {
  ADMIN_COOKIE_NAME,
  verifyAdminSessionToken,
} from "@/lib/auth/adminSession";
import {
  validateAdminRoleAccess,
  validateAdminSessionAccess,
} from "@/lib/auth/adminAccessWorkflow.mjs";
import {
  ADMIN_ROLES_COLLECTION,
  ADMIN_USERS_COLLECTION,
  normalizeRoleName,
} from "@/lib/admin/adminRoles";

function getAdminDbOrError() {
  const firebaseAdminInitError = getFirebaseAdminInitError();

  if (firebaseAdminInitError || !adminDb) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          message:
            "Admin Firebase access is not configured. Check server Firebase credentials.",
        },
        { status: 500 }
      ),
    };
  }

  return { ok: true, adminDb };
}

function validateAdminRequest(req) {
  const token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;

  if (!token) {
    return {
      ok: false,
      response: NextResponse.json({ message: "Unauthorized" }, { status: 401 }),
    };
  }

  const decoded = verifyAdminSessionToken(token);
  const validation = validateAdminSessionAccess(decoded, hasAdminAccess);

  if (!validation.ok) {
    return {
      ok: false,
      response: NextResponse.json(
        { message: validation.message },
        { status: validation.status }
      ),
    };
  }

  return { ok: true, admin: validation.admin };
}

async function getRolesAndAdmins(db) {
  const [rolesSnapshot, adminsSnapshot] = await Promise.all([
    db.collection(ADMIN_ROLES_COLLECTION).get(),
    db.collection(ADMIN_USERS_COLLECTION).get(),
  ]);

  const roles = rolesSnapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));
  const admins = adminsSnapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));

  return { roles, admins };
}

export async function GET(req) {
  try {
    const dbResult = getAdminDbOrError();
    if (!dbResult.ok) return dbResult.response;

    const authResult = validateAdminRequest(req);
    if (!authResult.ok) return authResult.response;

    const payload = await getRolesAndAdmins(dbResult.adminDb);
    return NextResponse.json(payload);
  } catch (error) {
    console.error("Admin roles fetch error:", error);
    return NextResponse.json(
      { message: "Failed to load roles" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const dbResult = getAdminDbOrError();
    if (!dbResult.ok) return dbResult.response;

    const authResult = validateAdminRequest(req);
    if (!authResult.ok) return authResult.response;

    const roleCheck = validateAdminRoleAccess(
      authResult.admin,
      hasSuperAdminAccess,
      "Only Super Admin can manage roles"
    );
    if (!roleCheck.ok) {
      return NextResponse.json(
        { message: roleCheck.message },
        { status: roleCheck.status }
      );
    }

    const body = await req.json();
    const name = String(body?.name || "").trim();
    const normalizedName = normalizeRoleName(name);

    if (!name) {
      return NextResponse.json({ message: "Role name required" }, { status: 400 });
    }

    const existingSnapshot = await dbResult.adminDb
      .collection(ADMIN_ROLES_COLLECTION)
      .where("normalizedName", "==", normalizedName)
      .limit(1)
      .get();

    if (!existingSnapshot.empty) {
      return NextResponse.json(
        { message: "Role already exists" },
        { status: 409 }
      );
    }

    const createdDoc = await dbResult.adminDb.collection(ADMIN_ROLES_COLLECTION).add({
      name,
      normalizedName,
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      role: { id: createdDoc.id, name, normalizedName },
    });
  } catch (error) {
    console.error("Admin roles create error:", error);
    return NextResponse.json(
      { message: "Failed to create role" },
      { status: 500 }
    );
  }
}

export async function PATCH(req) {
  try {
    const dbResult = getAdminDbOrError();
    if (!dbResult.ok) return dbResult.response;

    const authResult = validateAdminRequest(req);
    if (!authResult.ok) return authResult.response;

    const roleCheck = validateAdminRoleAccess(
      authResult.admin,
      hasSuperAdminAccess,
      "Only Super Admin can manage roles"
    );
    if (!roleCheck.ok) {
      return NextResponse.json(
        { message: roleCheck.message },
        { status: roleCheck.status }
      );
    }

    const body = await req.json();
    const id = String(body?.id || "").trim();
    const name = String(body?.name || "").trim();
    const normalizedName = normalizeRoleName(name);

    if (!id) {
      return NextResponse.json({ message: "Role id required" }, { status: 400 });
    }
    if (!name) {
      return NextResponse.json({ message: "Role name required" }, { status: 400 });
    }

    const roleRef = dbResult.adminDb.collection(ADMIN_ROLES_COLLECTION).doc(id);
    const roleSnap = await roleRef.get();

    if (!roleSnap.exists) {
      return NextResponse.json({ message: "Role not found" }, { status: 404 });
    }

    const duplicateSnapshot = await dbResult.adminDb
      .collection(ADMIN_ROLES_COLLECTION)
      .where("normalizedName", "==", normalizedName)
      .limit(2)
      .get();

    const hasOtherDuplicate = duplicateSnapshot.docs.some((docSnap) => docSnap.id !== id);
    if (hasOtherDuplicate) {
      return NextResponse.json(
        { message: "Role already exists" },
        { status: 409 }
      );
    }

    await roleRef.set({ name, normalizedName, updatedAt: new Date() }, { merge: true });

    return NextResponse.json({
      success: true,
      role: { id, name, normalizedName },
    });
  } catch (error) {
    console.error("Admin roles update error:", error);
    return NextResponse.json(
      { message: "Failed to update role" },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  try {
    const dbResult = getAdminDbOrError();
    if (!dbResult.ok) return dbResult.response;

    const authResult = validateAdminRequest(req);
    if (!authResult.ok) return authResult.response;

    const roleCheck = validateAdminRoleAccess(
      authResult.admin,
      hasSuperAdminAccess,
      "Only Super Admin can manage roles"
    );
    if (!roleCheck.ok) {
      return NextResponse.json(
        { message: roleCheck.message },
        { status: roleCheck.status }
      );
    }

    const id = String(req.nextUrl.searchParams.get("id") || "").trim();
    if (!id) {
      return NextResponse.json({ message: "Role id required" }, { status: 400 });
    }

    const roleRef = dbResult.adminDb.collection(ADMIN_ROLES_COLLECTION).doc(id);
    const roleSnap = await roleRef.get();

    if (!roleSnap.exists) {
      return NextResponse.json({ message: "Role not found" }, { status: 404 });
    }

    await roleRef.delete();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin roles delete error:", error);
    return NextResponse.json(
      { message: "Failed to delete role" },
      { status: 500 }
    );
  }
}
