import { NextResponse } from "next/server";
import {
  adminDb,
  getFirebaseAdminInitError,
} from "@/lib/firebase/firebaseAdmin";
import {
  ADMIN_COOKIE_NAME,
  verifyAdminSessionToken,
} from "@/lib/auth/adminSession";
import { hasAdminAccess } from "@/lib/auth/accessControl";
import { validateAdminSessionAccess } from "@/lib/auth/adminAccessWorkflow.mjs";
import { publicEnv } from "@/lib/config/publicEnv";
import { serverEnv } from "@/lib/config/serverEnv";

const userCollectionName = publicEnv.collections.userDetail;
const UJB_SEED_START = 10122000000001;

function validateProjectAlignment() {
  const clientProjectId = publicEnv.firebase.projectId;
  const adminProjectId = serverEnv.firebaseAdmin.projectId;

  if (!clientProjectId || !adminProjectId) {
    return {
      ok: false,
      response: NextResponse.json(
        { message: "Missing Firebase project configuration" },
        { status: 500 }
      ),
    };
  }

  if (clientProjectId !== adminProjectId) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          message: `Firebase project mismatch: client uses "${clientProjectId}" but admin uses "${adminProjectId}". Update FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY for the "${clientProjectId}" service account.`,
        },
        { status: 409 }
      ),
    };
  }

  return { ok: true };
}

function extractUjbSequence(value) {
  const normalized = String(value || "").trim().toUpperCase();
  const match = normalized.match(/^UJB0*([1-9]\d*)$/) || normalized.match(/^UJB(0+)$/);

  if (!match) {
    return null;
  }

  if (match[1]) {
    return parseInt(match[1], 10);
  }

  return 0;
}

function getAdminDbOrError() {
  const firebaseAdminInitError = getFirebaseAdminInitError();

  if (firebaseAdminInitError || !adminDb) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          message:
            "Admin Firebase access is not configured. Check server Firebase credentials.",
        },
        { status: 500 }
      ),
    };
  }

  return { ok: true, adminDb };
}

function validateAdminRequest(req) {
  const token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;

  if (!token) {
    return {
      ok: false,
      response: NextResponse.json({ message: "Unauthorized" }, { status: 401 }),
    };
  }

  const decoded = verifyAdminSessionToken(token);
  const validation = validateAdminSessionAccess(decoded, hasAdminAccess);

  if (!validation.ok) {
    return {
      ok: false,
      response: NextResponse.json(
        { message: validation.message },
        { status: validation.status }
      ),
    };
  }

  return { ok: true, admin: validation.admin };
}

async function buildOrbiterPayloads(db) {
  const snapshot = await db.collection(userCollectionName).get();

  const orbiters = snapshot.docs.map((docSnap) => ({
    ujbCode: docSnap.id,
    name: docSnap.data().Name || "",
    phone: docSnap.data().MobileNo || "",
    email: docSnap.data().Email || "",
  }));

  let maxNumber = 0;

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const code = data.UJBCode || data.ujbCode || docSnap.id;
    const num = extractUjbSequence(code);

    if (num !== null && num > maxNumber) {
      maxNumber = num;
    }
  });

  const nextNumber =
    maxNumber > 0 ? Math.max(maxNumber + 1, UJB_SEED_START) : UJB_SEED_START;
  const nextUjbCode = `UJB${String(nextNumber)}`;

  return { orbiters, nextUjbCode };
}

async function buildFullUserPayload(db) {
  const snapshot = await db.collection(userCollectionName).get();

  const users = snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));

  return { users };
}

export async function GET(req) {
  try {
    const alignmentResult = validateProjectAlignment();

    if (!alignmentResult.ok) {
      return alignmentResult.response;
    }

    const dbResult = getAdminDbOrError();

    if (!dbResult.ok) {
      return dbResult.response;
    }

    const authResult = validateAdminRequest(req);

    if (!authResult.ok) {
      return authResult.response;
    }

    const ujbCode = req.nextUrl.searchParams.get("ujbCode");
    const view = req.nextUrl.searchParams.get("view");

    if (ujbCode) {
      const docSnap = await dbResult.adminDb
        .collection(userCollectionName)
        .doc(ujbCode)
        .get();

      if (!docSnap.exists) {
        return NextResponse.json(
          { message: "Orbiter not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        user: {
          id: docSnap.id,
          ...docSnap.data(),
        },
      });
    }

    const payload =
      view === "full"
        ? await buildFullUserPayload(dbResult.adminDb)
        : await buildOrbiterPayloads(dbResult.adminDb);

    return NextResponse.json(payload);
  } catch (error) {
    console.error("Admin orbiter fetch error:", error);

    return NextResponse.json(
      { message: "Failed to fetch orbiters" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const alignmentResult = validateProjectAlignment();

    if (!alignmentResult.ok) {
      return alignmentResult.response;
    }

    const dbResult = getAdminDbOrError();

    if (!dbResult.ok) {
      return dbResult.response;
    }

    const authResult = validateAdminRequest(req);

    if (!authResult.ok) {
      return authResult.response;
    }

    const body = await req.json();
    const {
      name,
      phoneNumber,
      role,
      dob,
      email = "",
      gender,
      mentor = "",
    } = body || {};

    if (!name || !phoneNumber || !role || !dob || !gender) {
      return NextResponse.json(
        { message: "Missing required orbiter fields" },
        { status: 400 }
      );
    }

    const { orbiters, nextUjbCode } = await buildOrbiterPayloads(dbResult.adminDb);

    let mentorData = {
      name: "",
      phone: "",
      ujbCode: "",
    };

    if (String(mentor).trim()) {
      const normalizedMentor = String(mentor).trim().toLowerCase();
      const foundMentor = orbiters.find(
        (item) =>
          item.name.toLowerCase() === normalizedMentor ||
          item.phone === mentor
      );

      if (!foundMentor) {
        return NextResponse.json(
          { message: "Mentor not found" },
          { status: 400 }
        );
      }

      mentorData = {
        name: foundMentor.name,
        phone: foundMentor.phone,
        ujbCode: foundMentor.ujbCode,
      };
    }

    const [year, month, day] = String(dob).split("-");
    const formattedDob =
      year && month && day
        ? `${day}/${month}/${year}`
        : "";

    await dbResult.adminDb
      .collection(userCollectionName)
      .doc(nextUjbCode)
      .set({
        Name: name,
        MobileNo: phoneNumber,
        Category: role,
        DOB: formattedDob,
        Email: email,
        Gender: gender,
        UJBCode: nextUjbCode,
        MentorName: mentorData.name,
        MentorPhone: mentorData.phone,
        MentorUJBCode: mentorData.ujbCode,
        ProfileStatus: "incomplete",
      });

    return NextResponse.json({
      success: true,
      ujbCode: nextUjbCode,
    });
  } catch (error) {
    console.error("Admin orbiter create error:", error);

    return NextResponse.json(
      { message: "Failed to create orbiter" },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  try {
    const alignmentResult = validateProjectAlignment();

    if (!alignmentResult.ok) {
      return alignmentResult.response;
    }

    const dbResult = getAdminDbOrError();

    if (!dbResult.ok) {
      return dbResult.response;
    }

    const authResult = validateAdminRequest(req);

    if (!authResult.ok) {
      return authResult.response;
    }

    const ujbCode = req.nextUrl.searchParams.get("ujbCode");

    if (!ujbCode) {
      return NextResponse.json(
        { message: "Missing ujbCode" },
        { status: 400 }
      );
    }

    await dbResult.adminDb.collection(userCollectionName).doc(ujbCode).delete();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin orbiter delete error:", error);

    return NextResponse.json(
      { message: "Failed to delete orbiter" },
      { status: 500 }
    );
  }
}

export async function PATCH(req) {
  try {
    const alignmentResult = validateProjectAlignment();

    if (!alignmentResult.ok) {
      return alignmentResult.response;
    }

    const dbResult = getAdminDbOrError();

    if (!dbResult.ok) {
      return dbResult.response;
    }

    const authResult = validateAdminRequest(req);

    if (!authResult.ok) {
      return authResult.response;
    }

    const ujbCode = req.nextUrl.searchParams.get("ujbCode");

    if (!ujbCode) {
      return NextResponse.json(
        { message: "Missing ujbCode" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const update =
      body && typeof body.update === "object" ? body.update : {};

    await dbResult.adminDb
      .collection(userCollectionName)
      .doc(ujbCode)
      .set(
        {
          ...update,
          updatedAt: new Date(),
        },
        { merge: true }
      );

    const updatedSnap = await dbResult.adminDb
      .collection(userCollectionName)
      .doc(ujbCode)
      .get();

    return NextResponse.json({
      success: true,
      user: {
        id: updatedSnap.id,
        ...updatedSnap.data(),
      },
    });
  } catch (error) {
    console.error("Admin orbiter update error:", error);

    return NextResponse.json(
      { message: "Failed to update orbiter" },
      { status: 500 }
    );
  }
}
