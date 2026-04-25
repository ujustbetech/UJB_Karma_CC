import { NextResponse } from "next/server";
import {
  adminDb,
  getFirebaseAdminInitError,
} from "@/lib/firebase/firebaseAdmin";
import { publicEnv } from "@/lib/config/publicEnv";
import { validateUserRequest } from "@/lib/auth/userRequestAuth.mjs";
import { createReferralRecord } from "@/lib/referrals/referralServerWorkflow.mjs";

const referralCollectionName = publicEnv.collections.referral;
const userCollectionName = publicEnv.collections.userDetail;

export async function POST(req) {
  const authResult = await validateUserRequest(
    req,
    adminDb,
    getFirebaseAdminInitError
  );

  if (!authResult.ok) {
    return authResult.response;
  }

  try {
    const body = await req.json();
    const payload = body && typeof body === "object" ? body : {};
    const sessionUjbCode = String(authResult.session?.ujbCode || "").trim();
    const orbiterUjbCode = String(payload?.orbiterDetails?.ujbCode || "").trim();

    if (!sessionUjbCode || sessionUjbCode !== orbiterUjbCode) {
      return NextResponse.json(
        { message: "Unauthorized referral actor" },
        { status: 403 }
      );
    }

    const created = await createReferralRecord({
      adminDb,
      referralCollectionName,
      userCollectionName,
      payload,
    });

    return NextResponse.json({
      success: true,
      referralId: created.referralId,
      id: created.id,
    });
  } catch (error) {
    return NextResponse.json(
      { message: error?.message || "Failed to create referral" },
      { status: error?.status || 500 }
    );
  }
}
