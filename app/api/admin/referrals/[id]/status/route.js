import { NextResponse } from "next/server";
import { publicEnv } from "@/lib/config/publicEnv";
import {
  adminDb,
  getFirebaseAdminInitError,
} from "@/lib/firebase/firebaseAdmin";
import { hasAdminAccess } from "@/lib/auth/accessControl";
import { validateAdminRequest } from "@/lib/auth/adminRequestAuth.mjs";
import { updateReferralStatusRecord } from "@/lib/referrals/referralServerWorkflow.mjs";

const referralCollectionName = publicEnv.collections.referral;

export async function PATCH(req, { params }) {
  const adminResult = validateAdminRequest(req, hasAdminAccess);

  if (!adminResult.ok) {
    return adminResult.response;
  }

  if (getFirebaseAdminInitError() || !adminDb) {
    return NextResponse.json(
      { message: "Referral API is not configured." },
      { status: 500 }
    );
  }

  try {
    const resolvedParams = await params;
    const id = String(resolvedParams?.id || "").trim();

    if (!id) {
      return NextResponse.json(
        { message: "Missing referral id" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const updated = await updateReferralStatusRecord({
      adminDb,
      referralCollectionName,
      referralId: id,
      nextStatus: body?.status,
      rejectReason: body?.rejectReason || "",
    });

    return NextResponse.json({ success: true, referral: updated });
  } catch (error) {
    return NextResponse.json(
      { message: error?.message || "Failed to update referral" },
      { status: error?.status || 500 }
    );
  }
}


