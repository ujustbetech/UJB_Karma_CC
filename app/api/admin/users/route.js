import { NextResponse } from "next/server";
import {
  adminAuth,
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
} from "@/lib/admin/adminRoles";

function getServerAccess() {
  const firebaseAdminInitError = getFirebaseAdminInitError();

  if (firebaseAdminInitError || !adminAuth || !adminDb) {
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

  return { ok: true };
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

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function validatePayload(body) {
  const name = String(body?.name || "").trim();
  const email = normalizeEmail(body?.email);
  const role = String(body?.role || "").trim();
  const designation = String(body?.designation || "").trim();

  if (!name) return "Name required";
  if (!email) return "Email required";
  if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email)) {
    return "Valid email required";
  }
  if (!role) return "Select role";
  if (!designation) return "Designation required";

  return null;
}

function buildHistoryEntry({
  type,
  actorEmail = "",
  actorName = "",
  description = "",
  metadata = {},
}) {
  return {
    type: String(type || "").trim() || "updated",
    actorEmail: String(actorEmail || "").trim(),
    actorName: String(actorName || "").trim(),
    description: String(description || "").trim(),
    metadata,
    timestamp: new Date(),
  };
}

function appendHistory(existingHistory, entry) {
  const nextHistory = Array.isArray(existingHistory) ? [...existingHistory] : [];
  nextHistory.push(entry);
  return nextHistory.slice(-25);
}

function generateTemporaryPassword() {
  const random = Math.random().toString(36).slice(2, 10);
  const stamp = Date.now().toString(36).slice(-6);
  return `UJB!${random}${stamp}`;
}

async function getRoleNames() {
  const snapshot = await adminDb.collection(ADMIN_ROLES_COLLECTION).get();
  return snapshot.docs
    .map((docSnap) => String(docSnap.data()?.name || "").trim())
    .filter(Boolean);
}

async function getAdminUsers() {
  const snapshot = await adminDb.collection(ADMIN_USERS_COLLECTION).get();

  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));
}

async function findAdminDocByEmail(email) {
  const snapshot = await adminDb
    .collection(ADMIN_USERS_COLLECTION)
    .where("email", "==", email)
    .limit(1)
    .get();

  return snapshot.empty ? null : snapshot.docs[0];
}

async function ensureFirebaseAdminUser({ email, name, uid = "" }) {
  let authUser = null;

  if (uid) {
    try {
      authUser = await adminAuth.getUser(uid);
    } catch {
      authUser = null;
    }
  }

  if (!authUser) {
    try {
      authUser = await adminAuth.getUserByEmail(email);
    } catch {
      authUser = null;
    }
  }

  if (authUser) {
    if (authUser.displayName !== name || authUser.email !== email) {
      authUser = await adminAuth.updateUser(authUser.uid, {
        displayName: name,
        email,
      });
    }

    return authUser;
  }

  return adminAuth.createUser({
    email,
    displayName: name,
    password: generateTemporaryPassword(),
    emailVerified: false,
  });
}

export async function GET(req) {
  try {
    const serverAccess = getServerAccess();

    if (!serverAccess.ok) {
      return serverAccess.response;
    }

    const authResult = validateAdminRequest(req);

    if (!authResult.ok) {
      return authResult.response;
    }

    const [users, roleNames] = await Promise.all([getAdminUsers(), getRoleNames()]);

    return NextResponse.json({
      users,
      roleNames,
    });
  } catch (error) {
    console.error("Admin users fetch error:", error);

    return NextResponse.json(
      { message: "Failed to load admin users" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const serverAccess = getServerAccess();

    if (!serverAccess.ok) {
      return serverAccess.response;
    }

    const authResult = validateAdminRequest(req);

    if (!authResult.ok) {
      return authResult.response;
    }

    const roleCheck = validateAdminRoleAccess(
      authResult.admin,
      hasSuperAdminAccess,
      "Only Super Admin can manage admin users"
    );
    if (!roleCheck.ok) {
      return NextResponse.json(
        { message: roleCheck.message },
        { status: roleCheck.status }
      );
    }

    const body = await req.json();
    const action = String(body?.action || "invite").trim();

    if (action === "resend_invite") {
      const id = String(body?.id || "").trim();

      if (!id) {
        return NextResponse.json(
          { message: "Missing admin user id" },
          { status: 400 }
        );
      }

      const docRef = adminDb.collection(ADMIN_USERS_COLLECTION).doc(id);
      const docSnap = await docRef.get();

      if (!docSnap.exists) {
        return NextResponse.json(
          { message: "Admin user not found" },
          { status: 404 }
        );
      }

      const current = docSnap.data() || {};
      const email = normalizeEmail(current.email);
      const name = String(current.name || "").trim();

      if (!email || !name) {
        return NextResponse.json(
          { message: "Admin record is missing email or name" },
          { status: 400 }
        );
      }

      const authUser = await ensureFirebaseAdminUser({
        email,
        name,
        uid: current.uid || "",
      });
      const inviteLink = await adminAuth.generatePasswordResetLink(email);

      await docRef.set(
        {
          uid: authUser.uid,
          inviteStatus: "pending",
          inviteLinkGeneratedAt: new Date(),
          invitedBy: authResult.admin.email || "",
          updatedAt: new Date(),
          history: appendHistory(
            current.history,
            buildHistoryEntry({
              type: "invite_resent",
              actorEmail: authResult.admin.email || "",
              actorName: authResult.admin.name || "",
              description: "Invite link regenerated and user marked inactive until setup is completed.",
            })
          ),
        },
        { merge: true }
      );

      return NextResponse.json({
        success: true,
        inviteLink,
        message: "Invite link generated successfully",
      });
    }

    const validationError = validatePayload(body);

    if (validationError) {
      return NextResponse.json(
        { message: validationError },
        { status: 400 }
      );
    }

    const name = String(body.name).trim();
    const email = normalizeEmail(body.email);
    const role = String(body.role).trim();
    const designation = String(body.designation).trim();

    const existingDoc = await findAdminDocByEmail(email);

    if (existingDoc) {
      return NextResponse.json(
        { message: "An admin user with this email already exists" },
        { status: 409 }
      );
    }

    const authUser = await ensureFirebaseAdminUser({ email, name });
    const inviteLink = await adminAuth.generatePasswordResetLink(email);

    const payload = {
      uid: authUser.uid,
      name,
      email,
      role,
      designation,
      photo: authUser.photoURL || null,
      createdAt: new Date(),
      updatedAt: new Date(),
      inviteStatus: "pending",
      inviteLinkGeneratedAt: new Date(),
      invitedBy: authResult.admin.email || "",
      history: [
        buildHistoryEntry({
          type: "created",
          actorEmail: authResult.admin.email || "",
          actorName: authResult.admin.name || "",
          description: "Admin user was created and invited to set a password.",
          metadata: {
            role,
            designation,
          },
        }),
      ],
    };

    const docRef = adminDb.collection(ADMIN_USERS_COLLECTION).doc(authUser.uid);
    await docRef.set(payload);

    return NextResponse.json({
      success: true,
      user: {
        id: docRef.id,
        ...payload,
      },
      inviteLink,
      message: "Admin invited successfully",
    });
  } catch (error) {
    console.error("Admin users create error:", error);

    return NextResponse.json(
      { message: "Failed to invite admin user" },
      { status: 500 }
    );
  }
}

export async function PATCH(req) {
  try {
    const serverAccess = getServerAccess();

    if (!serverAccess.ok) {
      return serverAccess.response;
    }

    const authResult = validateAdminRequest(req);

    if (!authResult.ok) {
      return authResult.response;
    }

    const roleCheck = validateAdminRoleAccess(
      authResult.admin,
      hasSuperAdminAccess,
      "Only Super Admin can manage admin users"
    );
    if (!roleCheck.ok) {
      return NextResponse.json(
        { message: roleCheck.message },
        { status: roleCheck.status }
      );
    }

    const body = await req.json();
    const id = String(body?.id || "").trim();

    if (!id) {
      return NextResponse.json(
        { message: "Missing admin user id" },
        { status: 400 }
      );
    }

    const validationError = validatePayload(body);

    if (validationError) {
      return NextResponse.json(
        { message: validationError },
        { status: 400 }
      );
    }

    const docRef = adminDb.collection(ADMIN_USERS_COLLECTION).doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json(
        { message: "Admin user not found" },
        { status: 404 }
      );
    }

    const current = docSnap.data() || {};
    const name = String(body.name).trim();
    const email = normalizeEmail(body.email);
    const role = String(body.role).trim();
    const designation = String(body.designation).trim();

    const existingDoc = await findAdminDocByEmail(email);

    if (existingDoc && existingDoc.id !== id) {
      return NextResponse.json(
        { message: "Another admin user already uses this email" },
        { status: 409 }
      );
    }

    const authUser = await ensureFirebaseAdminUser({
      email,
      name,
      uid: current.uid || id,
    });

    const payload = {
      uid: authUser.uid,
      name,
      email,
      role,
      designation,
      photo: current.photo || authUser.photoURL || null,
      updatedAt: new Date(),
      history: appendHistory(
        current.history,
        buildHistoryEntry({
          type: "updated",
          actorEmail: authResult.admin.email || "",
          actorName: authResult.admin.name || "",
          description: "Admin user details were updated.",
          metadata: {
            previousName: current.name || "",
            previousEmail: current.email || "",
            previousRole: current.role || "",
            previousDesignation: current.designation || "",
            name,
            email,
            role,
            designation,
          },
        })
      ),
    };

    await docRef.set(payload, { merge: true });

    return NextResponse.json({
      success: true,
      user: {
        id,
        ...current,
        ...payload,
      },
    });
  } catch (error) {
    console.error("Admin users update error:", error);

    return NextResponse.json(
      { message: "Failed to update admin user" },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  try {
    const serverAccess = getServerAccess();

    if (!serverAccess.ok) {
      return serverAccess.response;
    }

    const authResult = validateAdminRequest(req);

    if (!authResult.ok) {
      return authResult.response;
    }

    const roleCheck = validateAdminRoleAccess(
      authResult.admin,
      hasSuperAdminAccess,
      "Only Super Admin can manage admin users"
    );
    if (!roleCheck.ok) {
      return NextResponse.json(
        { message: roleCheck.message },
        { status: roleCheck.status }
      );
    }

    const id = req.nextUrl.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { message: "Missing admin user id" },
        { status: 400 }
      );
    }

    const docRef = adminDb.collection(ADMIN_USERS_COLLECTION).doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json(
        { message: "Admin user not found" },
        { status: 404 }
      );
    }

    const current = docSnap.data() || {};
    const uid = String(current.uid || id).trim();

    await docRef.delete();

    if (uid) {
      try {
        await adminAuth.deleteUser(uid);
      } catch (error) {
        if (error?.code !== "auth/user-not-found") {
          throw error;
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin users delete error:", error);

    return NextResponse.json(
      { message: "Failed to delete admin user" },
      { status: 500 }
    );
  }
}
