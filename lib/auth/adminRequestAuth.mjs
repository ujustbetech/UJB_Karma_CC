import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE_NAME,
  verifyAdminSessionToken,
} from "@/lib/auth/adminSession";
import { validateAdminSessionAccess } from "@/lib/auth/adminAccessWorkflow.mjs";

export function validateAdminRequest(req, hasAdminAccess) {
  const token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;

  if (!token) {
    return {
      ok: false,
      response: NextResponse.json({ message: "Unauthorized" }, { status: 401 }),
    };
  }

  try {
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
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ message: "Unauthorized" }, { status: 401 }),
    };
  }
}
