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
import {
  appendFormAuditLogs,
  buildFormAuditEntry,
  diffChangedFields,
  getFormAuditLogs,
} from "@/lib/prospectFormAudit";

const prospectCollectionName = publicEnv.collections.prospect;
const userCollectionName = publicEnv.collections.userDetail;
const INDIA_DIAL_CODE = "+91";
const INDIAN_MOBILE_REGEX = /^\+91[6-9]\d{9}$/;
const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const UJB_SEED_START = 10122000000001;
const FINAL_AUTHENTIC_CHOICE_STATUSES = new Set([
  "Choose to enroll",
  "Decline by UJustBe",
  "Decline by Prospect",
]);

function getAdultDobMax() {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 18);
  return date;
}

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

function getAdminDisplayName(admin) {
  return String(admin?.name || admin?.email || "Admin").trim();
}

function getAdminAuditIdentity(admin) {
  return String(admin?.email || admin?.name || "Admin").trim();
}

function normalizeMeetingEvent(event, admin) {
  if (!event || typeof event !== "object") {
    return event;
  }

  const normalizedEvent = {
    ...event,
    mode: String(event.mode || "").trim().toLowerCase() || "online",
    status: String(event.status || "").trim() || "Scheduled",
    recordingLink: String(event.recordingLink || "").trim(),
    noRecordingReason: String(event.noRecordingReason || "").trim(),
    loggedBy: String(event.loggedBy || "").trim(),
  };

  if (normalizedEvent.status === "Done" && !normalizedEvent.loggedBy) {
    normalizedEvent.loggedBy = `Logged by ${getAdminDisplayName(admin)}`;
  }

  return normalizedEvent;
}

function getMeetingIdentity(event, index) {
  return [
    String(event?.id ?? "no-id"),
    String(event?.dateISO ?? "no-date"),
    String(event?.createdAt ?? "no-created-at"),
    String(index),
  ].join("::");
}

function validateMeetingCompletion(nextEvents = [], previousEvents = []) {
  const previousEventMap = new Map(
    previousEvents.map((event, index) => [
      getMeetingIdentity(event, index),
      event,
    ])
  );

  const invalidDoneMeeting = nextEvents.find((event, index) => {
    if (!event || event.status !== "Done") {
      return false;
    }

    const previousEvent = previousEventMap.get(getMeetingIdentity(event, index));
    const wasPreviouslyDone = previousEvent?.status === "Done";
    const previousRecording = String(previousEvent?.recordingLink || "").trim();
    const previousReason = String(previousEvent?.noRecordingReason || "").trim();
    const currentRecording = String(event.recordingLink || "").trim();
    const currentReason = String(event.noRecordingReason || "").trim();
    const hasRecording = Boolean(currentRecording);
    const hasReason = currentReason.length >= 10;
    const completionDetailsChanged =
      previousRecording !== currentRecording || previousReason !== currentReason;

    if (wasPreviouslyDone && !completionDetailsChanged) {
      return false;
    }

    return !hasRecording && !hasReason;
  });

  if (!invalidDoneMeeting) {
    return null;
  }

  return NextResponse.json(
    {
      message:
        "Completed meetings require either a recording link/reference or a valid no-recording reason.",
    },
    { status: 400 }
  );
}

function extractUjbSequence(value) {
  const normalized = String(value || "").trim().toUpperCase();
  const match =
    normalized.match(/^UJB0*([1-9]\d*)$/) || normalized.match(/^UJB(0+)$/);

  if (!match) {
    return null;
  }

  if (match[1]) {
    return parseInt(match[1], 10);
  }

  return 0;
}

async function getNextUjbCode(db) {
  const snapshot = await db.collection(userCollectionName).get();
  let maxNumber = 0;

  snapshot.forEach((docSnap) => {
    const data = docSnap.data() || {};
    const code = data.UJBCode || data.ujbCode || docSnap.id;
    const num = extractUjbSequence(code);

    if (num !== null && num > maxNumber) {
      maxNumber = num;
    }
  });

  const nextNumber =
    maxNumber > 0 ? Math.max(maxNumber + 1, UJB_SEED_START) : UJB_SEED_START;

  return `UJB${String(nextNumber)}`;
}

function normalizeUserDetailPhone(value) {
  const digits = String(value || "").replace(/\D/g, "");

  if (digits.length >= 10) {
    return digits.slice(-10);
  }

  return digits;
}

function getProspectField(prospect, keys = []) {
  for (const key of keys) {
    const value = prospect?.[key];
    if (value != null && String(value).trim() !== "") {
      return String(value).trim();
    }
  }

  return "";
}

async function createOrbiterOnEnrollmentCompletion(db, prospect) {
  const prospectName = getProspectField(prospect, [
    "prospectName",
    "ProspectName",
    "name",
    "Name",
  ]);
  const rawProspectPhone = getProspectField(prospect, [
    "prospectPhone",
    "ProspectPhone",
    "phone",
    "Phone",
    "phoneNumber",
    "PhoneNumber",
  ]);
  const prospectPhone = normalizeUserDetailPhone(rawProspectPhone);

  if (!prospectPhone || !prospectName) {
    return {
      status: "missing_fields",
      missingFields: [
        !prospectName ? "prospectName" : null,
        !prospectPhone ? "prospectPhone" : null,
      ].filter(Boolean),
    };
  }

  const userSnapshot = await db.collection(userCollectionName).get();
  let existingByPhone = null;
  let mentorData = {
    name: "",
    phone: "",
    ujbCode: "",
  };
  const mentorPhone = normalizeUserDetailPhone(
    getProspectField(prospect, [
      "orbiterContact",
      "OrbiterContact",
      "mentorPhone",
      "MentorPhone",
    ])
  );

  userSnapshot.forEach((docSnap) => {
    const data = docSnap.data() || {};
    const normalizedMobile = normalizeUserDetailPhone(data.MobileNo || data["Mobile no"]);

    if (!existingByPhone && normalizedMobile && normalizedMobile === prospectPhone) {
      existingByPhone = docSnap;
    }

    if (!mentorData.ujbCode && mentorPhone && normalizedMobile === mentorPhone) {
      mentorData = {
        name:
          data.Name ||
          getProspectField(prospect, ["orbiterName", "OrbiterName"]) ||
          "",
        phone: data.MobileNo || data["Mobile no"] || mentorPhone,
        ujbCode: data.UJBCode || data.ujbCode || docSnap.id,
      };
    }
  });

  if (existingByPhone) {
    const existingData = existingByPhone.data() || {};
    const existingCode = existingData.UJBCode || existingByPhone.id;

    return {
      ujbCode: existingCode,
      status: "already_orbiter",
    };
  }

  const nextUjbCode = await getNextUjbCode(db);

  const parsedDob = normalizeDateOnly(prospect?.dob);
  const formattedDob = parsedDob ? parsedDob.split("-").reverse().join("/") : "";

  await db.collection(userCollectionName).doc(nextUjbCode).set({
    Name: prospectName,
    MobileNo: prospectPhone,
    "Mobile no": prospectPhone,
    Category: "Orbiter",
    DOB: formattedDob,
    Email: getProspectField(prospect, ["email", "Email"]),
    Gender: getProspectField(prospect, ["gender", "Gender"]),
    UJBCode: nextUjbCode,
    MentorName: mentorData.name,
    MentorPhone: mentorData.phone,
    MentorUJBCode: mentorData.ujbCode,
    ProfileStatus: "incomplete",
    SourceProspectId: prospect.id || "",
    CreatedFromEnrollment: true,
  });

  return {
    ujbCode: nextUjbCode,
    status: "created",
  };
}

function validateProspectPayload(body, options = {}) {
  const { requireSource = false } = options;
  const {
    userType,
    prospectName,
    prospectPhone,
    occupation,
    email,
    dob,
    orbiterName,
    orbiterContact,
    orbiterEmail,
    source,
    type,
  } = body || {};

  if (
    !userType ||
    !prospectName ||
    !prospectPhone ||
    !occupation ||
    !email ||
    !dob ||
    !orbiterName ||
    !orbiterContact ||
    (requireSource && !source) ||
    !type
  ) {
    return "Missing required prospect fields";
  }

  if (!INDIAN_MOBILE_REGEX.test(String(prospectPhone).trim())) {
    return `Prospect phone must be a valid ${INDIA_DIAL_CODE} 10-digit Indian mobile number`;
  }

  if (!EMAIL_REGEX.test(String(email).trim())) {
    return "Invalid email address";
  }

  const dobDate = new Date(String(dob));

  if (Number.isNaN(dobDate.getTime()) || dobDate > getAdultDobMax()) {
    return "Prospect must be at least 18 years old";
  }

  if (orbiterEmail && !EMAIL_REGEX.test(String(orbiterEmail).trim())) {
    return "Invalid orbiter email address";
  }

  return null;
}

function parseDateInput(value) {
  if (!value) return null;

  if (typeof value !== "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const trimmed = value.trim();
  if (!trimmed) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const parsed = new Date(`${trimmed}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(trimmed)) {
    const parsed = new Date(trimmed);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function normalizeDateOnly(value) {
  const parsed = parseDateInput(value);
  if (!parsed) return "";

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function validateEngagementEntry(entry, userList = [], existingEntries = []) {
  const nextEntry = entry && typeof entry === "object" ? entry : {};
  const orbiterName = String(nextEntry.orbiterName || "").trim();
  const occasion = String(nextEntry.occasion || "").trim();
  const otherOccasion = String(nextEntry.otherOccasion || "").trim();
  const discussionDetails = String(nextEntry.discussionDetails || "").trim();
  const callDate = normalizeDateOnly(nextEntry.callDate);
  const nextFollowupDate = normalizeDateOnly(nextEntry.nextFollowupDate);
  const today = normalizeDateOnly(new Date().toISOString());
  const latestSavedCallDate = [...existingEntries]
    .map((item) => normalizeDateOnly(item?.callDate))
    .filter(Boolean)
    .sort()
    .at(-1);

  if (!callDate) {
    return "Date of calling is required";
  }

  if (callDate < today) {
    return "Date of calling cannot be a past date";
  }

  if (callDate > today) {
    return "Date of calling cannot be in the future";
  }

  if (latestSavedCallDate && callDate < latestSavedCallDate) {
    return "Date of calling cannot be earlier than the latest saved engagement entry";
  }

  if (!orbiterName) {
    return "Orbiter name is required";
  }

  if (
    Array.isArray(userList) &&
    userList.length > 0 &&
    !userList.some((user) => String(user.name || "").trim() === orbiterName)
  ) {
    return "Select a valid orbiter from the list";
  }

  if (!occasion) {
    return "Occasion is required";
  }

  if (occasion === "Other" && !otherOccasion) {
    return "Please specify the other occasion";
  }

  if (!discussionDetails) {
    return "Discussion details are required";
  }

  if (discussionDetails.length < 5) {
    return "Discussion details must be at least 5 characters";
  }

  if (!nextFollowupDate) {
    return "Next follow-up date is required";
  }

  const callDateValue = parseDateInput(callDate);
  const nextFollowupValue = parseDateInput(nextFollowupDate);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  if (!callDateValue) {
    return "Date of calling is invalid";
  }

  if (callDateValue > endOfToday) {
    return "Date of calling cannot be in the future";
  }

  if (!nextFollowupValue) {
    return "Next follow-up date is invalid";
  }

  if (nextFollowupDate < today) {
    return "Next follow-up date cannot be a past date";
  }

  if (nextFollowupValue < callDateValue) {
    return "Next follow-up date cannot be earlier than the call date";
  }

  return null;
}

async function ensureCpBoardUserForAdmin(db, orbiter) {
  if (!orbiter?.ujbcode) return;

  const ref = db.collection("CPBoard").doc(orbiter.ujbcode);
  const snap = await ref.get();

  if (!snap.exists) {
    await ref.set({
      id: orbiter.ujbcode,
      name: orbiter.name,
      phoneNumber: orbiter.phone,
      role: orbiter.category || "MentOrbiter",
      totals: { R: 0, H: 0, W: 0 },
      createdAt: new Date(),
    });
  }
}

async function updateCategoryTotalsForAdmin(db, orbiter, categories, points) {
  if (!orbiter?.ujbcode || !Array.isArray(categories) || categories.length === 0) {
    return;
  }

  const ref = db.collection("CPBoard").doc(orbiter.ujbcode);
  const snap = await ref.get();

  if (!snap.exists) return;

  const totals = snap.data()?.totals || { R: 0, H: 0, W: 0 };
  const split = Math.floor(points / categories.length);
  const nextTotals = { ...totals };

  categories.forEach((category) => {
    nextTotals[category] = (nextTotals[category] || 0) + split;
  });

  await ref.update({
    totals: nextTotals,
    lastUpdatedAt: new Date(),
  });
}

async function addCpForEnrollmentByAdmin(db, orbiter, prospect) {
  if (!orbiter?.ujbcode || !prospect?.prospectPhone) return;

  await ensureCpBoardUserForAdmin(db, orbiter);

  const activityNo = "011";
  const points = 100;
  const categories = ["R"];

  const duplicateSnap = await db
    .collection("CPBoard")
    .doc(orbiter.ujbcode)
    .collection("activities")
    .where("activityNo", "==", activityNo)
    .where("prospectPhone", "==", prospect.prospectPhone)
    .limit(1)
    .get();

  if (!duplicateSnap.empty) return;

  await db
    .collection("CPBoard")
    .doc(orbiter.ujbcode)
    .collection("activities")
    .add({
      activityNo,
      activityName: "Initiating Enrollment (Tool)",
      points,
      categories,
      purpose:
        "Marks transition from prospecting to formal enrollment; key conversion milestone.",
      prospectName: prospect.prospectName || "",
      prospectPhone: prospect.prospectPhone || "",
      source: "Assessment",
      month: new Date().toLocaleString("default", {
        month: "short",
        year: "numeric",
      }),
      addedAt: new Date(),
    });

  await updateCategoryTotalsForAdmin(db, orbiter, categories, points);
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
    const validationError = validateProspectPayload(body, {
      requireSource: true,
    });

    if (validationError) {
      return NextResponse.json(
        { message: validationError },
        { status: 400 }
      );
    }

    const docRef = await dbResult.adminDb.collection(prospectCollectionName).add({
      userType: String(body.userType).trim(),
      prospectName: String(body.prospectName).trim(),
      prospectPhone: String(body.prospectPhone).trim(),
      occupation: String(body.occupation).trim(),
      hobbies: String(body.hobbies).trim(),
      email: String(body.email).trim(),
      dob: String(body.dob).trim(),
      orbiterName: String(body.orbiterName).trim(),
      orbiterContact: String(body.orbiterContact).trim(),
      orbiterEmail: String(body.orbiterEmail || "").trim(),
      source: String(body.source || "").trim(),
      type: String(body.type).trim(),
      registeredAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      id: docRef.id,
    });
  } catch (error) {
    console.error("Admin prospect create error:", error);

    return NextResponse.json(
      { message: "Failed to create prospect" },
      { status: 500 }
    );
  }
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

    const id = req.nextUrl.searchParams.get("id");
    const section = req.nextUrl.searchParams.get("section");

    if (id) {
      const docSnap = await dbResult.adminDb
        .collection(prospectCollectionName)
        .doc(id)
        .get();

      if (!docSnap.exists) {
        return NextResponse.json(
          { message: "Prospect not found" },
          { status: 404 }
        );
      }

      const prospect = {
        id: docSnap.id,
        ...docSnap.data(),
      };

      if (section === "prospectform") {
        const formSnapshot = await dbResult.adminDb
          .collection(prospectCollectionName)
          .doc(id)
          .collection("prospectform")
          .get();

        return NextResponse.json({
          prospect,
          forms: formSnapshot.docs.map((formDoc) => ({
            id: formDoc.id,
            ...formDoc.data(),
          })),
          auditLogs: getFormAuditLogs(prospect, "Form Assessment"),
        });
      }

      if (section === "followups") {
        const userSnapshot = await dbResult.adminDb
          .collection(publicEnv.collections.userDetail)
          .get();

        return NextResponse.json({
          prospect,
          admin: authResult.admin,
          users: userSnapshot.docs.map((userDoc) => {
            const userData = userDoc.data() || {};

            return {
              id: userDoc.id,
              name: userData.Name || userData[" Name"] || "",
              phone: userData.MobileNo || userData["Mobile no"] || "",
              email: userData.Email || "",
            };
          }),
        });
      }

      if (section === "prospectfeedbackform") {
        const formSnapshot = await dbResult.adminDb
          .collection(prospectCollectionName)
          .doc(id)
          .collection("prospectfeedbackform")
          .get();

        return NextResponse.json({
          prospect,
          forms: formSnapshot.docs.map((formDoc) => ({
            id: formDoc.id,
            ...formDoc.data(),
          })),
          auditLogs: getFormAuditLogs(prospect, "Feedback Form"),
        });
      }

      if (section === "engagementlogs") {
        const engagementSnapshot = await dbResult.adminDb
          .collection(prospectCollectionName)
          .doc(id)
          .collection("engagementform")
          .get();

        const userSnapshot = await dbResult.adminDb
          .collection(publicEnv.collections.userDetail)
          .get();

        return NextResponse.json({
          prospect,
          entries: engagementSnapshot.docs.map((entryDoc) => ({
            id: entryDoc.id,
            ...entryDoc.data(),
          })),
          users: userSnapshot.docs.map((userDoc) => {
            const userData = userDoc.data() || {};

            return {
              id: userDoc.id,
              name: userData.Name || "",
              phone: userData.MobileNo || "",
              email: userData.Email || "",
            };
          }),
        });
      }

      if (section === "authenticchoice") {
        return NextResponse.json({
          prospect,
          authenticChoiceLogs: Array.isArray(prospect.authenticChoiceLogs)
            ? prospect.authenticChoiceLogs
            : [],
        });
      }

      if (section === "enrollmentstages") {
        return NextResponse.json({
          prospect,
          enrollmentStages: Array.isArray(prospect.enrollmentStages)
            ? prospect.enrollmentStages
            : [],
          enrollmentStageLogs: Array.isArray(prospect.enrollmentStageLogs)
            ? prospect.enrollmentStageLogs
            : [],
          auditLogs: getFormAuditLogs(prospect, "UJB Enrollment Form"),
        });
      }

      if (section === "additionalinfo") {
        return NextResponse.json({
          prospect,
          sections: Array.isArray(prospect.sections) ? prospect.sections : [],
          auditLogs: getFormAuditLogs(prospect, "UJB Enrollment Form"),
        });
      }

      return NextResponse.json({ prospect });
    }

    const snapshot = await dbResult.adminDb.collection(prospectCollectionName).get();

    const prospects = await Promise.all(
      snapshot.docs.map(async (docSnap) => {
        const data = docSnap.data();
        const engagementSnapshot = await dbResult.adminDb
          .collection(prospectCollectionName)
          .doc(docSnap.id)
          .collection("engagementform")
          .get();

        let lastEngagementDate = null;
        let nextFollowupDate = null;

        if (!engagementSnapshot.empty) {
          const engagements = engagementSnapshot.docs.map((engagementDoc) =>
            engagementDoc.data()
          );

          engagements.sort((a, b) => {
            const dateA = a.updatedAt?._seconds || a.createdAt?._seconds || a.updatedAt?.seconds || a.createdAt?.seconds || 0;
            const dateB = b.updatedAt?._seconds || b.createdAt?._seconds || b.updatedAt?.seconds || b.createdAt?.seconds || 0;

            return dateB - dateA;
          });

          const latest = engagements[0];

          if (latest.callDate) {
            lastEngagementDate = latest.callDate;
          } else if (latest.updatedAt) {
            lastEngagementDate = latest.updatedAt;
          } else if (latest.createdAt) {
            lastEngagementDate = latest.createdAt;
          }

          if (latest.nextFollowupDate) {
            nextFollowupDate = latest.nextFollowupDate;
          }
        }

        return {
          id: docSnap.id,
          ...data,
          lastEngagementDate,
          nextFollowupDate,
        };
      })
    );

    return NextResponse.json({ prospects });
  } catch (error) {
    console.error("Admin prospects fetch error:", error);

    return NextResponse.json(
      { message: "Failed to fetch prospects" },
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

    const id = req.nextUrl.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { message: "Missing prospect id" },
        { status: 400 }
      );
    }

    await dbResult.adminDb.collection(prospectCollectionName).doc(id).delete();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin prospect delete error:", error);

    return NextResponse.json(
      { message: "Failed to delete prospect" },
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

    const id = req.nextUrl.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { message: "Missing prospect id" },
        { status: 400 }
      );
    }

    const section = req.nextUrl.searchParams.get("section");
    const body = await req.json();

    if (section === "prospectform") {
      const forms = Array.isArray(body.forms) ? body.forms : [];
      const prospectRef = dbResult.adminDb.collection(prospectCollectionName).doc(id);
      const prospectSnap = await prospectRef.get();
      const prospectData = prospectSnap.exists ? prospectSnap.data() || {} : {};
      const existingLogs = Array.isArray(prospectData.formAuditLogs)
        ? prospectData.formAuditLogs
        : [];
      const nextAuditEntries = [];
      const formCollectionRef = prospectRef.collection("prospectform");

      for (const form of forms) {
        const { id: formId, ...formData } = form || {};
        let previousData = {};

        if (formId) {
          const existingFormSnap = await formCollectionRef.doc(formId).get();
          previousData = existingFormSnap.exists ? existingFormSnap.data() || {} : {};
        }
        const changedFields = diffChangedFields(previousData, formData);

        if (formId) {
          await formCollectionRef
            .doc(formId)
            .set(
              {
                ...formData,
                updatedAt: new Date(),
              },
              { merge: true }
            );
          if (changedFields.length > 0) {
            nextAuditEntries.push(
              buildFormAuditEntry({
                formName: "Form Assessment",
                actionType: "edited",
                performedBy: getAdminDisplayName(authResult.admin),
                userRole: "Admin user",
                userIdentity: getAdminAuditIdentity(authResult.admin),
                changedFields,
              })
            );
          }
        } else {
          await formCollectionRef
            .add({
              ...formData,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          nextAuditEntries.push(
            buildFormAuditEntry({
              formName: "Form Assessment",
              actionType: "filled",
              performedBy: getAdminDisplayName(authResult.admin),
              userRole: "Admin user",
              userIdentity: getAdminAuditIdentity(authResult.admin),
              changedFields: changedFields.length > 0 ? changedFields : diffChangedFields({}, formData),
            })
          );
        }
      }

      const updatedAuditLogs = appendFormAuditLogs(existingLogs, nextAuditEntries);

      if (nextAuditEntries.length > 0) {
        await prospectRef.set(
          {
            formAuditLogs: updatedAuditLogs,
            updatedAt: new Date(),
          },
          { merge: true }
        );
      }

      return NextResponse.json({
        success: true,
        auditLogs: updatedAuditLogs,
      });
    }

    if (section === "followups") {
      const update = body.update && typeof body.update === "object" ? body.update : {};
      const normalizedUpdate = {
        ...update,
      };
      const existingProspectSnap = await dbResult.adminDb
        .collection(prospectCollectionName)
        .doc(id)
        .get();
      const existingProspect = existingProspectSnap.exists
        ? existingProspectSnap.data() || {}
        : {};

      if (Array.isArray(update.events)) {
        normalizedUpdate.events = update.events.map((event) =>
          normalizeMeetingEvent(event, authResult.admin)
        );
        const previousEvents = Array.isArray(existingProspect.events)
          ? existingProspect.events
          : existingProspect.event
          ? [existingProspect.event]
          : [];

        const completionError = validateMeetingCompletion(
          normalizedUpdate.events,
          previousEvents
        );

        if (completionError) {
          return completionError;
        }
      }

      if (update.event && typeof update.event === "object") {
        normalizedUpdate.event = normalizeMeetingEvent(update.event, authResult.admin);
      }

      await dbResult.adminDb.collection(prospectCollectionName).doc(id).set(
        {
          ...normalizedUpdate,
          updatedAt: new Date(),
        },
        { merge: true }
      );

      return NextResponse.json({ success: true });
    }

    if (section === "prospectfeedbackform") {
      const forms = Array.isArray(body.forms) ? body.forms : [];
      const prospectRef = dbResult.adminDb.collection(prospectCollectionName).doc(id);
      const prospectSnap = await prospectRef.get();
      const prospectData = prospectSnap.exists ? prospectSnap.data() || {} : {};
      const existingLogs = Array.isArray(prospectData.formAuditLogs)
        ? prospectData.formAuditLogs
        : [];
      const nextAuditEntries = [];
      const formCollectionRef = prospectRef.collection("prospectfeedbackform");

      for (const form of forms) {
        const { id: formId, ...formData } = form || {};
        let previousData = {};

        if (formId) {
          const existingFormSnap = await formCollectionRef.doc(formId).get();
          previousData = existingFormSnap.exists ? existingFormSnap.data() || {} : {};
        }
        const changedFields = diffChangedFields(previousData, formData);

        if (formId) {
          await formCollectionRef
            .doc(formId)
            .set(
              {
                ...formData,
                updatedAt: new Date(),
              },
              { merge: true }
            );
          if (changedFields.length > 0) {
            nextAuditEntries.push(
              buildFormAuditEntry({
                formName: "Feedback Form",
                actionType: "edited",
                performedBy: getAdminDisplayName(authResult.admin),
                userRole: "Admin user",
                userIdentity: getAdminAuditIdentity(authResult.admin),
                changedFields,
              })
            );
          }
        } else {
          await formCollectionRef
            .add({
              ...formData,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          nextAuditEntries.push(
            buildFormAuditEntry({
              formName: "Feedback Form",
              actionType: "filled",
              performedBy: getAdminDisplayName(authResult.admin),
              userRole: "Admin user",
              userIdentity: getAdminAuditIdentity(authResult.admin),
              changedFields: changedFields.length > 0 ? changedFields : diffChangedFields({}, formData),
            })
          );
        }
      }

      const updatedAuditLogs = appendFormAuditLogs(existingLogs, nextAuditEntries);

      if (nextAuditEntries.length > 0) {
        await prospectRef.set(
          {
            formAuditLogs: updatedAuditLogs,
            updatedAt: new Date(),
          },
          { merge: true }
        );
      }

      return NextResponse.json({
        success: true,
        auditLogs: updatedAuditLogs,
      });
    }

    if (section === "additionalinfo") {
      const update = body.update && typeof body.update === "object" ? body.update : {};
      const auditAction = String(body.auditAction || "").trim();
      const prospectRef = dbResult.adminDb.collection(prospectCollectionName).doc(id);
      const prospectSnap = await prospectRef.get();
      const prospectData = prospectSnap.exists ? prospectSnap.data() || {} : {};
      const existingLogs = Array.isArray(prospectData.formAuditLogs)
        ? prospectData.formAuditLogs
        : [];
      const nextAuditEntries = [];

      if (Object.keys(update).length > 0) {
        const previousSection = Array.isArray(prospectData.sections)
          ? prospectData.sections[0] || {}
          : {};
        const nextSection = Array.isArray(update.sections)
          ? update.sections[0] || {}
          : {};
        const changedFields = diffChangedFields(previousSection, nextSection);

        await prospectRef.set(
          {
            ...update,
            updatedAt: new Date(),
          },
          { merge: true }
        );

        nextAuditEntries.push(
          buildFormAuditEntry({
            formName: "UJB Enrollment Form",
            actionType: Array.isArray(prospectData.sections) && prospectData.sections.length > 0 ? "edited" : "filled",
            performedBy: getAdminDisplayName(authResult.admin),
            userRole: "Admin user",
            userIdentity: getAdminAuditIdentity(authResult.admin),
            changedFields: changedFields.length > 0 ? changedFields : diffChangedFields({}, nextSection),
          })
        );
      }

      if (auditAction === "sent") {
        nextAuditEntries.push(
          buildFormAuditEntry({
            formName: "Feedback Form",
            actionType: "sent",
            performedBy: getAdminDisplayName(authResult.admin),
            userRole: "Admin user",
            userIdentity: getAdminAuditIdentity(authResult.admin),
            changedFields: [],
          })
        );
      }

      const updatedAuditLogs = appendFormAuditLogs(existingLogs, nextAuditEntries);

      if (nextAuditEntries.length > 0) {
        await prospectRef.set(
          {
            formAuditLogs: updatedAuditLogs,
            updatedAt: new Date(),
          },
          { merge: true }
        );
      }

      return NextResponse.json({
        success: true,
        auditLogs: updatedAuditLogs,
      });
    }

    if (section === "engagementlogs") {
      const entry =
        body.entry && typeof body.entry === "object" ? body.entry : {};

      const userSnapshot = await dbResult.adminDb
        .collection(publicEnv.collections.userDetail)
        .get();

      const users = userSnapshot.docs.map((userDoc) => {
        const userData = userDoc.data() || {};
        return {
          id: userDoc.id,
          name: userData.Name || "",
        };
      });

      const existingEntriesSnapshot = await dbResult.adminDb
        .collection(prospectCollectionName)
        .doc(id)
        .collection("engagementform")
        .get();

      const existingEntries = existingEntriesSnapshot.docs.map((entryDoc) =>
        entryDoc.data()
      );

      const validationError = validateEngagementEntry(entry, users, existingEntries);

      if (validationError) {
        return NextResponse.json(
          { message: validationError },
          { status: 400 }
        );
      }

      await dbResult.adminDb
        .collection(prospectCollectionName)
        .doc(id)
        .collection("engagementform")
        .add({
          ...entry,
          callDate: normalizeDateOnly(entry.callDate),
          nextFollowupDate: normalizeDateOnly(entry.nextFollowupDate),
          discussionDetails: String(entry.discussionDetails || "").trim(),
          orbiterName: String(entry.orbiterName || "").trim(),
          occasion: String(entry.occasion || "").trim(),
          otherOccasion: String(entry.otherOccasion || "").trim(),
          createdAt: new Date(),
          updatedAt: new Date(),
        });

      const updatedEntries = await dbResult.adminDb
        .collection(prospectCollectionName)
        .doc(id)
        .collection("engagementform")
        .get();

      return NextResponse.json({
        success: true,
        entries: updatedEntries.docs.map((entryDoc) => ({
          id: entryDoc.id,
          ...entryDoc.data(),
        })),
      });
    }

    if (section === "authenticchoice") {
      const selectedStatus = String(body.status || "").trim();
      const note = String(body.note || "").trim();

      if (!selectedStatus) {
        return NextResponse.json(
          { message: "Status is required" },
          { status: 400 }
        );
      }

      const prospectRef = dbResult.adminDb.collection(prospectCollectionName).doc(id);
      const prospectSnap = await prospectRef.get();

      if (!prospectSnap.exists) {
        return NextResponse.json(
          { message: "Prospect not found" },
          { status: 404 }
        );
      }

      const prospectData = prospectSnap.data() || {};
      const existingLogs = Array.isArray(prospectData.authenticChoiceLogs)
        ? prospectData.authenticChoiceLogs
        : [];
      const previousStatus = prospectData.status || "No status yet";
      const adminName =
        authResult.admin?.displayName ||
        authResult.admin?.name ||
        authResult.admin?.email ||
        "Admin";

      const logEntry = {
        status: selectedStatus,
        previousStatus,
        note,
        clickedBy: adminName,
        clickedAt: new Date(),
      };

      await prospectRef.set(
        {
          status: selectedStatus,
          declineReason: selectedStatus.startsWith("Decline") ? note : "",
          statusNote:
            selectedStatus === "Awaiting response" || selectedStatus === "Need some time"
              ? note
              : "",
          authenticChoiceLogs: [...existingLogs, logEntry],
          updatedAt: new Date(),
        },
        { merge: true }
      );

      if (selectedStatus === "Choose to enroll") {
        const orbiterContact = prospectData.orbiterContact || "";

        if (orbiterContact) {
          const mentorSnap = await dbResult.adminDb
            .collection(publicEnv.collections.userDetail)
            .where("MobileNo", "==", orbiterContact)
            .limit(1)
            .get();

          if (!mentorSnap.empty) {
            const mentorData = mentorSnap.docs[0].data() || {};

            if (mentorData.UJBCode) {
              await addCpForEnrollmentByAdmin(dbResult.adminDb, {
                ujbcode: mentorData.UJBCode,
                name: mentorData.Name,
                phone: mentorData.MobileNo,
                category: mentorData.Category,
              }, {
                prospectName: prospectData.prospectName,
                prospectPhone: prospectData.prospectPhone,
              });
            }
          }
        }
      }

      const updatedSnap = await prospectRef.get();

      return NextResponse.json({
        success: true,
        prospect: {
          id: updatedSnap.id,
          ...updatedSnap.data(),
        },
      });
    }

    if (section === "enrollmentstages") {
      const rows = Array.isArray(body.rows) ? body.rows : [];
      const action = String(body.action || "save").trim();
      const targetLabel = String(body.targetLabel || "").trim();
      const logMeta =
        body.logMeta && typeof body.logMeta === "object" ? body.logMeta : {};
      const adminName =
        authResult.admin?.displayName ||
        authResult.admin?.name ||
        authResult.admin?.email ||
        "Admin";
      const prospectRef = dbResult.adminDb.collection(prospectCollectionName).doc(id);
      const existingSnap = await prospectRef.get();
      const existingData = existingSnap.exists ? existingSnap.data() || {} : {};
      const existingLogs = Array.isArray(existingData.enrollmentStageLogs)
        ? existingData.enrollmentStageLogs
        : [];
      const clickedAtIso = new Date().toISOString();

      const nextLog = {
        id: `enrollment-log-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}`,
        action,
        targetLabel,
        clickedBy: adminName,
        clickedAt: clickedAtIso,
        status: String(logMeta.status || "").trim(),
        date: String(logMeta.date || "").trim(),
        label: String(logMeta.label || targetLabel || "").trim(),
      };

      const completionRow = rows.find(
        (row) => row?.label === "Enrollments Completion Status"
      );

      let enrolledOrbiterUjbCode =
        existingData.enrolledOrbiterUjbCode || existingData.UJBCode || "";
      let orbiterConversion = null;

      if (
        completionRow?.checked &&
        completionRow?.status === "Enrollment completed"
      ) {
        if (enrolledOrbiterUjbCode) {
          orbiterConversion = {
            ujbCode: enrolledOrbiterUjbCode,
            status: "already_orbiter",
          };
        } else {
          orbiterConversion = await createOrbiterOnEnrollmentCompletion(
            dbResult.adminDb,
            {
              id,
              ...existingData,
            }
          );
          enrolledOrbiterUjbCode = orbiterConversion?.ujbCode || "";
        }

        if (!enrolledOrbiterUjbCode) {
          const missingFields = Array.isArray(orbiterConversion?.missingFields)
            ? orbiterConversion.missingFields.join(", ")
            : "";

          return NextResponse.json(
            {
              message: missingFields
                ? `Unable to create orbiter. Missing required prospect fields: ${missingFields}`
                : "Unable to create orbiter when enrollment is completed",
            },
            { status: 400 }
          );
        }
      }

      await prospectRef.set(
        {
          enrollmentStages: rows,
          enrollmentStageLogs: [...existingLogs, nextLog],
          enrolledOrbiterUjbCode,
          userType: enrolledOrbiterUjbCode
            ? "orbiter"
            : existingData.userType || "prospect",
          updatedAt: new Date(),
        },
        { merge: true }
      );

      const updatedSnap = await prospectRef.get();

      return NextResponse.json({
        success: true,
        orbiterConversion,
        prospect: {
          id: updatedSnap.id,
          ...updatedSnap.data(),
        },
      });
    }

    const validationError = validateProspectPayload(body);

    if (validationError) {
      return NextResponse.json(
        { message: validationError },
        { status: 400 }
      );
    }

    const updatePayload = {
      userType: String(body.userType).trim(),
      prospectName: String(body.prospectName).trim(),
      prospectPhone: String(body.prospectPhone).trim(),
      occupation: String(body.occupation).trim(),
      hobbies: String(body.hobbies).trim(),
      email: String(body.email).trim(),
      dob: String(body.dob).trim(),
      orbiterName: String(body.orbiterName).trim(),
      orbiterContact: String(body.orbiterContact).trim(),
      orbiterEmail: String(body.orbiterEmail || "").trim(),
      type: String(body.type).trim(),
      updatedAt: new Date(),
    };

    if (Object.prototype.hasOwnProperty.call(body, "source")) {
      updatePayload.source = String(body.source || "").trim();
    }

    await dbResult.adminDb
      .collection(prospectCollectionName)
      .doc(id)
      .update(updatePayload);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin prospect update error:", error);

    return NextResponse.json(
      { message: "Failed to update prospect" },
      { status: 500 }
    );
  }
}
