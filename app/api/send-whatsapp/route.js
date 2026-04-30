import { NextResponse } from "next/server";
import {
  sendWhatsAppTemplate,
  sendWhatsAppText,
} from "@/lib/server/whatsapp";

export async function POST(req) {
  try {
    const {
      phone,
      name,
      message,
      templateName,
      parameters,
      text,
    } = await req.json();

    if (!phone) {
      return NextResponse.json(
        { error: "Missing phone number" },
        { status: 400 }
      );
    }

    if (text) {
      await sendWhatsAppText({ phone, text });
      return NextResponse.json({ success: true });
    }

    const finalParameters =
      Array.isArray(parameters) && parameters.length
        ? parameters
        : [name || "User", message];

    if (!finalParameters.every((value) => value != null && value !== "")) {
      return NextResponse.json(
        { error: "Missing WhatsApp template parameters" },
        { status: 400 }
      );
    }

    await sendWhatsAppTemplate({
      phone,
      templateName: templateName || "referral_module",
      parameters: finalParameters,
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("API ERROR:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}


