import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/adminRequestAuth.mjs";
import { hasAdminAccess } from "@/lib/auth/accessControl";
import { adminDb } from "@/lib/firebase/firebaseAdmin";
import { COLLECTIONS } from "@/lib/utility_collection";
import {
  buildAdminMeetingCreatePayload,
  mapAdminMeetingListEntry,
} from "@/lib/monthlymeeting/adminMonthlyMeetingApiWorkflow.mjs";

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
      response: NextResponse.json(
        { message: "Admin monthly meeting API is not configured." },
        { status: 500 }
      ),
    };
  }

  return { ok: true };
}

export async function GET(req) {
  const guard = validateAdmin(req);
  if (!guard.ok) {
    return guard.response;
  }

  try {
    const snapshot = await adminDb.collection(COLLECTIONS.monthlyMeeting).get();
    const events = await Promise.all(
      snapshot.docs.map(async (docSnap) => {
        const registeredUsers = await docSnap.ref.collection("registeredUsers").get();
        return mapAdminMeetingListEntry(docSnap, registeredUsers.size);
      })
    );

    events.sort((a, b) => {
      const aTime = new Date(a.time || 0).getTime() || 0;
      const bTime = new Date(b.time || 0).getTime() || 0;
      return bTime - aTime;
    });

    return NextResponse.json({ events });
  } catch (error) {
    return NextResponse.json(
      { message: error?.message || "Failed to fetch monthly meetings" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  const guard = validateAdmin(req);
  if (!guard.ok) {
    return guard.response;
  }

  try {
    const body = await req.json();
    const eventName = String(body?.eventName || "").trim();
    const eventTime = String(body?.eventTime || "").trim();

    if (!eventName || !eventTime) {
      return NextResponse.json(
        { message: "Event name and date/time are required" },
        { status: 400 }
      );
    }

    const eventDate = new Date(eventTime);
    if (Number.isNaN(eventDate.getTime())) {
      return NextResponse.json(
        { message: "Invalid event date/time" },
        { status: 400 }
      );
    }

    const payload = buildAdminMeetingCreatePayload({
      eventName,
      eventTime,
      zoomLink: body?.zoomLink || "",
    });

    const created = await adminDb.collection(COLLECTIONS.monthlyMeeting).add(payload);

    return NextResponse.json({
      success: true,
      id: created.id,
    });
  } catch (error) {
    return NextResponse.json(
      { message: error?.message || "Failed to create monthly meeting" },
      { status: 500 }
    );
  }
}


