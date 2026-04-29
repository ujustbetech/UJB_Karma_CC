import React, { useState, useEffect } from "react";
import { doc, updateDoc, getDoc, collection, query, where, getDocs, setDoc, addDoc, serverTimestamp, db } from "@/services/adminProspectJourneyFirebaseService";
import emailjs from "@emailjs/browser";
import { COLLECTIONS } from "@/lib/utility_collection";
import Swal from "sweetalert2";
import { sendWhatsAppTextRequest } from "@/utils/whatsappClient";


const KnowledgeSeries4 = ({ id, fetchData }) => {
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
        setMorningData(docSnap.data().knowledgeSeries4_morning || null);
        setEveningData(docSnap.data().knowledgeSeries4_evening || null);
      }
    };
    fetchSeries();
  }, [id]);

  // 🔹 Message Content
  const getContent = (tab) => {
    if (tab === "morning") {
      return {
        subject: "📘 Knowledge Series - Episode 1: Introduction to UJustBe",
        body: `Aarav: Hey Soumya, have you heard about UJustBe?\n\nSoumya: Yeah, I’ve heard the name, but I’m not exactly sure what it’s about. Can you please explain more?\n\nAarav: Of course! UJustBe Universe is a community where Contributors, called Orbiters, contribute to personal and collective growth. It focuses on relationships, health, and wealth to live into the world of “happy face.”\n\nSoumya: That sounds interesting. So, who exactly are these Orbiters?`,
      };
    }
    return {
      subject: "📘 Knowledge Series - Episode 2: The Role of Orbiters",
      body: `Aarav: Orbiters are Contributing individuals who actively participate in UJustBe Universe. They share knowledge, give referrals, and take part in events like monthly meetings, WhatsApp and other events.\n\nSoumya: Oh, so they’re like the backbone of the community?\n\nAarav: Exactly! They contribute by exploring possibilities and sharing verified referrals within the UJustBe Universe.`,
    };
  };
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
      totals: { R: 0, H: 0, W: 0 }, // ✅ REQUIRED
      createdAt: serverTimestamp(),
    });
  }
};
const updateCategoryTotals = async (orbiter, categories, points) => {
  if (!orbiter?.ujbcode || !categories?.length) return;

  const ref = doc(db, "CPBoard", orbiter.ujbcode);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;

  const totals = snap.data().totals || { R: 0, H: 0, W: 0 };
  const split = Math.floor(points / categories.length);

  const updatedTotals = { ...totals };
  categories.forEach((c) => {
    updatedTotals[c] = (updatedTotals[c] || 0) + split;
  });

  await updateDoc(ref, {
    totals: updatedTotals,
    lastUpdatedAt: serverTimestamp(),
  });
};


const addCpForKnowledgeSeriesMorning = async (
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
    where("activityNo", "==", "016"),
    where("prospectPhone", "==", prospectPhone)
  );

  const snap = await getDocs(q);
  if (!snap.empty) return;

  const points = 75;
  const categories = ["R"];

  await addDoc(
    collection(db, "CPBoard", orbiter.ujbcode, "activities"),
    {
      activityNo: "016",
      activityName: "Completion of OTC Journey till Day 5",
      points,
      categories, // ✅ FIXED
      purpose:
        "Encourages timely completion of orientation journey and early engagement.",
      prospectName,
      prospectPhone,
      source: "KnowledgeSeries4Morning",
      month: new Date().toLocaleString("default", {
        month: "short",
        year: "numeric",
      }),
      addedAt: serverTimestamp(),
    }
  );

  // ⭐ UPDATE TOTALS
  await updateCategoryTotals(orbiter, categories, points);
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
      console.log(`📧 ${tab} Knowledge Series Email sent.`);
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
      console.log(`✅ WhatsApp ${tab} Knowledge Series sent to ${prospectName}`);
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
    tab === "morning"
      ? "knowledgeSeries4_morning"
      : "knowledgeSeries4_evening";

  const seriesData = { sent: true, sentAt: timestamp };

  await updateDoc(docRef, { [updateField]: seriesData });

  if (tab === "morning") {
    setMorningData(seriesData);

    /* ⭐ ADD CP 016 – ONLY FOR MORNING */
    const qMentor = query(
      collection(db, COLLECTIONS.userDetail),
      where("MobileNo", "==", data.orbiterContact)
    );

    const mentorSnap = await getDocs(qMentor);

    if (!mentorSnap.empty) {
      const d = mentorSnap.docs[0].data();

      if (d.UJBCode) {
        const orbiter = {
          ujbcode: d.UJBCode,
          name: d.Name,
          phone: d.MobileNo,
          category: d.Category,
        };

        await addCpForKnowledgeSeriesMorning(
          db,
          orbiter,
          data.prospectPhone,
          data.prospectName
        );
      }
    }
  } else {
    setEveningData(seriesData);
  }

  Swal.fire(
    "✅ Sent!",
    `Knowledge Series 4 (${tab}) sent successfully.`,
    "success"
  );

  fetchData?.();

        } else {
          Swal.fire("❌ Error", `Failed to send Knowledge Series 4 (${tab}).`, "error");
        }
      }
    } catch (error) {
      console.error("❌ Error sending Knowledge Series 4:", error);
      Swal.fire("❌ Error", "Something went wrong.", "error");
    }
    setLoading(false);
  };

 return (
  <div className="max-w-3xl mx-auto p-6">

    <div className="bg-white border rounded-xl shadow-sm p-6">

      <h2 className="text-xl font-semibold mb-6">
        Knowledge Series 4
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

export default KnowledgeSeries4;



