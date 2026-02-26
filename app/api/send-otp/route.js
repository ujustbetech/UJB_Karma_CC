import { NextResponse } from "next/server";
import { db } from "@/firebaseConfig";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    const { phone } = await req.json();
    const mobile = phone?.toString().trim();

    if (!mobile || mobile.length !== 10) {
      return NextResponse.json(
        { success: false, message: "Invalid phone number" },
        { status: 400 }
      );
    }

    // 🔍 Check if user exists
    const q = query(
      collection(db, "usersdetail"),
      where("MobileNo", "==", mobile)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return NextResponse.json(
        { success: false, message: "This number is not registered." },
        { status: 404 }
      );
    }

    // 🔐 Generate OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const expiry = Date.now() + 5 * 60 * 1000; // 5 minutes

    // 🔒 Hash OTP before storing
    const hashedOtp = await bcrypt.hash(otp, 10);

    // 💾 Store hashed OTP
    await setDoc(doc(db, "otp_verifications", mobile), {
      otp: hashedOtp,
      expiry,
      createdAt: serverTimestamp(),
      attempts: 0,
    });

    // 📲 SEND WHATSAPP MESSAGE
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: `91${mobile}`, // India country code
          type: "template",
          template: {
            name: "code", // Your approved template name
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

    console.log("WhatsApp Response:", whatsappResult);

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message:
            whatsappResult.error?.message || "WhatsApp message failed",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "OTP sent successfully",
    });

  } catch (error) {
    console.error("Send OTP Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}