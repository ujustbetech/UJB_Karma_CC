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


