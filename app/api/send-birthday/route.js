import axios from "axios";

export async function POST(req) {
  try {
    const { user } = await req.json();

    if (!user?.phone || !user?.name) {
      return new Response("Invalid payload", { status: 400 });
    }

    const phone = user.phone.replace(/\D/g, "");

    await axios.post(
      `https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to: phone,
        type: "template",
        template: {
          name: "birthday_wish", // 👈 YOUR APPROVED TEMPLATE NAME
          language: { code: "en" },
          components: [
            {
              type: "header",
              parameters: [
                {
                  type: "image",
                  image: {
                    link: user.imageUrl || "https://via.placeholder.com/600",
                  },
                },
              ],
            },
            {
              type: "body",
              parameters: [
                { type: "text", text: user.name },
              ],
            },
          ],
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    return Response.json({ success: true });
  } catch (error) {
    console.error("WhatsApp Error:", error?.response?.data || error);
    return new Response("Failed to send message", { status: 500 });
  }
}
