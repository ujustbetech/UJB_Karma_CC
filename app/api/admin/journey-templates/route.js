import { NextResponse } from "next/server";
import {
  adminDb,
  getFirebaseAdminInitError,
} from "@/lib/firebase/firebaseAdmin";
import { hasAdminAccess } from "@/lib/auth/accessControl";
import {
  ADMIN_COOKIE_NAME,
  verifyAdminSessionToken,
} from "@/lib/auth/adminSession";
import { validateAdminSessionAccess } from "@/lib/auth/adminAccessWorkflow.mjs";
import { getFallbackJourneyEmailTemplate } from "@/lib/journey/journey_email";
import { getFallbackJourneyWhatsAppTemplate } from "@/lib/journey/journey_whatsapp";

const JOURNEY_TEMPLATES_COLLECTION = "journey_templates";
const LEGACY_CHOOSE_TO_ENROLL_BODY =
  "Dear {{prospect_name}},\n\nSubject: Welcome to UJustBe Universe - Ready to Make Your Authentic Choice?\n\nWe are happy to inform you that your enrollment into UJustBe has been approved because we find you aligned with the basic contributor criteria of the UJustBe Universe.\n\nNow, we invite you to make your authentic choice:\nTo say Yes to this journey.\nTo say Yes to discovering, contributing, and growing.\nTo say Yes to being part of a community where you just be - and that is more than enough.\n\nIf this resonates with you, simply reply to this email with your confirmation as Yes. Once we receive your approval, we will share the details of the next steps in the enrollment process.";
const UPDATED_CHOOSE_TO_ENROLL_BODY =
  "Dear {{prospect_name}},\n\nSubject: Welcome to UJustBe Universe - Ready to Make Your Authentic Choice?\n\nWe are happy to inform you that your enrollment into UJustBe has been approved because we find you aligned with the basic contributor criteria of the UJustBe Universe.\n\nNow, we invite you to make your authentic choice:\nTo say Yes to this journey.\nTo say Yes to discovering, contributing, and growing.\nTo say Yes to being part of a community where you just be - and that is more than enough.\n\nPlease use the action links shared below in this email to select one of the two options:\n1) Yes to This Journey\n2) Need Some Time\n\nOnce we receive your choice, we will guide you with the next steps.";
const UPDATED_CHOOSE_TO_ENROLL_BODY_WITH_LINK_VARIABLES =
  "Dear {{prospect_name}},\n\nSubject: Welcome to UJustBe Universe - Ready to Make Your Authentic Choice?\n\nWe are happy to inform you that your enrollment into UJustBe has been approved because we find you aligned with the basic contributor criteria of the UJustBe Universe.\n\nNow, we invite you to make your authentic choice:\nTo say Yes to this journey.\nTo say Yes to discovering, contributing, and growing.\nTo say Yes to being part of a community where you just be - and that is more than enough.\n\nPlease use the action links shared below in this email to select one of the two options:\n1) Yes to This Journey: {{yes_journey_url}}\n2) Need Some Time: {{need_time_url}}\n\nOnce we receive your choice, we will guide you with the next steps.";
const FEE_MAIL_SENT_VARIANT_KEY = "enrollment_fees_mail_status_fee_mail_sent";
const UPDATED_FEE_MAIL_SENT_BODY_WITH_LINK_VARIABLES =
  "Hi {{prospect_name}},\n\nThank you for making an authentic choice in becoming an Orbiter in the UJustBe Universe.\n\nBelow are the details regarding the one-time Orbiter Enrollment Fee:\n\nOrbiter Enrollment Fee\nAmount: Rs. 1,000 (Lifetime)\n\nYou are invited to choose one of the following payment methods:\n\nDirect Payment to UJustBe's Account:\nYou can directly transfer the enrollment fee to UJustBe's account. Once your referral is closed, the reciprocation amount will be credited directly to your account registered with UJustBe.\n\nAdjustment from Referral Reciprocation:\nThe enrollment fee will be adjusted against your referral reciprocation. Once the adjustment is completed, subsequent referral reciprocation fees will be transferred to your account.\n\nNext Steps:\nPlease click one of the options below:\n\nOption 1: Pay Rs. 1000 directly to UJustBe: {{option1_url}}\nOption 2: Adjust fee from referral reciprocation: {{option2_url}}\n\nOnce we receive your confirmation, we will send you an invoice and guide you through the next steps to complete the process.\n\nIf you have any questions or need further assistance, please feel free to reach out. We look forward to your confirmation.";

const DEFAULT_JOURNEY_TEMPLATES = [
  {
    id: "meeting_logs",
    name: "Meeting Logs",
    description: "Messages sent when meetings are scheduled, rescheduled, or completed.",
    isActive: true,
    sortOrder: 1,
    channels: {
      email: getFallbackJourneyEmailTemplate("meeting_logs"),
      whatsapp: getFallbackJourneyWhatsAppTemplate("meeting_logs"),
    },
  },
  {
    id: "pre_enrollment_form",
    name: "Pre Enrollment Form",
    description: "Email template sent after the pre enrollment assessment form is saved.",
    isActive: true,
    sortOrder: 2,
    channels: {
      email: getFallbackJourneyEmailTemplate("pre_enrollment_form"),
      whatsapp: getFallbackJourneyWhatsAppTemplate("pre_enrollment_form"),
    },
  },
  {
    id: "authentic_choice",
    name: "Authentic Choice",
    description: "Status-based messages sent to the prospect after the authentic choice decision is saved.",
    isActive: true,
    sortOrder: 3,
    channels: {
      email: getFallbackJourneyEmailTemplate("authentic_choice"),
      whatsapp: getFallbackJourneyWhatsAppTemplate("authentic_choice"),
    },
  },
  {
    id: "enrollment_status",
    name: "Enrollment Status",
    description: "Stage-based enrollment status messages sent to the prospect.",
    isActive: true,
    sortOrder: 4,
    channels: {
      email: getFallbackJourneyEmailTemplate("enrollment_status"),
      whatsapp: getFallbackJourneyWhatsAppTemplate("enrollment_status"),
    },
  },
];

function getServerAccess() {
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

  return { ok: true };
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

function normalizeVariableKeys(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => String(item || "").trim()).filter(Boolean);
}

function normalizeRecipientContent(value, channelType) {
  const recipient = value && typeof value === "object" ? value : {};

  if (channelType === "email") {
    return {
      subject: String(recipient?.subject || ""),
      body: String(recipient?.body || ""),
      variableKeys: normalizeVariableKeys(recipient?.variableKeys),
    };
  }

  return {
    templateName: String(recipient?.templateName || ""),
    body: String(recipient?.body || ""),
    variableKeys: normalizeVariableKeys(recipient?.variableKeys),
  };
}

function getLegacyJourneyRecipientMode(templateId) {
  if (templateId === "meeting_logs") {
    return "duplicate";
  }

  return "prospect";
}

function normalizeRecipients(value, channelType, templateId) {
  const recipients = value?.recipients;

  if (recipients && typeof recipients === "object") {
    return {
      prospect: normalizeRecipientContent(recipients.prospect, channelType),
      orbiter: normalizeRecipientContent(recipients.orbiter, channelType),
    };
  }

  const legacyMode = getLegacyJourneyRecipientMode(templateId);
  const legacyContent = normalizeRecipientContent(value, channelType);

  if (legacyMode === "duplicate") {
    return {
      prospect: legacyContent,
      orbiter: normalizeRecipientContent(legacyContent, channelType),
    };
  }

  return {
    prospect: legacyContent,
    orbiter: normalizeRecipientContent(null, channelType),
  };
}

function normalizeChannelVariants(value, channelType, templateId) {
  const variants = value && typeof value === "object" ? value : {};

  return Object.fromEntries(
    Object.entries(variants).map(([key, variant]) => [
      key,
      {
        recipients: normalizeRecipients(variant, channelType, templateId),
      },
    ])
  );
}

function normalizeTemplate(snapshot) {
  const data = snapshot.data() || {};

  return {
    id: snapshot.id,
    name: String(data.name || "").trim(),
    description: String(data.description || "").trim(),
    isActive: data.isActive !== false,
    sortOrder: Number.isFinite(data.sortOrder) ? data.sortOrder : 999,
    channels: {
      email: {
        enabled: data?.channels?.email?.enabled !== false,
        provider: String(data?.channels?.email?.provider || "emailjs"),
        serviceId: String(data?.channels?.email?.serviceId || ""),
        templateId: String(data?.channels?.email?.templateId || ""),
        publicKey: String(data?.channels?.email?.publicKey || ""),
        variants: normalizeChannelVariants(
          data?.channels?.email?.variants,
          "email",
          snapshot.id
        ),
      },
      whatsapp: {
        enabled: data?.channels?.whatsapp?.enabled !== false,
        variants: normalizeChannelVariants(
          data?.channels?.whatsapp?.variants,
          "whatsapp",
          snapshot.id
        ),
      },
    },
    updatedAt: data.updatedAt || null,
    updatedBy: data.updatedBy || null,
  };
}

async function ensureDefaultTemplatesIfMissing(admin) {
  const collectionRef = adminDb.collection(JOURNEY_TEMPLATES_COLLECTION);
  const batch = adminDb.batch();
  let hasMissingTemplate = false;

  for (const template of DEFAULT_JOURNEY_TEMPLATES) {
    const docRef = collectionRef.doc(template.id);
    const docSnap = await docRef.get();

    if (docSnap.exists) {
      continue;
    }

    hasMissingTemplate = true;
    batch.set(docRef, {
      ...template,
      createdAt: new Date(),
      updatedAt: new Date(),
      updatedBy: {
        name: String(admin?.name || "").trim(),
        email: String(admin?.email || "").trim(),
      },
    });
  }

  if (hasMissingTemplate) {
    await batch.commit();
  }

  const authenticChoiceRef = collectionRef.doc("authentic_choice");
  const authenticChoiceSnap = await authenticChoiceRef.get();
  if (!authenticChoiceSnap.exists) {
    return;
  }

  const authenticChoiceData = authenticChoiceSnap.data() || {};
  const currentBody = String(
    authenticChoiceData?.channels?.email?.variants?.choose_to_enroll?.recipients
      ?.prospect?.body || ""
  );

  if (
    currentBody === LEGACY_CHOOSE_TO_ENROLL_BODY ||
    currentBody === UPDATED_CHOOSE_TO_ENROLL_BODY
  ) {
    await authenticChoiceRef.set(
      {
        channels: {
          email: {
            variants: {
              choose_to_enroll: {
                recipients: {
                  prospect: {
                    body: UPDATED_CHOOSE_TO_ENROLL_BODY_WITH_LINK_VARIABLES,
                    variableKeys: [
                      "prospect_name",
                      "yes_journey_url",
                      "need_time_url",
                    ],
                  },
                },
              },
            },
          },
        },
        updatedAt: new Date(),
        updatedBy: {
          name: String(admin?.name || "").trim(),
          email: String(admin?.email || "").trim(),
        },
      },
      { merge: true }
    );
  }

  const enrollmentStatusRef = collectionRef.doc("enrollment_status");
  const enrollmentStatusSnap = await enrollmentStatusRef.get();
  if (!enrollmentStatusSnap.exists) {
    return;
  }

  const enrollmentStatusData = enrollmentStatusSnap.data() || {};
  const currentFeeMailBody = String(
    enrollmentStatusData?.channels?.email?.variants?.[FEE_MAIL_SENT_VARIANT_KEY]
      ?.recipients?.prospect?.body || ""
  );

  const shouldUpgradeFeeMailBody =
    currentFeeMailBody &&
    currentFeeMailBody.includes("Option 1:") &&
    currentFeeMailBody.includes("Option 2:") &&
    !currentFeeMailBody.includes("{{option1_url}}") &&
    !currentFeeMailBody.includes("{{option2_url}}");

  if (shouldUpgradeFeeMailBody) {
    await enrollmentStatusRef.set(
      {
        channels: {
          email: {
            variants: {
              [FEE_MAIL_SENT_VARIANT_KEY]: {
                recipients: {
                  prospect: {
                    body: UPDATED_FEE_MAIL_SENT_BODY_WITH_LINK_VARIABLES,
                    variableKeys: [
                      "prospect_name",
                      "option1_url",
                      "option2_url",
                    ],
                  },
                },
              },
            },
          },
        },
        updatedAt: new Date(),
        updatedBy: {
          name: String(admin?.name || "").trim(),
          email: String(admin?.email || "").trim(),
        },
      },
      { merge: true }
    );
  }
}

function validateTemplatePayload(body) {
  const id = String(body?.id || "").trim();
  const name = String(body?.name || "").trim();
  const description = String(body?.description || "").trim();
  const email = body?.channels?.email || {};
  const whatsapp = body?.channels?.whatsapp || {};
  const emailVariants = normalizeChannelVariants(email.variants, "email", id);
  const whatsappVariants = normalizeChannelVariants(
    whatsapp.variants,
    "whatsapp",
    id
  );
  const hasEmailRecipientContent = Object.values(emailVariants).some((variant) =>
    Object.values(variant?.recipients || {}).some((recipient) =>
      String(recipient?.body || "").trim()
    )
  );

  if (!id) return "Template id is required";
  if (!name) return "Template name is required";
  if (!description) return "Template description is required";
  if (!String(email.serviceId || "").trim()) return "Email service id is required";
  if (!String(email.templateId || "").trim()) return "Email template id is required";
  if (!String(email.publicKey || "").trim()) return "Email public key is required";
  if (!Object.keys(emailVariants).length) return "Email variants are required";
  if (!hasEmailRecipientContent) return "At least one email body is required";

  return null;
}

export async function GET(req) {
  try {
    const serverAccess = getServerAccess();
    if (!serverAccess.ok) return serverAccess.response;

    const authResult = validateAdminRequest(req);
    if (!authResult.ok) return authResult.response;

    await ensureDefaultTemplatesIfMissing(authResult.admin);

    const templateId = String(req.nextUrl.searchParams.get("id") || "").trim();
    const snapshot = await adminDb.collection(JOURNEY_TEMPLATES_COLLECTION).get();
    const templates = snapshot.docs
      .map(normalizeTemplate)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));

    if (templateId) {
      const template = templates.find((item) => item.id === templateId);
      if (!template) {
        return NextResponse.json({ message: "Template not found" }, { status: 404 });
      }
      return NextResponse.json({ template });
    }

    return NextResponse.json({ templates });
  } catch (error) {
    console.error("Journey templates fetch error:", error);
    return NextResponse.json(
      { message: "Failed to load journey templates" },
      { status: 500 }
    );
  }
}

export async function PUT(req) {
  try {
    const serverAccess = getServerAccess();
    if (!serverAccess.ok) return serverAccess.response;

    const authResult = validateAdminRequest(req);
    if (!authResult.ok) return authResult.response;

    const body = await req.json();
    const validationError = validateTemplatePayload(body);
    if (validationError) {
      return NextResponse.json({ message: validationError }, { status: 400 });
    }

    const templateId = String(body.id).trim();
    const currentRef = adminDb.collection(JOURNEY_TEMPLATES_COLLECTION).doc(templateId);
    const currentSnapshot = await currentRef.get();

    if (!currentSnapshot.exists) {
      return NextResponse.json({ message: "Template not found" }, { status: 404 });
    }

    const existingData = currentSnapshot.data() || {};
    const payload = {
      id: templateId,
      name: String(body.name).trim(),
      description: String(body.description).trim(),
      isActive: body.isActive !== false,
      sortOrder: Number.isFinite(body.sortOrder)
        ? body.sortOrder
        : Number.isFinite(existingData.sortOrder)
          ? existingData.sortOrder
          : 999,
      channels: {
        email: {
          enabled: body?.channels?.email?.enabled !== false,
          provider: String(body?.channels?.email?.provider || "emailjs"),
          serviceId: String(body?.channels?.email?.serviceId || ""),
          templateId: String(body?.channels?.email?.templateId || ""),
          publicKey: String(body?.channels?.email?.publicKey || ""),
          variants: normalizeChannelVariants(
            body?.channels?.email?.variants,
            "email",
            templateId
          ),
        },
        whatsapp: {
          enabled: body?.channels?.whatsapp?.enabled !== false,
          variants: normalizeChannelVariants(
            body?.channels?.whatsapp?.variants,
            "whatsapp",
            templateId
          ),
        },
      },
      updatedAt: new Date(),
      updatedBy: {
        name: String(authResult.admin?.name || "").trim(),
        email: String(authResult.admin?.email || "").trim(),
      },
    };

    await currentRef.set(payload, { merge: true });

    return NextResponse.json({
      success: true,
      template: normalizeTemplate(await currentRef.get()),
    });
  } catch (error) {
    console.error("Journey templates update error:", error);
    return NextResponse.json(
      { message: "Failed to update journey template" },
      { status: 500 }
    );
  }
}


