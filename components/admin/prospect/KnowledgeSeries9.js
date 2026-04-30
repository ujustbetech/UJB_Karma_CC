import React, { useState, useEffect } from "react";
import { doc, updateDoc, getDoc, db } from "@/services/adminProspectJourneyFirebaseService";
import { COLLECTIONS } from "@/lib/utility_collection";
import emailjs from "@emailjs/browser";
import Swal from "sweetalert2";
import { sendWhatsAppTextRequest } from "@/utils/whatsappClient";


const KnowledgeSeries = ({ id, fetchData }) => {
  const [loading, setLoading] = useState(false);
  const [knowledgeSeries, setKnowledgeSeries] = useState(null);

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

    try {
      await sendWhatsAppTextRequest({
        phone,
        text: bodyText,
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
  <div className="max-w-3xl mx-auto p-6">

    <div className="bg-white border rounded-xl shadow-sm p-6">

      <h2 className="text-xl font-semibold mb-4">
        Knowledge Series 9
      </h2>

      {knowledgeSeries?.sent ? (
        <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg mb-4">
          ✅ Knowledge Series 9 Sent on {knowledgeSeries.sentAt}
        </div>
      ) : (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4">
          ❌ Knowledge Series 9 Not Sent
        </div>
      )}

      <button
        onClick={handleSendKnowledgeSeries}
        disabled={loading || knowledgeSeries?.sent}
        className={`px-5 py-2 rounded-lg text-white transition ${
          loading || knowledgeSeries?.sent
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-black hover:bg-gray-800"
        }`}
      >
        {loading ? "Sending..." : "Send Knowledge Series 9"}
      </button>

    </div>

  </div>
);
};

export default KnowledgeSeries;



