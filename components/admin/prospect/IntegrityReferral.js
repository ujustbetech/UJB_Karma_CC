import React, { useState, useEffect } from "react";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/firebaseClient";
import { COLLECTIONS } from "@/lib/utility_collection";
import Swal from "sweetalert2";

const Day24IntegrityReferral = ({ id, fetchData }) => {

  const [reflection, setReflection] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState("");

  const isFrozen = loading || status === "Completed";

  useEffect(() => {

    const fetchFirestoreData = async () => {

      const docRef = doc(db, COLLECTIONS.prospect, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {

        const data = docSnap.data();

        setReflection(data.integrityReflection || "");
        setStatus(data.day24Status || "");

      }

    };

    const today = new Date().toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });

    setCurrentDate(today);

    fetchFirestoreData();

  }, [id]);

  const handleSubmitReflection = async () => {

    if (!reflection.trim()) {

      Swal.fire({
        icon: "warning",
        title: "Reflection Required",
        text: "Please write your thoughts about ethical referrals."
      });

      return;

    }

    setLoading(true);

    try {

      const docRef = doc(db, COLLECTIONS.prospect, id);

      await updateDoc(docRef, {
        integrityReflection: reflection,
        day24Status: "Completed"
      });

      setStatus("Completed");

      Swal.fire({
        icon: "success",
        title: "Saved",
        text: "Your reflection on integrity in referrals has been recorded."
      });

      fetchData?.();

    } catch (error) {

      console.error("Error saving reflection:", error);

    }

    setLoading(false);

  };

  return (

    <div className="max-w-5xl mx-auto p-6">

      <div className="bg-white border rounded-xl shadow-sm p-6">

        <h2 className="text-xl font-semibold mb-4">
          Day 24 – Integrity in Referral
        </h2>

        <p className="text-gray-700 mb-4">
          Date: {currentDate}
        </p>

        <h3 className="font-semibold mt-4 mb-2">
          Topics
        </h3>

        <ul className="list-disc ml-6 text-gray-700">
          <li>Ethical referrals</li>
          <li>Authentic participants</li>
          <li>Transparency in referral interactions</li>
        </ul>

        <h3 className="font-semibold mt-6 mb-2">
          Key Concept
        </h3>

        <p className="text-gray-700">
          Trust is the foundation of UJustBe. Referrals should always
          be genuine, value-driven, and mutually beneficial for both
          the community and the individual being referred.
        </p>

        <h3 className="font-semibold mt-6 mb-2">
          Reflection Activity
        </h3>

        <p className="text-gray-700 mb-3">
          Write a short reflection on why integrity and transparency
          are important when making referrals in the UJustBe Universe.
        </p>

        <textarea
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
          disabled={isFrozen}
          placeholder="Write your reflection about ethical referrals..."
          className="w-full border rounded-lg p-3 min-h-[130px]"
        />

        <div className="mt-5">

          <button
            onClick={handleSubmitReflection}
            disabled={isFrozen}
            className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 disabled:bg-gray-400"
          >
            Submit Reflection
          </button>

        </div>

      </div>

    </div>

  );

};

export default Day24IntegrityReferral;
