import { NextResponse } from "next/server";
import { publicEnv } from "@/lib/config/publicEnv";
import {
  adminDb,
  getFirebaseAdminInitError,
} from "@/lib/firebase/firebaseAdmin";
import { hasAdminAccess } from "@/lib/auth/accessControl";
import { validateAdminRequest } from "@/lib/auth/adminRequestAuth.mjs";
import { createReferralRecord } from "@/lib/referrals/referralServerWorkflow.mjs";

const referralCollectionName = publicEnv.collections.referral;
const userCollectionName = publicEnv.collections.userDetail;

function buildUserSummary(userData) {
  return {
    name: userData?.Name || "",
    email: userData?.Email || "",
    phone: userData?.MobileNo || "",
    ujbCode: userData?.UJBCode || "",
    mentorName: userData?.MentorName || "",
    mentorPhone: userData?.MentorPhone || "",
  };
}

export async function POST(req) {
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
    const body = await req.json();
    const selectedOrbiterId = String(body?.selectedOrbiterId || "").trim();
    const selectedCosmoId = String(body?.selectedCosmoId || "").trim();
    const selectedItem =
      body?.selectedItem && typeof body.selectedItem === "object"
        ? body.selectedItem
        : null;

    if (!selectedOrbiterId || !selectedCosmoId || !selectedItem) {
      return NextResponse.json(
        { message: "Missing referral selection details" },
        { status: 400 }
      );
    }

    const [orbiterSnap, cosmoSnap] = await Promise.all([
      adminDb.collection(userCollectionName).doc(selectedOrbiterId).get(),
      adminDb.collection(userCollectionName).doc(selectedCosmoId).get(),
    ]);

    if (!orbiterSnap.exists || !cosmoSnap.exists) {
      return NextResponse.json(
        { message: "Selected referral users were not found" },
        { status: 404 }
      );
    }

    const orbiterData = orbiterSnap.data();
    const cosmoData = cosmoSnap.data();
    const created = await createReferralRecord({
      adminDb,
      referralCollectionName,
      userCollectionName,
      payload: {
        selectedItem,
        leadDescription: body?.leadDescription || "",
        selectedFor:
          String(body?.refType || "").trim().toLowerCase() === "others"
            ? "someone"
            : "self",
        otherName: body?.otherName || "",
        otherPhone: body?.otherPhone || "",
        otherEmail: body?.otherEmail || "",
        cosmoDetails: buildUserSummary(cosmoData),
        orbiterDetails: buildUserSummary(orbiterData),
        referralSource:
          body?.referralSource === "Other"
            ? body?.otherReferralSource || "Other"
            : body?.referralSource || "Admin",
        dealStatus: body?.dealStatus || undefined,
      },
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
