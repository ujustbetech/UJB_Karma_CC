import React, { useState, useEffect } from "react";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/firebaseConfig";
import { COLLECTIONS } from "@/lib/utility_collection";
import emailjs from "@emailjs/browser";
import axios from "axios";
import Swal from "sweetalert2";


const KnowledgeSeries = ({ id, fetchData }) => {
  const [loading, setLoading] = useState(false);
  const [knowledgeSeries, setKnowledgeSeries] = useState(null);

  const WHATSAPP_API_URL =
    "https://graph.facebook.com/v22.0/527476310441806/messages";
  const WHATSAPP_API_TOKEN =
    "Bearer EAAHwbR1fvgsBOwUInBvR1SGmVLSZCpDZAkn9aZCDJYaT0h5cwyiLyIq7BnKmXAgNs0ZCC8C33UzhGWTlwhUarfbcVoBdkc1bhuxZBXvroCHiXNwZCZBVxXlZBdinVoVnTB7IC1OYS4lhNEQprXm5l0XZAICVYISvkfwTEju6kV4Aqzt4lPpN8D3FD7eIWXDhnA4SG6QZDZD";

  // 🔹 Load knowledgeSeries9 data if already sent
  useEffect(() => {
    const fetchSeries = async () => {
      const docRef = doc(db, "Prospects", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setKnowledgeSeries(docSnap.data().knowledgeSeries9 || null);
      }
    };
    fetchSeries();
  }, [id]);

  // 🔹 Send Email
  const sendKnowledgeSeriesEmail = async (prospectName, prospectEmail, orbiterName) => {
    const body = `
      Dear ${prospectName},

      📘 Knowledge Series - Episode 5: The Nucleus Team

      Soumya: Is there a leadership team managing all this?  

      Aarav: Absolutely! The Nucleus Team is the core of UJustBe. They mentor other Orbiters, drive the community’s growth, and expand its reach.  

      Soumya: That must require a lot of commitment.  

      Aarav: It does, but they’re aligned with UJustBe’s vision to live into the world of “happy faces”.

      Warm Regards,  
      ${orbiterName}
    `;

    const templateParams = {
      prospect_name: prospectName,
      to_email: prospectEmail,
      body,
      orbiter_name: orbiterName,
    };

    try {
      await emailjs.send(
        "service_acyimrs",
        "template_cdm3n5x",
        templateParams,
        "w7YI9DEqR9sdiWX9h"
      );
      console.log("📧 Knowledge Series 9 Email sent.");
      return true;
    } catch (error) {
      console.error("❌ Failed to send email:", error);
      return false;
    }
  };

  // 🔹 Send WhatsApp
  const sendKnowledgeSeriesMessage = async (orbiterName, prospectName, phone) => {
    const bodyText = `Hi ${prospectName},\n\n📘 Knowledge Series - Episode 5: The Nucleus Team\n\nSoumya: Is there a leadership team managing all this?\n\nAarav: Absolutely! The Nucleus Team is the core of UJustBe. They mentor other Orbiters, drive the community’s growth, and expand its reach.\n\nSoumya: That must require a lot of commitment.\n\nAarav: It does, but they’re aligned with UJustBe’s vision to live into the world of “happy faces”.\n\nRegards,\n${orbiterName}`;

    const payload = {
      messaging_product: "whatsapp",
      to: `91${phone}`,
      type: "text",
      text: { body: bodyText },
    };

    try {
      await axios.post(WHATSAPP_API_URL, payload, {
        headers: {
          Authorization: WHATSAPP_API_TOKEN,
          "Content-Type": "application/json",
        },
      });
      console.log(`✅ WhatsApp Knowledge Series 9 sent to ${prospectName}`);
      return true;
    } catch (error) {
      console.error(
        `❌ Failed to send WhatsApp to ${prospectName}`,
        error.response?.data || error.message
      );
      return false;
    }
  };

  // 🔹 Handle Send Button
  const handleSendKnowledgeSeries = async () => {
    setLoading(true);
    try {
      const docRef = doc(db, "Prospects", id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const prospectEmail = data.email;
        const prospectPhone = data.prospectPhone;
        const prospectName = data.prospectName;
        const orbiterName = data.orbiterName;

        // Send Email + WhatsApp
        const emailSent = await sendKnowledgeSeriesEmail(
          prospectName,
          prospectEmail,
          orbiterName
        );
        const wpSent = await sendKnowledgeSeriesMessage(
          orbiterName,
          prospectName,
          prospectPhone
        );

        if (emailSent || wpSent) {
          const timestamp = new Date().toLocaleString("en-IN", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });

          const knowledgeData = {
            sent: true,
            sentAt: timestamp,
          };

          await updateDoc(docRef, { knowledgeSeries9: knowledgeData });
          setKnowledgeSeries(knowledgeData);

          Swal.fire("✅ Sent!", "Knowledge Series 9 sent successfully.", "success");
          fetchData?.();
        } else {
          Swal.fire("❌ Error", "Failed to send Knowledge Series 9.", "error");
        }
      }
    } catch (error) {
      console.error("❌ Error sending Knowledge Series 9:", error);
      Swal.fire("❌ Error", "Something went wrong.", "error");
    }
    setLoading(false);
  };

  return (
    <div>
      <h2 className="form-title">Knowledge Series 9</h2>
      {knowledgeSeries?.sent ? (
        <p style={{ color: "green" }}>
          ✅ Knowledge Series 9 Sent on {knowledgeSeries.sentAt}
        </p>
      ) : (
        <p style={{ color: "red" }}>❌ Knowledge Series 9 Not Sent</p>
      )}

      <button
        className="m-button-7"
        onClick={handleSendKnowledgeSeries}
        disabled={loading || knowledgeSeries?.sent}
      >
        {loading ? "Sending..." : "Send Knowledge Series 9"}
      </button>
    </div>
  );
};

export default KnowledgeSeries;
