import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/adminRequestAuth.mjs";
import { hasAdminAccess } from "@/lib/auth/accessControl";
import { adminDb } from "@/lib/firebase/firebaseAdmin";
import { COLLECTIONS } from "@/lib/utility_collection";
import { serializeFirestoreValue } from "@/lib/data/firebase/documentRepository.mjs";

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
        { message: "Admin conclave API is not configured." },
        { status: 500 }
      ),
    };
  }

  return { ok: true };
}

export async function GET(req, context) {
  const guard = validateAdmin(req);
  if (!guard.ok) {
    return guard.response;
  }

  try {
    const params = await context.params;
    const conclaveId = String(params?.id || "").trim();
    const meetingId = String(params?.meetingId || "").trim();
    if (!conclaveId || !meetingId) throw new Error("Missing IDs");

    const [registeredSnap, userSnap] = await Promise.all([
      adminDb
        .collection(COLLECTIONS.conclaves)
        .doc(conclaveId)
        .collection("meetings")
        .doc(meetingId)
        .collection("registeredUsers")
        .orderBy("registeredAt", "desc")
        .get(),
      adminDb.collection(COLLECTIONS.userDetail).get(),
    ]);

    const userMap = new Map();
    userSnap.docs.forEach((docSnap) => {
      const data = serializeFirestoreValue(docSnap.data() || {});
      const phone = String(data.MobileNo || docSnap.id || "").trim();
      if (!phone) {
        return;
      }

      userMap.set(phone, {
        name: data.Name || `Unknown (${phone})`,
        category: data.Category || "Unknown",
      });
    });

    const users = registeredSnap.docs
      .map((docSnap) => {
        const data = serializeFirestoreValue(docSnap.data() || {});
        const phone = docSnap.id;
        const profile = userMap.get(phone) || {};

        return {
          id: phone,
          phoneNumber: phone,
          name: profile.name || `Unknown (${phone})`,
          category: profile.category || "Unknown",
          response: data.response || "",
          attendanceStatus: data.attendanceStatus === true,
        };
      })
      .filter((user) => user.response);

    return NextResponse.json({ users });
  } catch (error) {
    return NextResponse.json(
      { message: error?.message || "Failed to load registered users" },
      { status: 500 }
    );
  }
}


