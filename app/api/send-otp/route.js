import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/firebaseAdmin";
import bcrypt from "bcryptjs";
import { serverEnv } from "@/lib/config/serverEnv";

export async function POST(req) {
  try {
    const { phone } = await req.json();
    const mobile = phone?.toString().trim();

    console.log("📲 Incoming OTP request for:", mobile);

    // ❌ Validate phone
    if (!mobile || mobile.length !== 10) {
      return NextResponse.json(
        { success: false, message: "Invalid phone number" },
        { status: 400 }
      );
    }

    // 🔍 Check if user exists
    const snapshot = await adminDb
      .collection("usersdetail")
      .where("MobileNo", "==", mobile)
      .get();

    if (snapshot.empty) {
      console.log("❌ User not found:", mobile);

      return NextResponse.json(
        { success: false, message: "This number is not registered." },
        { status: 404 }
      );
    }

    // 🔐 Generate OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const expiry = Date.now() + 5 * 60 * 1000;

    console.log("🔑 Generated OTP:", otp); // 👈 DEV DEBUG

    // 🔒 Hash OTP
    const hashedOtp = await bcrypt.hash(otp, 10);

    // 💾 Store OTP
    await adminDb.collection("otp_verifications").doc(mobile).set({
      otp: hashedOtp,
      expiry,
      createdAt: Date.now(),
      attempts: 0,
    });

    // ===============================
    // 📲 WHATSAPP SEND (SAFE MODE)
    // ===============================

    try {
      if (
        !serverEnv.whatsapp.phoneNumberId ||
        !serverEnv.whatsapp.accessToken
      ) {
        console.warn("⚠️ WhatsApp config missing → Skipping send");
      } else {
        console.log("📤 Sending WhatsApp OTP...");

        const response = await fetch(
          `https://graph.facebook.com/v18.0/${serverEnv.whatsapp.phoneNumberId}/messages`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${serverEnv.whatsapp.accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              messaging_product: "whatsapp",
              to: `91${mobile}`,
              type: "template",
              template: {
                name: "code", // ⚠️ must be approved template
                language: { code: "en" },
                components: [
                  {
                    type: "body",
                    parameters: [{ type: "text", text: otp }],
                  },
                ],
              },
            }),
          }
        );

        const whatsappResult = await response.json();

        console.log("📩 WhatsApp Response:", whatsappResult);

        if (!response.ok) {
          console.error("❌ WhatsApp Error:", whatsappResult);

          return NextResponse.json(
            {
              success: false,
              message:
                whatsappResult.error?.message ||
                "WhatsApp message failed",
            },
            { status: 500 }
          );
        }
      }
    } catch (waError) {
      console.error("❌ WhatsApp Exception:", waError);

      // ✅ Don't block login flow if WhatsApp fails
      console.log("⚠️ Continuing without WhatsApp...");
    }

    // ✅ Success response
    return NextResponse.json({
      success: true,
      message: "OTP generated successfully",
      devOtp: process.env.NODE_ENV !== "production" ? otp : undefined, // 👈 helpful
    });

  } catch (error) {
    console.error("🔥 Send OTP Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}