import React, { useState, useEffect } from "react";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/firebaseClient";
import emailjs from "@emailjs/browser";
import { COLLECTIONS } from "@/lib/utility_collection";
import Swal from "sweetalert2";
import { sendWhatsAppTextRequest } from "@/utils/whatsappClient";


const Assessment = ({ id, fetchData }) => {
  const [loading, setLoading] = useState(false);
  const [caseStudy, setCaseStudy] = useState(null);

  // 🔹 Load caseStudy1 data if already sent
  useEffect(() => {
    const fetchCaseStudy = async () => {
      const docRef = doc(db, COLLECTIONS.prospect, id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setCaseStudy(docSnap.data().caseStudy1 || null);
      }
    };
    fetchCaseStudy();
  }, [id]);

  // 🔹 Send Email
const sendCaseStudyEmail = async (prospectName, prospectEmail, orbiterName) => {
 const body = `
Dear ${prospectName},

Subject: 📘 Your Case Study from UJustBe

We are delighted to share a case study with you that reflects the journey of authentic choice and contribution within UJustBe Universe.

Please go through the case study carefully, as it will help you align better with our vision and values.

Click the link below to view the Case Study:
https://firebasestorage.googleapis.com/v0/b/monthlymeetingapp.appspot.com/o/CaseStudy%2FHow%20to%20pass%20referral%20Doc%20-%20Ibrahim.pdf?alt=media&token=808a9100-d250-4998-aa07-79baed831ed6

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
      console.log("📧 Case Study Email sent.");
      return true;
    } catch (error) {
      console.error("❌ Failed to send email:", error);
      return false;
    }
  };

  // 🔹 Send WhatsApp
  const sendCaseStudyMessage = async (orbiterName, prospectName, phone) => {
    const bodyText = `Hi ${prospectName},\n\nHere is your case study from UJustBe.Click the link below to view the Case Study:
https://firebasestorage.googleapis.com/v0/b/monthlymeetingapp.appspot.com/o/CaseStudy%2FHow%20to%20pass%20referral%20Doc%20-%20Ibrahim.pdf?alt=media&token=808a9100-d250-4998-aa07-79baed831ed6. Please review it carefully and let us know your reflections.\n\nRegards,\n${orbiterName}`;

    try {
      await sendWhatsAppTextRequest({
        phone,
        text: bodyText,
      });
      console.log(`✅ WhatsApp Case Study sent to ${prospectName}`);
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
  const handleSendCaseStudy = async () => {
    setLoading(true);
    try {
      const docRef = doc(db, COLLECTIONS.prospect, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const prospectEmail = data.email;
        const prospectPhone = data.prospectPhone;
        const prospectName = data.prospectName;
        const orbiterName = data.orbiterName;

        // Send Email + WhatsApp
        const emailSent = await sendCaseStudyEmail(
          prospectName,
          prospectEmail,
          orbiterName
        );
        const wpSent = await sendCaseStudyMessage(
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

          const caseStudyData = {
            sent: true,
            sentAt: timestamp,
          };

          await updateDoc(docRef, { caseStudy1: caseStudyData });
          setCaseStudy(caseStudyData);

          Swal.fire("✅ Sent!", "Case study sent successfully.", "success");
          fetchData?.();
        } else {
          Swal.fire("❌ Error", "Failed to send case study.", "error");
        }
      }
    } catch (error) {
      console.error("❌ Error sending case study:", error);
      Swal.fire("❌ Error", "Something went wrong.", "error");
    }
    setLoading(false);
  };

return (
<div className="max-w-3xl mx-auto p-6">

<div className="bg-white border rounded-xl shadow-sm p-6">

<h2 className="text-xl font-semibold mb-4">
Case Study
</h2>

{/* Status */}

{caseStudy?.sent ? (
<div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg mb-4">
✅ Case Study Sent on {caseStudy.sentAt}
</div>
) : (
<div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4">
❌ Case Study Not Sent
</div>
)}

{/* Send Button */}

<button
onClick={handleSendCaseStudy}
disabled={loading || caseStudy?.sent}
className={`px-5 py-2 rounded-lg text-white transition ${
loading || caseStudy?.sent
? "bg-gray-400 cursor-not-allowed"
: "bg-black hover:bg-gray-800"
}`}
>

{loading ? "Sending..." : "Send Case Study"}

</button>

</div>

</div>
);
};

export default Assessment;

