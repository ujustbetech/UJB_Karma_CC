import { NextResponse } from "next/server";
import { hasAdminAccess } from "@/lib/auth/accessControl";
import { requireAdminSession } from "@/lib/auth/adminRequestAuth.mjs";
import { getDataProvider } from "@/lib/data/provider.mjs";
import {
  attachAdminReferralFile,
  deleteAdminReferralFile,
  fetchAdminReferralDetail,
  recordAdminReferralCosmoPayment,
  recordAdminReferralUjbPayout,
  saveAdminReferralDealLog,
  updateReferralStatusRecord,
  replaceAdminReferralFollowups,
} from "@/lib/referrals/referralServerWorkflow.mjs";

function requireAdminProvider(req) {
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
    return { ok: true, admin: auth.admin, context: auth.context, provider };
  } catch (error) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          message:
            error?.message || "Admin Firebase access is not configured.",
        },
        { status: 500 }
      ),
    };
  }
}

function getRecipientField(recipient) {
  switch (String(recipient || "").trim()) {
    case "Orbiter":
      return "paidToOrbiter";
    case "OrbiterMentor":
      return "paidToOrbiterMentor";
    case "CosmoMentor":
      return "paidToCosmoMentor";
    default:
      return "";
  }
}

export async function GET(req, { params }) {
  const guard = requireAdminProvider(req);
  if (!guard.ok) {
    return guard.response;
  }

  try {
    const { id } = params;
    const detail = await fetchAdminReferralDetail({
      provider: guard.provider,
      id,
    });

    if (!detail) {
      return NextResponse.json(
        { message: "Referral not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      ...detail,
    });
  } catch (error) {
    return NextResponse.json(
      { message: error?.message || "Failed to load referral" },
      { status: error?.status || 500 }
    );
  }
}

export async function PATCH(req, { params }) {
  const guard = requireAdminProvider(req);
  if (!guard.ok) {
    return guard.response;
  }

  try {
    const { id } = params;
    const body = await req.json();
    const action = String(body?.action || "").trim();
    const referral = await guard.provider.referrals.getById(id);

    if (!referral) {
      return NextResponse.json(
        { message: "Referral not found" },
        { status: 404 }
      );
    }

    let updated = null;

    if (action === "updateStatus") {
      updated = await updateReferralStatusRecord({
        provider: guard.provider,
        referralId: id,
        nextStatus: body?.status,
        rejectReason: body?.rejectReason || "",
      });
    } else if (action === "saveDealLog") {
      updated = await saveAdminReferralDealLog({
        provider: guard.provider,
        referral,
        id,
        distribution: body?.distribution || {},
      });
    } else if (action === "replaceFollowups") {
      updated = await replaceAdminReferralFollowups({
        provider: guard.provider,
        id,
        followups: Array.isArray(body?.followups) ? body.followups : [],
      });
    } else if (action === "attachFile") {
      updated = await attachAdminReferralFile({
        provider: guard.provider,
        referral,
        id,
        type: body?.type || "supporting",
        url: body?.url || "",
        name: body?.name || "",
      });
    } else if (action === "deleteFile") {
      updated = await deleteAdminReferralFile({
        provider: guard.provider,
        referral,
        id,
        url: body?.url || "",
        type: body?.type || "",
      });
    } else if (action === "recordCosmoPayment") {
      updated = await recordAdminReferralCosmoPayment({
        provider: guard.provider,
        referral,
        id,
        entry: body?.entry || {},
      });
    } else if (action === "recordUjbPayout") {
      const recipientField = getRecipientField(body?.recipient);

      if (!recipientField) {
        return NextResponse.json(
          { message: "Invalid payout recipient" },
          { status: 400 }
        );
      }

      updated = await recordAdminReferralUjbPayout({
        provider: guard.provider,
        referral,
        id,
        entry: body?.entry || {},
        recipientField,
      });
    } else {
      return NextResponse.json(
        { message: "Unsupported admin referral action" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      referral: updated,
    });
  } catch (error) {
    return NextResponse.json(
      { message: error?.message || "Failed to update referral" },
      { status: error?.status || 500 }
    );
  }
}
