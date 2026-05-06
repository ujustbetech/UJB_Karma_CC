import { NextResponse } from "next/server";
import {
  adminDb,
  getFirebaseAdminInitError,
} from "@/lib/firebase/firebaseAdmin";
import { publicEnv } from "@/lib/config/publicEnv";
import { serverEnv } from "@/lib/config/serverEnv";
import {
  appendFormAuditLogs,
  buildFormAuditEntry,
  diffChangedFields,
} from "@/lib/prospectFormAudit";
import { triggerAssessmentSubmittedAutomation } from "@/lib/prospectAutomation/service.mjs";
import { buildProspectEngagementUpdate } from "@/lib/prospectEngagement";

const prospectCollectionName = publicEnv.collections.prospect;
const userCollectionName = publicEnv.collections.userDetail;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^(?:\+91)?[6-9]\d{9}$/;

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

async function ensureCpBoardUser(db, orbiter) {
  if (!orbiter?.ujbcode) return;

  const ref = db.collection("CPBoard").doc(orbiter.ujbcode);
  const snap = await ref.get();

  if (!snap.exists) {
    await ref.set({
      id: orbiter.ujbcode,
      name: orbiter.name,
      phoneNumber: orbiter.phone,
      role: orbiter.category || "CosmOrbiter",
      totals: { R: 0, H: 0, W: 0 },
      createdAt: new Date(),
    });
  }
}

async function updateCategoryTotals(db, orbiter, categories, points) {
  if (!orbiter?.ujbcode) return;

  const ref = db.collection("CPBoard").doc(orbiter.ujbcode);
  const snap = await ref.get();

  if (!snap.exists) return;

  const data = snap.data() || {};
  const totals = data.totals || { R: 0, H: 0, W: 0 };
  const splitPoints = Math.floor(points / categories.length);
  const updatedTotals = { ...totals };

  categories.forEach((cat) => {
    updatedTotals[cat] = (updatedTotals[cat] || 0) + splitPoints;
  });

  await ref.update({ totals: updatedTotals });
}

async function addCpForProspectAssessment(db, orbiter, payload) {
  if (!orbiter?.ujbcode) return;

  await ensureCpBoardUser(db, orbiter);

  const activityNo = "002";
  const points = 100;
  const categories = ["R"];

  const duplicateSnap = await db
    .collection("CPBoard")
    .doc(orbiter.ujbcode)
    .collection("activities")
    .where("activityNo", "==", activityNo)
    .where("prospectPhone", "==", payload.phoneNumber)
    .get();

  if (!duplicateSnap.empty) return;

  await db
    .collection("CPBoard")
    .doc(orbiter.ujbcode)
    .collection("activities")
    .add({
      activityNo,
      activityName: "Prospect Assessment (Tool)",
      points,
      categories,
      prospectName: payload.fullName || "",
      prospectPhone: payload.phoneNumber || "",
      addedAt: new Date(),
    });

  await updateCategoryTotals(db, orbiter, categories, points);
}

async function getProspectId(params) {
  const resolvedParams = await params;
  return resolvedParams?.id || null;
}

function normalizePhone(value) {
  const digits = String(value || "").replace(/\D/g, "");

  if (digits.length === 12 && digits.startsWith("91")) {
    return `+${digits}`;
  }

  if (digits.length === 10) {
    return `+91${digits}`;
  }

  return String(value || "").trim();
}

function validateProspectMentorAccessByPhone(prospect, mentorPhoneInput) {
  const enteredPhone = normalizePhone(mentorPhoneInput);
  const mentorPhone = normalizePhone(prospect?.orbiterContact);

  if (!enteredPhone) {
    return {
      ok: false,
      response: NextResponse.json(
        { message: "MentOrbiter mobile number is required." },
        { status: 400 }
      ),
    };
  }

  if (!PHONE_REGEX.test(enteredPhone.replace(/\s/g, ""))) {
    return {
      ok: false,
      response: NextResponse.json(
        { message: "Enter a valid MentOrbiter mobile number." },
        { status: 400 }
      ),
    };
  }

  if (!mentorPhone || enteredPhone !== mentorPhone) {
    return {
      ok: false,
      response: NextResponse.json(
        { message: "This mobile number is not the assigned MentOrbiter for this prospect." },
        { status: 403 }
      ),
    };
  }

  return { ok: true, mentorPhone: enteredPhone };
}

function validateAssessmentPayload(payload) {
  const errors = {};
  const interestAreas = Array.isArray(payload.interestAreas)
    ? payload.interestAreas
    : [];
  const contributionWays = Array.isArray(payload.contributionWays)
    ? payload.contributionWays
    : [];

  if (!String(payload.fullName || "").trim()) {
    errors.fullName = "Full name is required.";
  }

  if (!PHONE_REGEX.test(String(payload.phoneNumber || "").replace(/\s/g, ""))) {
    errors.phoneNumber = "Enter a valid Indian mobile number.";
  }

  if (!EMAIL_REGEX.test(String(payload.email || "").trim())) {
    errors.email = "Enter a valid email address.";
  }

  if (!String(payload.country || "").trim()) {
    errors.country = "Country is required.";
  }

  if (!String(payload.city || "").trim()) {
    errors.city = "City is required.";
  }

  if (!String(payload.profession || "").trim()) {
    errors.profession = "Occupation is required.";
  }

  if (!String(payload.assessmentDate || "").trim()) {
    errors.assessmentDate = "Assessment date is required.";
  } else {
    const selectedDate = new Date(`${payload.assessmentDate}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (Number.isNaN(selectedDate.getTime()) || selectedDate > today) {
      errors.assessmentDate = "Assessment date cannot be in the future.";
    }
  }

  if (!String(payload.howFound || "").trim()) {
    errors.howFound = "Please select how you found the prospect.";
  }

  if (
    payload.howFound === "Other" &&
    !String(payload.howFoundOther || "").trim()
  ) {
    errors.howFoundOther = "Please specify how you found the prospect.";
  }

  if (!String(payload.interestLevel || "").trim()) {
    errors.interestLevel = "Please select the interest level.";
  }

  if (interestAreas.length === 0) {
    errors.interestAreas = "Select at least one interest area.";
  }

  if (
    interestAreas.includes("Others (please specify)") &&
    !String(payload.interestOther || "").trim()
  ) {
    errors.interestOther = "Please specify the other interest area.";
  }

  if (contributionWays.length === 0) {
    errors.contributionWays = "Select at least one contribution way.";
  }

  if (
    contributionWays.includes("Other (please specify)") &&
    !String(payload.contributionOther || "").trim()
  ) {
    errors.contributionOther = "Please specify the other contribution.";
  }

  if (!String(payload.informedStatus || "").trim()) {
    errors.informedStatus = "Please select the informed status.";
  }

  if (!String(payload.alignmentLevel || "").trim()) {
    errors.alignmentLevel = "Please select the alignment level.";
  }

  if (!String(payload.recommendation || "").trim()) {
    errors.recommendation = "Please select the recommendation.";
  }

  return errors;
}

export async function GET(req, { params }) {
  try {
    const alignmentResult = validateProjectAlignment();

    if (!alignmentResult.ok) {
      return alignmentResult.response;
    }

    const dbResult = getAdminDbOrError();

    if (!dbResult.ok) {
      return dbResult.response;
    }

    const id = await getProspectId(params);

    if (!id) {
      return NextResponse.json(
        { message: "Missing prospect id" },
        { status: 400 }
      );
    }

    const prospectSnap = await dbResult.adminDb
      .collection(prospectCollectionName)
      .doc(id)
      .get();

    if (!prospectSnap.exists) {
      return NextResponse.json(
        { message: "Prospect not found" },
        { status: 404 }
      );
    }

    const prospect = {
      id: prospectSnap.id,
      ...prospectSnap.data(),
    };

    const mentorPhoneInput = req.nextUrl.searchParams.get("mentorPhone");
    const accessResult = validateProspectMentorAccessByPhone(
      prospect,
      mentorPhoneInput
    );

    if (!accessResult.ok) {
      return accessResult.response;
    }

    const formSnap = await dbResult.adminDb
      .collection(prospectCollectionName)
      .doc(id)
      .collection("prospectform")
      .limit(1)
      .get();

    return NextResponse.json({
      prospect,
      isSubmitted: !formSnap.empty,
    });
  } catch (error) {
    console.error("Prospect detail fetch error:", error);

    return NextResponse.json(
      { message: "Failed to fetch prospect" },
      { status: 500 }
    );
  }
}

export async function POST(req, { params }) {
  try {
    const alignmentResult = validateProjectAlignment();

    if (!alignmentResult.ok) {
      return alignmentResult.response;
    }

    const dbResult = getAdminDbOrError();

    if (!dbResult.ok) {
      return dbResult.response;
    }

    const id = await getProspectId(params);

    if (!id) {
      return NextResponse.json(
        { message: "Missing prospect id" },
        { status: 400 }
      );
    }

    const prospectSnap = await dbResult.adminDb
      .collection(prospectCollectionName)
      .doc(id)
      .get();

    if (!prospectSnap.exists) {
      return NextResponse.json(
        { message: "Prospect not found" },
        { status: 404 }
      );
    }

    const prospect = {
      id: prospectSnap.id,
      ...prospectSnap.data(),
    };

    const payload = await req.json();
    const accessResult = validateProspectMentorAccessByPhone(
      prospect,
      payload?.mentorAccessPhone
    );

    if (!accessResult.ok) {
      return accessResult.response;
    }
    const errors = validateAssessmentPayload(payload);

    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        {
          message: "Please correct the highlighted fields.",
          errors,
        },
        { status: 400 }
      );
    }

    const normalizedPayload = {
      ...payload,
      phoneNumber: normalizePhone(payload.phoneNumber),
      email: String(payload.email || "").trim(),
      fullName: String(payload.fullName || "").trim(),
      profession: String(payload.profession || "").trim(),
      country: String(payload.country || "").trim(),
      city: String(payload.city || "").trim(),
    };
    const formCollectionRef = dbResult.adminDb
      .collection(prospectCollectionName)
      .doc(id)
      .collection("prospectform");

    const existing = await formCollectionRef.limit(1).get();

    if (!existing.empty) {
      return NextResponse.json(
        { message: "Form already submitted", isSubmitted: true },
        { status: 409 }
      );
    }

    const finalData = {
      ...normalizedPayload,
      howFound:
        normalizedPayload.howFound === "Other"
          ? normalizedPayload.howFoundOther
          : normalizedPayload.howFound,
    };

    await formCollectionRef.add(finalData);

    const assessmentEngagementNote =
      "Assessment form submitted by MentOrbiter. Ready for meeting scheduling.";

    await dbResult.adminDb
      .collection(prospectCollectionName)
      .doc(id)
      .set(
        {
          formAuditLogs: appendFormAuditLogs(prospect.formAuditLogs, [
            buildFormAuditEntry({
              formName: "Form Assessment",
              actionType: "filled",
              performedBy:
                String(prospect.orbiterName || "").trim() ||
                String(accessResult.mentorPhone || "").trim() ||
                "MentorBiter",
              userRole: "MentorBiter",
              userIdentity:
                String(accessResult.mentorPhone || "").trim() ||
                String(prospect.orbiterEmail || "").trim(),
              changedFields: diffChangedFields({}, finalData),
            }),
          ]),
          currentStage: "Meeting",
          ...buildProspectEngagementUpdate(assessmentEngagementNote),
        },
        { merge: true }
      );

    const mentorPhone = String(accessResult.mentorPhone || "").trim();

    if (mentorPhone) {
      const mentorSnap = await dbResult.adminDb
        .collection(userCollectionName)
        .where("MobileNo", "==", mentorPhone)
        .limit(1)
        .get();

      if (!mentorSnap.empty) {
        const d = mentorSnap.docs[0].data();

        await addCpForProspectAssessment(dbResult.adminDb, {
          ujbcode: d.UJBCode,
          name: d.Name,
          phone: d.MobileNo,
          category: d.Category,
        }, normalizedPayload);
      }
    }

    await triggerAssessmentSubmittedAutomation(dbResult.adminDb, {
      ...prospect,
      currentStage: "Meeting",
      lastEngagementDate: new Date(),
      lastEngagementNote: assessmentEngagementNote,
    }).catch((error) => {
      console.error("Assessment submitted automation error:", error);
    });

    return NextResponse.json({ success: true, isSubmitted: true });
  } catch (error) {
    console.error("Prospect form submit error:", error);

    return NextResponse.json(
      { message: "Failed to submit prospect assessment" },
      { status: 500 }
    );
  }
}


