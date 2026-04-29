import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/adminRequestAuth.mjs";
import { hasAdminAccess } from "@/lib/auth/accessControl";
import { adminDb } from "@/lib/firebase/firebaseAdmin";
import { getDataProvider } from "@/lib/data/provider.mjs";
import {
  CONTENT_CATEGORY_COLLECTION,
  mapContentCategory,
  mapContentPartner,
} from "@/lib/content/adminContentApiWorkflow.mjs";

function validateAdmin(req) {
  const auth = requireAdminSession(req, hasAdminAccess);
  if (!auth.ok) {
    return {
      ok: false,
      response: NextResponse.json({ message: auth.message }, { status: auth.status }),
    };
  }

  if (!adminDb) {
    return {
      ok: false,
      response: NextResponse.json({ message: "Content API is not configured." }, { status: 500 }),
    };
  }

  try {
    const provider = getDataProvider();
    return { ok: true, provider };
  } catch (error) {
    return {
      ok: false,
      response: NextResponse.json({ message: error?.message || "Content API is not configured." }, { status: 500 }),
    };
  }
}

export async function GET(req) {
  const guard = validateAdmin(req);
  if (!guard.ok) return guard.response;

  try {
    const partnerId = String(req.nextUrl.searchParams.get("partnerId") || "").trim();

    if (partnerId) {
      const partner = await guard.provider.users.getByUjbCode(partnerId);
      if (!partner) {
        return NextResponse.json({ partner: null });
      }

      return NextResponse.json({
        partner: {
          lpProfile: partner.ProfilePhotoURL || "",
          partnerName: partner.Name || "",
          partnerDesignation: partner.Category || "",
        },
      });
    }

    const [contentSnap, allUsers] = await Promise.all([
      adminDb.collection(CONTENT_CATEGORY_COLLECTION).get(),
      guard.provider.users.listAll(),
    ]);

    return NextResponse.json({
      categories: contentSnap.docs.map(mapContentCategory),
      partners: allUsers.map(mapContentPartner),
    });
  } catch (error) {
    return NextResponse.json(
      { message: error?.message || "Failed to load content reference data" },
      { status: 500 }
    );
  }
}


