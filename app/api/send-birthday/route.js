import axios from "axios";
import { adminDb } from "@/lib/firebase/firebaseAdmin";
import { COLLECTIONS } from "@/lib/utility_collection";
import { serverEnv } from "@/lib/config/serverEnv";

/* ----------- SANITIZE TEXT FOR WHATSAPP ----------- */

function sanitizeText(text) {
  return text
    .replace(/[\n\r\t]+/g, " ")   // remove newlines/tabs
    .replace(/\s{2,}/g, " ")      // remove extra spaces
    .trim();
}

export async function POST(req) {
  try {
    const { user } = await req.json();

    if (!user || !user.phone || !user.name) {
      return Response.json(
        { error: "Invalid payload" },
        { status: 400 }
      );
    }

    const templateName = "daily_reminder";

    const { phoneNumberId, accessToken } = serverEnv.whatsapp;

    let phoneNumber = user.phone.replace(/\D/g, "");
    const originalPhone = phoneNumber;

    const name = sanitizeText(user.name);

    const imageUrl =
      user.imageUrl ||
      "https://via.placeholder.com/600x400.png?text=Happy+Birthday";

    const cleanMessage = sanitizeText(`
      Today Be Special, Connect with Love and Grow in Abundance.
      UJustBe Universe wishes you a day full of happiness and a year that brings you much success.
      Happy Birthday!!! 🥳🎂🎊🎉
    `);

    /* ---------------- SEND MESSAGE TO USER ---------------- */

    await axios.post(
      `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
      {
        messaging_product: "whatsapp",
        to: phoneNumber,
        type: "template",
        template: {
          name: templateName,
          language: { code: "en" },
          components: [
            {
              type: "header",
              parameters: [
                {
                  type: "image",
                  image: { link: imageUrl },
                },
              ],
            },
            {
              type: "body",
              parameters: [
                { type: "text", text: name },
                { type: "text", text: cleanMessage },
              ],
            },
          ],
        },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    /* ---------------- FETCH MENTOR ---------------- */

    const mentorSnap = await adminDb
      .collection(COLLECTIONS.userDetail)
      .doc(user.id)
      .get();

    if (mentorSnap.exists) {
      const mentorData = mentorSnap.data();

      const mentorName = sanitizeText(mentorData["Mentor Name"] || "Mentor");
      let mentorPhone = mentorData["Mentor Phone"];
      const gender = mentorData["Gender"]?.toLowerCase();

      if (mentorPhone) {
        mentorPhone = mentorPhone.toString().replace(/\D/g, "");

        let pronoun = "them";
        if (gender === "male") pronoun = "him";
        if (gender === "female") pronoun = "her";

        const mentorMessage = sanitizeText(
          `Today is your connect's (${name}) birthday so kindly wish ${pronoun}.`
        );

        /* ---------------- SEND MESSAGE TO MENTOR ---------------- */

        await axios.post(
          `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
          {
            messaging_product: "whatsapp",
            to: mentorPhone,
            type: "template",
            template: {
              name: templateName,
              language: { code: "en" },
              components: [
                {
                  type: "header",
                  parameters: [
                    {
                      type: "image",
                      image: { link: imageUrl },
                    },
                  ],
                },
                {
                  type: "body",
                  parameters: [
                    { type: "text", text: mentorName },
                    { type: "text", text: mentorMessage },
                  ],
                },
              ],
            },
          },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          }
        );
      }
    }

    return Response.json({
      success: true,
      message: "Birthday messages sent successfully",
    });

  } catch (error) {
    const errorDetails = error.response?.data || error.message || error;
    console.error("WhatsApp Error:", errorDetails);

    return Response.json(
      { 
        success: false,
        message: typeof errorDetails === 'string' ? errorDetails : "Failed to send WhatsApp message" 
      },
      { status: 500 }
    );
  }
}


