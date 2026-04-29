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
import { getFallbackOnboardingEmailTemplate } from "@/lib/onboarding/onboarding_email";
import { getFallbackOnboardingWhatsAppTemplate } from "@/lib/onboarding/onboarding_whatsapp";

const ONBOARDING_TEMPLATES_COLLECTION = "onboarding_templates";

const DEFAULT_ONBOARDING_TEMPLATES = [
  {
    id: "prospect_assessment_request",
    name: "Prospect Assessment Request",
    description:
      "Sent from the admin prospect add flow to the selected MentOrbiter.",
    isActive: true,
    sortOrder: 1,
    channels: {
      email: getFallbackOnboardingEmailTemplate("prospect_assessment_request"),
      whatsapp: getFallbackOnboardingWhatsAppTemplate(
        "prospect_assessment_request"
      ),
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

  return value
    .map((item) => String(item || "").trim())
    .filter(Boolean);
}

function normalizeRecipientContent(value, channelType) {
  const recipient = value && typeof value === "object" ? value : {};

  if (channelType === "email") {
    return {
      subject: String(recipient.subject || ""),
      body: String(recipient.body || ""),
      variableKeys: normalizeVariableKeys(recipient.variableKeys),
    };
  }

  return {
    templateName: String(recipient.templateName || ""),
    body: String(recipient.body || ""),
    variableKeys: normalizeVariableKeys(recipient.variableKeys),
  };
}

function getDefaultRecipientForOnboardingTemplate(templateId) {
  if (templateId === "prospect_assessment_request") {
    return "orbiter";
  }

  return "prospect";
}

function normalizeRecipients(channel, channelType, templateId) {
  const recipients = channel?.recipients;

  if (recipients && typeof recipients === "object") {
    return {
      prospect: normalizeRecipientContent(recipients.prospect, channelType),
      orbiter: normalizeRecipientContent(recipients.orbiter, channelType),
    };
  }

  const legacyRecipient =
    getDefaultRecipientForOnboardingTemplate(templateId);
  const legacyContent = normalizeRecipientContent(channel, channelType);

  return {
    prospect:
      legacyRecipient === "prospect"
        ? legacyContent
        : normalizeRecipientContent(null, channelType),
    orbiter:
      legacyRecipient === "orbiter"
        ? legacyContent
        : normalizeRecipientContent(null, channelType),
  };
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
        recipients: normalizeRecipients(
          data?.channels?.email,
          "email",
          snapshot.id
        ),
      },
      whatsapp: {
        enabled: data?.channels?.whatsapp?.enabled !== false,
        recipients: normalizeRecipients(
          data?.channels?.whatsapp,
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
  const collectionRef = adminDb.collection(ONBOARDING_TEMPLATES_COLLECTION);
  const batch = adminDb.batch();
  let hasMissingTemplate = false;

  for (const template of DEFAULT_ONBOARDING_TEMPLATES) {
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
  const emailServiceId = String(body?.channels?.email?.serviceId || "").trim();
  const emailTemplateId = String(body?.channels?.email?.templateId || "").trim();
  const emailPublicKey = String(body?.channels?.email?.publicKey || "").trim();
  const emailRecipients = normalizeRecipients(body?.channels?.email, "email", id);
  const whatsappRecipients = normalizeRecipients(
    body?.channels?.whatsapp,
    "whatsapp",
    id
  );
  const hasEmailBody = Object.values(emailRecipients).some((recipient) =>
    String(recipient?.body || "").trim()
  );
  const hasEmailVariableKeys = Object.values(emailRecipients).some(
    (recipient) => Array.isArray(recipient?.variableKeys) && recipient.variableKeys.length
  );
  const hasWhatsappTemplateName = Object.values(whatsappRecipients).some(
    (recipient) => String(recipient?.templateName || "").trim()
  );
  const hasWhatsappVariableKeys = Object.values(whatsappRecipients).some(
    (recipient) => Array.isArray(recipient?.variableKeys) && recipient.variableKeys.length
  );

  if (!id) return "Template id is required";
  if (!name) return "Template name is required";
  if (!description) return "Template description is required";
  if (!hasEmailBody) return "At least one email body is required";
  if (!emailServiceId) return "Email service id is required";
  if (!emailTemplateId) return "Email template id is required";
  if (!emailPublicKey) return "Email public key is required";
  if (!hasWhatsappTemplateName) return "At least one WhatsApp template name is required";
  if (!hasEmailVariableKeys) return "At least one email variable key is required";
  if (!hasWhatsappVariableKeys) return "At least one WhatsApp variable key is required";

  return null;
}

export async function GET(req) {
  try {
    const serverAccess = getServerAccess();

    if (!serverAccess.ok) {
      return serverAccess.response;
    }

    const authResult = validateAdminRequest(req);

    if (!authResult.ok) {
      return authResult.response;
    }

    await ensureDefaultTemplatesIfMissing(authResult.admin);

    const templateId = String(req.nextUrl.searchParams.get("id") || "").trim();
    const snapshot = await adminDb.collection(ONBOARDING_TEMPLATES_COLLECTION).get();
    const templates = snapshot.docs
      .map(normalizeTemplate)
      .sort((a, b) => {
        if (a.sortOrder !== b.sortOrder) {
          return a.sortOrder - b.sortOrder;
        }

        return a.name.localeCompare(b.name);
      });

    if (templateId) {
      const template = templates.find((item) => item.id === templateId);

      if (!template) {
        return NextResponse.json(
          { message: "Template not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({ template });
    }

    return NextResponse.json({ templates });
  } catch (error) {
    console.error("Onboarding templates fetch error:", error);

    return NextResponse.json(
      { message: "Failed to load onboarding templates" },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  try {
    const serverAccess = getServerAccess();

    if (!serverAccess.ok) {
      return serverAccess.response;
    }

    const authResult = validateAdminRequest(req);

    if (!authResult.ok) {
      return authResult.response;
    }

    const snapshot = await adminDb.collection(ONBOARDING_TEMPLATES_COLLECTION).get();

    if (snapshot.empty) {
      return NextResponse.json({ success: true, deletedCount: 0 });
    }

    const batch = adminDb.batch();

    snapshot.docs.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });

    await batch.commit();

    return NextResponse.json({
      success: true,
      deletedCount: snapshot.size,
    });
  } catch (error) {
    console.error("Onboarding templates delete error:", error);

    return NextResponse.json(
      { message: "Failed to delete onboarding templates" },
      { status: 500 }
    );
  }
}

export async function PUT(req) {
  try {
    const serverAccess = getServerAccess();

    if (!serverAccess.ok) {
      return serverAccess.response;
    }

    const authResult = validateAdminRequest(req);

    if (!authResult.ok) {
      return authResult.response;
    }

    const body = await req.json();
    const validationError = validateTemplatePayload(body);

    if (validationError) {
      return NextResponse.json(
        { message: validationError },
        { status: 400 }
      );
    }

    const templateId = String(body.id).trim();
    const currentRef = adminDb.collection(ONBOARDING_TEMPLATES_COLLECTION).doc(templateId);
    const currentSnapshot = await currentRef.get();

    if (!currentSnapshot.exists) {
      return NextResponse.json(
        { message: "Template not found" },
        { status: 404 }
      );
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
          provider: String(
            body?.channels?.email?.provider ||
              existingData?.channels?.email?.provider ||
              "emailjs"
          ),
          serviceId: String(body?.channels?.email?.serviceId || ""),
          templateId: String(body?.channels?.email?.templateId || ""),
          publicKey: String(body?.channels?.email?.publicKey || ""),
          recipients: normalizeRecipients(
            body?.channels?.email,
            "email",
            templateId
          ),
        },
        whatsapp: {
          enabled: body?.channels?.whatsapp?.enabled !== false,
          recipients: normalizeRecipients(
            body?.channels?.whatsapp,
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
    console.error("Onboarding templates update error:", error);

    return NextResponse.json(
      { message: "Failed to update onboarding template" },
      { status: 500 }
    );
  }
}


