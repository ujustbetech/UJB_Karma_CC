import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { phone, name, message } = await req.json();

    if (!phone || !message) {
      return NextResponse.json(
        { error: "Missing phone or message" },
        { status: 400 }
      );
    }

    const formatted = String(phone).replace(/\D/g, "");

    const payload = {
      messaging_product: "whatsapp",
      to: formatted,
      type: "template",
      template: {
        name: "referral_module",
        language: { code: "en" },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: name || "User" },
              { type: "text", text: message },
            ],
          },
        ],
      },
    };

    const res = await fetch(
      `https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(data, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("API ERROR:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}