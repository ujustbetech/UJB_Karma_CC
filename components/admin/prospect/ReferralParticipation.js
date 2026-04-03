import React, { useState, useEffect } from "react";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/firebaseClient";
import { COLLECTIONS } from "@/lib/utility_collection";
import Swal from "sweetalert2";

const Day19Referral = ({ id, fetchData }) => {

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [currentDate, setCurrentDate] = useState("");

  const isFrozen = loading || status === "Completed";

  useEffect(() => {

    const fetchStatus = async () => {

      const docRef = doc(db, COLLECTIONS.prospect, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setStatus(docSnap.data().day19Status || "");
      }

    };

    const today = new Date().toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });

    setCurrentDate(today);

    fetchStatus();

  }, [id]);

  const handleComplete = async () => {

    setLoading(true);

    try {

      const docRef = doc(db, COLLECTIONS.prospect, id);

      await updateDoc(docRef, {
        day19Status: "Completed"
      });

      setStatus("Completed");

      Swal.fire({
        icon: "success",
        title: "Saved",
        text: "Day 19–20 completed successfully"
      });

      fetchData?.();

    } catch (error) {

      console.error(error);

    }

    setLoading(false);

  };

  return (

    <div className="max-w-5xl mx-auto p-6">

      <div className="bg-white border rounded-xl shadow-sm p-6">

        <h2 className="text-xl font-semibold mb-4">
          Day 19–20 – Tangible Earning Through Referral Participation
        </h2>

        <p className="text-gray-700 mb-4">
          Date: {currentDate}
        </p>

        <h3 className="font-semibold mt-4 mb-2">
          Topics
        </h3>

        <ul className="list-disc ml-6 text-gray-700">
          <li>Referral system overview</li>
          <li>Referral SOP</li>
          <li>Referral journey process</li>
        </ul>

        <h3 className="font-semibold mt-6 mb-2">
          Documents
        </h3>

        <ul className="list-disc ml-6 text-gray-700">
          <li>Referral SOP Latest.docx</li>
          <li>Referral Journey.docx</li>
          <li>How to pass referral – Sneha.docx</li>
          <li>How to pass referral – Ibrahim.docx</li>
        </ul>

        <h3 className="font-semibold mt-6 mb-2">
          Topics Discussed
        </h3>

        <ul className="list-disc ml-6 text-gray-700">
          <li>Referral fee concept</li>
          <li>Real-life referral case studies</li>
        </ul>

        <h3 className="font-semibold mt-6 mb-2">
          Activity
        </h3>

        <p className="text-gray-700">
          Orbiters will identify potential referrals from their
          personal and professional network and explore opportunities
          to introduce them to the UJustBe Universe.
        </p>

        <div className="mt-6">

          <button
            onClick={handleComplete}
            disabled={isFrozen}
            className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 disabled:bg-gray-400"
          >
            Mark Day 19–20 Completed
          </button>

        </div>

      </div>

    </div>

  );

};

export default Day19Referral;
