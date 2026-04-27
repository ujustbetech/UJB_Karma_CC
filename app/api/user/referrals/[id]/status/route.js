import { NextResponse } from "next/server";
import {
  adminDb,
  getFirebaseAdminInitError,
} from "@/lib/firebase/firebaseAdmin";
import { publicEnv } from "@/lib/config/publicEnv";
import { validateUserRequest } from "@/lib/auth/userRequestAuth.mjs";
import {
  canUserUpdateReferralStatus,
  getReferralParticipantRole,
  updateReferralStatusRecord,
} from "@/lib/referrals/referralServerWorkflow.mjs";

const referralCollectionName = publicEnv.collections.referral;

export async function PATCH(req, { params }) {
  const authResult = await validateUserRequest(
    req,
    adminDb,
    getFirebaseAdminInitError
  );

  if (!authResult.ok) {
    return authResult.response;
  }

  try {
    const { id } = params;
    const body = await req.json();
    const nextStatus = body?.status;
    const rejectReason = body?.rejectReason || "";
    const referralSnap = await adminDb.collection(referralCollectionName).doc(id).get();

    if (!referralSnap.exists) {
      return NextResponse.json({ message: "Referral not found" }, { status: 404 });
    }

    const referral = referralSnap.data();
    const sessionUjbCode = String(authResult.session?.ujbCode || "").trim();
    const actorRole = getReferralParticipantRole({
      referral,
      sessionUjbCode,
    });

    if (!canUserUpdateReferralStatus({ referral, sessionUjbCode })) {
      return NextResponse.json(
        { message: "Only the assigned COSM or Orbiter can update this referral" },
        { status: 403 }
      );
    }

    const updated = await updateReferralStatusRecord({
      adminDb,
      referralCollectionName,
      referralId: id,
      nextStatus,
      rejectReason,
    });

    return NextResponse.json({ success: true, referral: updated, actorRole });
  } catch (error) {
    return NextResponse.json(
      { message: error?.message || "Failed to update referral" },
      { status: error?.status || 500 }
    );
  }
}
