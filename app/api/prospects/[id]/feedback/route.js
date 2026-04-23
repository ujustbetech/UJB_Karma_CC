import { NextResponse } from "next/server";
import {
  adminDb,
  getFirebaseAdminInitError,
} from "@/lib/firebase/firebaseAdmin";
import { publicEnv } from "@/lib/config/publicEnv";
import { serverEnv } from "@/lib/config/serverEnv";

const prospectCollectionName = publicEnv.collections.prospect;
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

function validateFeedbackPayload(payload) {
  const errors = {};
  const interestAreas = Array.isArray(payload.interestAreas)
    ? payload.interestAreas
    : [];
  const communicationOptions = Array.isArray(payload.communicationOptions)
    ? payload.communicationOptions
    : [];

  if (!String(payload.fullName || "").trim()) {
    errors.fullName = "Prospect name is required.";
  }

  if (!PHONE_REGEX.test(String(payload.phoneNumber || "").replace(/\s/g, ""))) {
    errors.phoneNumber = "Enter a valid Indian mobile number.";
  }

  if (!EMAIL_REGEX.test(String(payload.email || "").trim())) {
    errors.email = "Enter a valid email address.";
  }

  if (!String(payload.mentorName || "").trim()) {
    errors.mentorName = "Orbiter name is required.";
  }

  if (!String(payload.understandingLevel || "").trim()) {
    errors.understandingLevel = "Please select understanding of UJustBe.";
  }

  if (!String(payload.selfGrowthUnderstanding || "").trim()) {
    errors.selfGrowthUnderstanding = "Please select self growth clarity.";
  }

  if (!String(payload.joinInterest || "").trim()) {
    errors.joinInterest = "Please select interest in joining.";
  }

  if (interestAreas.length === 0) {
    errors.interestAreas = "Select at least one interest area.";
  }

  if (communicationOptions.length === 0) {
    errors.communicationOptions = "Select at least one preferred communication option.";
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

    const feedbackSnap = await dbResult.adminDb
      .collection(prospectCollectionName)
      .doc(id)
      .collection("prospectfeedbackform")
      .limit(1)
      .get();

    return NextResponse.json({
      prospect: {
        id: prospectSnap.id,
        ...prospectSnap.data(),
      },
      feedback: feedbackSnap.empty
        ? null
        : {
            id: feedbackSnap.docs[0].id,
            ...feedbackSnap.docs[0].data(),
          },
      isSubmitted: !feedbackSnap.empty,
    });
  } catch (error) {
    console.error("Prospect feedback fetch error:", error);

    return NextResponse.json(
      { message: "Failed to fetch prospect feedback form" },
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

    const payload = await req.json();
    const errors = validateFeedbackPayload(payload);

    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        {
          message: "Please correct the highlighted fields.",
          errors,
        },
        { status: 400 }
      );
    }

    const feedbackCollectionRef = dbResult.adminDb
      .collection(prospectCollectionName)
      .doc(id)
      .collection("prospectfeedbackform");

    const existing = await feedbackCollectionRef.limit(1).get();

    if (!existing.empty) {
      return NextResponse.json(
        { message: "Feedback form already submitted", isSubmitted: true },
        { status: 409 }
      );
    }

    const normalizedPayload = {
      ...payload,
      fullName: String(payload.fullName || "").trim(),
      phoneNumber: normalizePhone(payload.phoneNumber),
      email: String(payload.email || "").trim(),
      mentorName: String(payload.mentorName || "").trim(),
      understandingLevel: String(payload.understandingLevel || "").trim(),
      selfGrowthUnderstanding: String(payload.selfGrowthUnderstanding || "").trim(),
      joinInterest: String(payload.joinInterest || "").trim(),
      interestAreas: Array.isArray(payload.interestAreas)
        ? payload.interestAreas
        : [],
      communicationOptions: Array.isArray(payload.communicationOptions)
        ? payload.communicationOptions
        : [],
      additionalComments: String(payload.additionalComments || "").trim(),
      submittedAt: new Date().toISOString(),
    };

    await feedbackCollectionRef.add(normalizedPayload);

    return NextResponse.json({ success: true, isSubmitted: true });
  } catch (error) {
    console.error("Prospect feedback submit error:", error);

    return NextResponse.json(
      { message: "Failed to submit prospect feedback form" },
      { status: 500 }
    );
  }
}
