export function findAuthorizedAdmin(adminDocs, email, hasAdminAccess) {
  const normalizedEmail = String(email || "").toLowerCase();

  if (!normalizedEmail) {
    return { ok: false, status: 401, message: "Missing admin email" };
  }

  const adminDoc = adminDocs.find(
    (docSnap) => docSnap.data().email?.toLowerCase() === normalizedEmail
  );

  if (!adminDoc) {
    return { ok: false, status: 403, message: "You are not an Admin" };
  }

  const adminData = adminDoc.data();
  const role = adminData.role || "Admin";

  if (!hasAdminAccess(role)) {
    return {
      ok: false,
      status: 403,
      message: "Admin role is not authorized",
    };
  }

  return { ok: true, adminData, role };
}

export function buildAdminSessionPayload(adminData, decoded) {
  return {
    email: decoded.email?.toLowerCase(),
    name: adminData.name || decoded.name || "",
    role: adminData.role || "Admin",
    designation: adminData.designation || "",
    photo: adminData.photo || decoded.picture || null,
  };
}

export function validateAdminSessionAccess(decoded, hasAdminAccess) {
  if (!decoded) {
    return { ok: false, status: 401, message: "Unauthorized" };
  }

  if (!hasAdminAccess(decoded.role)) {
    return { ok: false, status: 403, message: "Forbidden" };
  }

  return {
    ok: true,
    admin: {
      email: decoded.email,
      name: decoded.name,
      role: decoded.role,
      designation: decoded.designation || "",
      photo: decoded.photo || null,
    },
  };
}
