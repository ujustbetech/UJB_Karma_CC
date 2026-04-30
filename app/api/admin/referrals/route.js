import { NextResponse } from "next/server";
import { publicEnv } from "@/lib/config/publicEnv";
import { adminDb } from "@/lib/firebase/firebaseAdmin";
import { hasAdminAccess } from "@/lib/auth/accessControl";
import { requireAdminSession } from "@/lib/auth/adminRequestAuth.mjs";
import { getDataProvider } from "@/lib/data/provider.mjs";
import { createReferralRecord } from "@/lib/referrals/referralServerWorkflow.mjs";

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

  try {
    const provider = getDataProvider();
    return { ok: true, provider, admin: auth.admin };
  } catch (error) {
    return {
      ok: false,
      response: NextResponse.json(
        { message: error?.message || "Referral API is not configured." },
        { status: 500 }
      ),
    };
  }
}

export async function GET(req) {
  const guard = validateAdminOrError(req);
  if (!guard.ok) {
    return guard.response;
  }

  try {
    const id = String(req.nextUrl.searchParams.get("id") || "").trim();

    if (id) {
      const referral = await guard.provider.referrals.getById(id);
      if (!referral) {
        return NextResponse.json({ message: "Referral not found" }, { status: 404 });
      }
      return NextResponse.json({
        referral,
      });
    }

    const referrals = await guard.provider.referrals.listAll();

    return NextResponse.json({ referrals });
  } catch (error) {
    return NextResponse.json(
      { message: error?.message || "Failed to fetch referrals" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  const guard = validateAdminOrError(req);
  if (!guard.ok) {
    return guard.response;
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
      guard.provider.users.getByUjbCode(selectedOrbiterId),
      guard.provider.users.getByUjbCode(selectedCosmoId),
    ]);

    if (!orbiterSnap || !cosmoSnap) {
      return NextResponse.json(
        { message: "Selected referral users were not found" },
        { status: 404 }
      );
    }

    const orbiterData = orbiterSnap;
    const cosmoData = cosmoSnap;
    const created = await createReferralRecord({
      adminDb,
      referralCollectionName: publicEnv.collections.referral,
      userCollectionName: publicEnv.collections.userDetail,
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

export async function DELETE(req) {
  const guard = validateAdminOrError(req);
  if (!guard.ok) {
    return guard.response;
  }

  try {
    const id = String(req.nextUrl.searchParams.get("id") || "").trim();
    if (!id) {
      return NextResponse.json({ message: "Missing referral id" }, { status: 400 });
    }

    await guard.provider.referrals.deleteById(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { message: error?.message || "Failed to delete referral" },
      { status: 500 }
    );
  }
}


