import React, { useState, useEffect } from "react";
import { doc, updateDoc, getDoc, query, collection, setDoc, addDoc, where, getDocs, serverTimestamp, db } from "@/services/adminProspectJourneyFirebaseService";
import emailjs from "@emailjs/browser";
import { COLLECTIONS } from "@/lib/utility_collection";
import Swal from "sweetalert2";
import { sendWhatsAppTextRequest } from "@/utils/whatsappClient";


const Assessment = ({ id, fetchData }) => {
  const [loading, setLoading] = useState(false);
  const [assessment, setAssessment] = useState(null);

  // 🔹 Load assessment data if already sent
  useEffect(() => {
    const fetchAssessment = async () => {
      const docRef = doc(db,COLLECTIONS.prospect, id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setAssessment(docSnap.data().assessmentMail || null);
      }
    };
    fetchAssessment();
  }, [id]);
/* ================= CP HELPERS ================= */

const ensureCpBoardUser = async (db, orbiter) => {
  if (!orbiter?.ujbcode) return;

  const ref = doc(db, "CPBoard", orbiter.ujbcode);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      id: orbiter.ujbcode,
      name: orbiter.name,
      phoneNumber: orbiter.phone,
      role: orbiter.category || "MentOrbiter",
      createdAt: serverTimestamp(),
    });
  }
};

const addCpForAssessment = async (
  db,
  orbiter,
  prospectPhone,
  prospectName
) => {
  if (!orbiter?.ujbcode) return;

  await ensureCpBoardUser(db, orbiter);

  // 🚫 Prevent duplicate CP
  const q = query(
    collection(db, "CPBoard", orbiter.ujbcode, "activities"),
    where("activityNo", "==", "018"),
    where("prospectPhone", "==", prospectPhone)
  );

  const snap = await getDocs(q);
  if (!snap.empty) return;

  await addDoc(
    collection(db, "CPBoard", orbiter.ujbcode, "activities"),
    {
      activityNo: "018",
      activityName: "Completion of OTC Journey till Day 15",
      points: 75,
      category: "R",
      purpose:
        "Acknowledges completion of onboarding process with accountability.",
      prospectName,
      prospectPhone,
      source: "AssessmentMail",
      month: new Date().toLocaleString("default", {
        month: "short",
        year: "numeric",
      }),
      addedAt: serverTimestamp(),
    }
  );
};

  // 🔹 Send Email
  const sendAssessmentEmail = async (prospectName, prospectEmail, orbiterName) => {
    const body = `
      Dear ${prospectName},

      Subject: 📘 Your Assessment Mail from UJustBe

      We are delighted to share an assessment mail with you that will help you align better with the UJustBe Universe.

      Please go through it carefully and share your reflections.

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
      console.log("📧 Assessment Email sent.");
      return true;
    } catch (error) {
      console.error("❌ Failed to send email:", error);
      return false;
    }
  };

  // 🔹 Send WhatsApp
  const sendAssessmentMessage = async (orbiterName, prospectName, phone) => {
    const bodyText = `Hi ${prospectName},\n\nHere is your assessment mail from UJustBe. Please review it carefully and let us know your reflections.\n\nRegards,\n${orbiterName}`;

    try {
      await sendWhatsAppTextRequest({
        phone,
        text: bodyText,
      });
      console.log(`✅ WhatsApp Assessment sent to ${prospectName}`);
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
 const handleSendAssessment = async () => {
  setLoading(true);
  try {
    const docRef = doc(db, COLLECTIONS.prospect, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return;

    const data = docSnap.data();

    const emailSent = await sendAssessmentEmail(
      data.prospectName,
      data.email,
      data.orbiterName
    );

    const wpSent = await sendAssessmentMessage(
      data.orbiterName,
      data.prospectName,
      data.prospectPhone
    );

    if (emailSent && wpSent) {
      await updateDoc(docRef, {
        assessmentMail: {
          sent: true,
          sentAt: new Date().toLocaleString("en-IN"),
        },
      });

      setAssessment({
        sent: true,
        sentAt: new Date().toLocaleString("en-IN"),
      });

      Swal.fire("✅ Sent", "Assessment mail sent successfully", "success");

      // ⭐ CP logic stays SAME (no change)
    } else {
      Swal.fire("❌ Error", "Failed to send assessment mail.", "error");
    }
  } catch (err) {
    console.error(err);
    Swal.fire("❌ Error", "Something went wrong", "error");
  }
  setLoading(false);
};

return (
  <div className="max-w-3xl mx-auto p-6">

    <div className="bg-white border rounded-xl shadow-sm p-6">

      <h2 className="text-xl font-semibold mb-4">
        Assessment Mail
      </h2>

      {assessment?.sent ? (
        <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg mb-4">
          ✅ Assessment Mail Sent on {assessment.sentAt}
        </div>
      ) : (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4">
          ❌ Assessment Mail Not Sent
        </div>
      )}

      <button
        onClick={handleSendAssessment}
        disabled={loading || assessment?.sent}
        className={`px-5 py-2 rounded-lg text-white transition ${
          loading || assessment?.sent
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-black hover:bg-gray-800"
        }`}
      >
        {loading ? "Sending..." : "Send Assessment Mail"}
      </button>

    </div>

  </div>
);
};

export default Assessment;



