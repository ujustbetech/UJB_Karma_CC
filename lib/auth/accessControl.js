export const USER_COOKIE_NAME = "crm_token";
export const ADMIN_COOKIE_NAME = "admin_token";

export function normalizeRole(role) {
  return String(role || "").trim().toLowerCase();
}

export function hasAdminAccess(role) {
  const normalizedRole = normalizeRole(role);

  if (!normalizedRole) {
    return false;
  }

  return normalizedRole === "admin" || normalizedRole.includes("admin");
}
