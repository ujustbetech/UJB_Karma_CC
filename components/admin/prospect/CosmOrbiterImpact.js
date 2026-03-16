import React, { useState, useEffect } from "react";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/firebaseConfig";
import { COLLECTIONS } from "@/lib/utility_collection";
import Swal from "sweetalert2";

const Day25CosmOrbiterImpact = ({ id, fetchData }) => {

  const [impactPlan, setImpactPlan] = useState("");
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

        setImpactPlan(data.cosmOrbiterImpactPlan || "");
        setStatus(data.day25Status || "");

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

  const handleSubmitImpact = async () => {

    if (!impactPlan.trim()) {

      Swal.fire({
        icon: "warning",
        title: "Plan Required",
        text: "Please write how you plan to create impact as a CosmOrbiter."
      });

      return;

    }

    setLoading(true);

    try {

      const docRef = doc(db, COLLECTIONS.prospect, id);

      await updateDoc(docRef, {
        cosmOrbiterImpactPlan: impactPlan,
        day25Status: "Completed"
      });

      setStatus("Completed");

      Swal.fire({
        icon: "success",
        title: "Saved",
        text: "Your CosmOrbiter impact plan has been recorded."
      });

      fetchData?.();

    } catch (error) {

      console.error("Error saving impact plan:", error);

    }

    setLoading(false);

  };

  return (

    <div className="max-w-5xl mx-auto p-6">

      <div className="bg-white border rounded-xl shadow-sm p-6">

        <h2 className="text-xl font-semibold mb-4">
          Day 25–26 – Creating Impact as a CosmOrbiter
        </h2>

        <p className="text-gray-700 mb-4">
          Date: {currentDate}
        </p>

        <h3 className="font-semibold mt-4 mb-2">
          Topics
        </h3>

        <ul className="list-disc ml-6 text-gray-700">
          <li>Transition from Orbiter → CosmOrbiter</li>
          <li>Mentoring other Orbiters</li>
          <li>Leading initiatives within the community</li>
          <li>Creating meaningful content</li>
        </ul>

        <h3 className="font-semibold mt-6 mb-2">
          Success Stories
        </h3>

        <p className="text-gray-700">
          Learn from experienced Orbiters who have created a strong
          impact by mentoring others, contributing ideas, and actively
          participating in the UJustBe Universe.
        </p>

        <h3 className="font-semibold mt-6 mb-2">
          Reflection Activity
        </h3>

        <p className="text-gray-700 mb-3">
          Describe how you plan to contribute as a CosmOrbiter.
          Consider mentoring, creating initiatives, or sharing
          valuable knowledge with the community.
        </p>

        <textarea
          value={impactPlan}
          onChange={(e) => setImpactPlan(e.target.value)}
          disabled={isFrozen}
          placeholder="Write your plan to create impact as a CosmOrbiter..."
          className="w-full border rounded-lg p-3 min-h-[140px]"
        />

        <div className="mt-5">

          <button
            onClick={handleSubmitImpact}
            disabled={isFrozen}
            className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 disabled:bg-gray-400"
          >
            Submit Impact Plan
          </button>

        </div>

      </div>

    </div>

  );

};

export default Day25CosmOrbiterImpact;