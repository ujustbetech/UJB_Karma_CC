import React, { useState, useEffect } from "react";
import { doc, updateDoc, getDoc, db } from "@/services/adminProspectJourneyFirebaseService";
import emailjs from "@emailjs/browser";
import { COLLECTIONS } from "@/lib/utility_collection";
import Swal from "sweetalert2";
import { sendWhatsAppTextRequest } from "@/utils/whatsappClient";


const KnowledgeSeries5 = ({ id, fetchData }) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("morning");
  const [morningData, setMorningData] = useState(null);
  const [eveningData, setEveningData] = useState(null);

  // 🔹 Load saved data
  useEffect(() => {
    const fetchSeries = async () => {
      const docRef = doc(db, "Prospects", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setMorningData(docSnap.data().knowledgeSeries5_morning || null);
        setEveningData(docSnap.data().knowledgeSeries5_evening || null);
      }
    };
    fetchSeries();
  }, [id]);

  // 🔹 Message Content
  const getContent = (tab) => {
    if (tab === "morning") {
      return {
        subject: "📘 Knowledge Series - Episode 3: Understanding CosmOrbiters",
        body: `Soumya: What about CosmOrbiters? I’ve heard this term mentioned.\n\nAarav: CosmOrbiters are business owners who have listed their businesses within the UJustBe Universe. They assess referrals, deliver services with integrity, and reciprocate Orbiters for successful referrals.\n\nSoumya: So they’re responsible for maintaining fairness and quality?\n\nAarav: Exactly! They treat Orbiters as brand ambassadors and ensure positive outcomes for everyone involved.`,
      };
    }
    return {
      subject: "📘 Knowledge Series - Episode 4: Meet the MentOrbiters",
      body: `Soumya: Who are MentOrbiters, then?\n\nAarav: MentOrbiters are mentors within UJustBe. They identify potential contributors, enrol them to the UJustBe Universe, and guide their growth.\n\nSoumya: Sounds like they play a big role in UJustBe Universe.\n\nAarav: They do! MentOrbiters ensure new members align with UJustBe’s vision and values.`,
    };
  };

  // 🔹 Send Email
  const sendEmail = async (prospectName, prospectEmail, orbiterName, tab) => {
    const content = getContent(tab);
    const body = `
      Dear ${prospectName},

      ${content.subject}

      ${content.body}

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
      console.log(`📧 ${tab} Knowledge Series 5 Email sent.`);
      return true;
    } catch (error) {
      console.error("❌ Failed to send email:", error);
      return false;
    }
  };

  // 🔹 Send WhatsApp
  const sendWhatsApp = async (orbiterName, prospectName, phone, tab) => {
    const content = getContent(tab);
    const bodyText = `Hi ${prospectName},\n\n${content.subject}\n\n${content.body}\n\nRegards,\n${orbiterName}`;

    try {
      await sendWhatsAppTextRequest({
        phone,
        text: bodyText,
      });
      console.log(`✅ WhatsApp ${tab} Knowledge Series 5 sent to ${prospectName}`);
      return true;
    } catch (error) {
      console.error(
        `❌ Failed to send WhatsApp (${tab}) to ${prospectName}`,
        error.response?.data || error.message
      );
      return false;
    }
  };

  // 🔹 Handle Send
  const handleSend = async (tab) => {
    setLoading(true);
    try {
      const docRef = doc(db, "Prospects", id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const { email: prospectEmail, prospectPhone, prospectName, orbiterName } = data;

        const emailSent = await sendEmail(prospectName, prospectEmail, orbiterName, tab);
        const wpSent = await sendWhatsApp(orbiterName, prospectName, prospectPhone, tab);

        if (emailSent || wpSent) {
          const timestamp = new Date().toLocaleString("en-IN", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });

          const updateField =
            tab === "morning" ? "knowledgeSeries5_morning" : "knowledgeSeries5_evening";

          const seriesData = { sent: true, sentAt: timestamp };

          await updateDoc(docRef, { [updateField]: seriesData });

          if (tab === "morning") setMorningData(seriesData);
          else setEveningData(seriesData);

          Swal.fire("✅ Sent!", `Knowledge Series 5 (${tab}) sent successfully.`, "success");
          fetchData?.();
        } else {
          Swal.fire("❌ Error", `Failed to send Knowledge Series 5 (${tab}).`, "error");
        }
      }
    } catch (error) {
      console.error("❌ Error sending Knowledge Series 5:", error);
      Swal.fire("❌ Error", "Something went wrong.", "error");
    }
    setLoading(false);
  };

return (
  <div className="max-w-3xl mx-auto p-6">

    <div className="bg-white border rounded-xl shadow-sm p-6">

      <h2 className="text-xl font-semibold mb-6">
        Knowledge Series 5
      </h2>

      {/* Tabs */}
      <div className="flex gap-3 mb-6">

        <button
          onClick={() => setActiveTab("morning")}
          className={`px-4 py-2 rounded-lg transition ${
            activeTab === "morning"
              ? "bg-black text-white"
              : "bg-gray-200 hover:bg-gray-300"
          }`}
        >
          Morning
        </button>

        <button
          onClick={() => setActiveTab("evening")}
          className={`px-4 py-2 rounded-lg transition ${
            activeTab === "evening"
              ? "bg-black text-white"
              : "bg-gray-200 hover:bg-gray-300"
          }`}
        >
          Evening
        </button>

      </div>


      {/* Morning Tab */}

      {activeTab === "morning" && (

        <div>

          {morningData?.sent ? (
            <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg mb-4">
              ✅ Morning Knowledge Series Sent on {morningData.sentAt}
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4">
              ❌ Morning Knowledge Series Not Sent
            </div>
          )}

          <button
            onClick={() => handleSend("morning")}
            disabled={loading || morningData?.sent}
            className={`px-5 py-2 rounded-lg text-white transition ${
              loading || morningData?.sent
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-black hover:bg-gray-800"
            }`}
          >
            {loading ? "Sending..." : "Send Morning Episode"}
          </button>

        </div>

      )}


      {/* Evening Tab */}

      {activeTab === "evening" && (

        <div>

          {eveningData?.sent ? (
            <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg mb-4">
              ✅ Evening Knowledge Series Sent on {eveningData.sentAt}
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4">
              ❌ Evening Knowledge Series Not Sent
            </div>
          )}

          <button
            onClick={() => handleSend("evening")}
            disabled={loading || eveningData?.sent}
            className={`px-5 py-2 rounded-lg text-white transition ${
              loading || eveningData?.sent
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-black hover:bg-gray-800"
            }`}
          >
            {loading ? "Sending..." : "Send Evening Episode"}
          </button>

        </div>

      )}

    </div>

  </div>
);
};

export default KnowledgeSeries5;



