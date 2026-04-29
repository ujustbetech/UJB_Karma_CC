import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/adminRequestAuth.mjs";
import { hasAdminAccess } from "@/lib/auth/accessControl";
import { getDataProvider } from "@/lib/data/provider.mjs";
import { adminDb } from "@/lib/firebase/firebaseAdmin";
import {
  buildApprovedRedeemDealPayload,
  CC_REDEMPTION_COLLECTION,
  mapRedeemAdminUser,
  normalizeRedeemDealDoc,
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

  try {
    const provider = getDataProvider();
    return { ok: true, provider, admin: auth.admin };
  } catch (error) {
    return {
      ok: false,
      response: NextResponse.json(
        { message: error?.message || "Admin redeem API is not configured." },
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
    const view = String(req.nextUrl.searchParams.get("view") || "").trim();

    if (view === "users") {
      const users = await guard.provider.users.listAll();
      return NextResponse.json({
        users: users.map(mapRedeemAdminUser),
      });
    }

    const snapshot = await adminDb
      .collection(CC_REDEMPTION_COLLECTION)
      .orderBy("createdAt", "desc")
      .get();

    return NextResponse.json({
      deals: snapshot.docs.map(normalizeRedeemDealDoc),
    });
  } catch (error) {
    return NextResponse.json(
      { message: error?.message || "Failed to fetch redeem data" },
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
    const user =
      body?.user && typeof body.user === "object" ? body.user : null;
    const category = String(body?.category || "").trim();
    const mode = String(body?.mode || "").trim();
    const minPoints = body?.minPoints;
    const maxPoints = body?.maxPoints;

    if (!user?.ujbCode || !category || !mode) {
      return NextResponse.json(
        { message: "Missing required redeem deal fields" },
        { status: 400 }
      );
    }

    const payload = buildApprovedRedeemDealPayload({
      user,
      category,
      mode,
      selectedItem: body?.selectedItem || null,
      multipleItems: Array.isArray(body?.multipleItems) ? body.multipleItems : [],
      originalPercent: body?.originalPercent,
      enhanceRequired: body?.enhanceRequired,
      enhancedPercent: body?.enhancedPercent,
      finalPercent: body?.finalPercent,
      minPoints,
      maxPoints,
    });

    const created = await adminDb.collection(CC_REDEMPTION_COLLECTION).add(payload);

    return NextResponse.json({
      success: true,
      id: created.id,
    });
  } catch (error) {
    return NextResponse.json(
      { message: error?.message || "Failed to create redeem deal" },
      { status: 500 }
    );
  }
}
