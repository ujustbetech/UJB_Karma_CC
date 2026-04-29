import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/adminRequestAuth.mjs";
import { hasAdminAccess } from "@/lib/auth/accessControl";
import { getDataProvider } from "@/lib/data/provider.mjs";
import { publicEnv } from "@/lib/config/publicEnv";
import { serverEnv } from "@/lib/config/serverEnv";

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
    return { ok: true, admin: auth.admin, provider };
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

async function buildOrbiterPayloads(provider) {
  const users = await provider.users.listAll();

  const orbiters = users.map((user) => ({
    ujbCode: user.id,
    name: user.Name || "",
    phone: user.MobileNo || "",
    email: user.Email || "",
  }));

  let maxNumber = 0;

  users.forEach((data) => {
    const code = data.UJBCode || data.ujbCode || data.id;
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
  return { users: await db.users.listAll() };
}

export async function GET(req) {
  try {
    const alignmentResult = validateProjectAlignment();

    if (!alignmentResult.ok) {
      return alignmentResult.response;
    }

    const guard = requireAdminProvider(req);
    if (!guard.ok) {
      return guard.response;
    }

    const ujbCode = req.nextUrl.searchParams.get("ujbCode");
    const view = req.nextUrl.searchParams.get("view");

    if (ujbCode) {
      const user = await guard.provider.users.getByUjbCode(ujbCode);

      if (!user) {
        return NextResponse.json(
          { message: "Orbiter not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        user,
      });
    }

    const payload =
      view === "full"
        ? await buildFullUserPayload(guard.provider)
        : await buildOrbiterPayloads(guard.provider);

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

    const guard = requireAdminProvider(req);
    if (!guard.ok) {
      return guard.response;
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

    const { orbiters, nextUjbCode } = await buildOrbiterPayloads(guard.provider);

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

    await guard.provider.users.createById(nextUjbCode, {
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

    const guard = requireAdminProvider(req);
    if (!guard.ok) {
      return guard.response;
    }

    const ujbCode = req.nextUrl.searchParams.get("ujbCode");

    if (!ujbCode) {
      return NextResponse.json(
        { message: "Missing ujbCode" },
        { status: 400 }
      );
    }

    await guard.provider.users.deleteByUjbCode(ujbCode);

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

    const guard = requireAdminProvider(req);
    if (!guard.ok) {
      return guard.response;
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

    const updatedUser = await guard.provider.users.updateByUjbCode(ujbCode, update);

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error("Admin orbiter update error:", error);

    return NextResponse.json(
      { message: "Failed to update orbiter" },
      { status: 500 }
    );
  }
}


