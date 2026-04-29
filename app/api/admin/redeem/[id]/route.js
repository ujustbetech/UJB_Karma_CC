import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/adminRequestAuth.mjs";
import { hasAdminAccess } from "@/lib/auth/accessControl";
import { adminDb } from "@/lib/firebase/firebaseAdmin";
import {
  buildRedeemDealUpdate,
  CC_REDEMPTION_COLLECTION,
} from "@/lib/redeem/adminRedeemApiWorkflow.mjs";

function validateAdminOrError(req) {
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

  if (!adminDb) {
    return {
      ok: false,
      response: NextResponse.json(
        { message: "Admin redeem API is not configured." },
        { status: 500 }
      ),
    };
  }

  return { ok: true, admin: auth.admin };
}

export async function PATCH(req, { params }) {
  const guard = validateAdminOrError(req);
  if (!guard.ok) {
    return guard.response;
  }

  try {
    const id = String(params?.id || "").trim();
    if (!id) {
      return NextResponse.json({ message: "Missing redeem id" }, { status: 400 });
    }

    const body = await req.json();
    const action = String(body?.action || "").trim();
    const docRef = adminDb.collection(CC_REDEMPTION_COLLECTION).doc(id);

    if (action === "approve") {
      const category = String(body?.category || "").trim();
      if (!category) {
        return NextResponse.json(
          { message: "Category is required for approval" },
          { status: 400 }
        );
      }

      await docRef.update({
        status: "Approved",
        redemptionCategory: category,
        category,
        updatedAt: new Date(),
      });

      return NextResponse.json({ success: true });
    }

    if (action === "reject") {
      await docRef.update({
        status: "Rejected",
        updatedAt: new Date(),
      });

      return NextResponse.json({ success: true });
    }

    if (action === "update") {
      const update = buildRedeemDealUpdate(body?.payload || {});
      await docRef.update(update);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ message: "Invalid action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { message: error?.message || "Failed to update redeem deal" },
      { status: 500 }
    );
  }
}


