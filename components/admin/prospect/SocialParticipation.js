import React, { useState, useEffect } from "react";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/firebaseConfig";
import { COLLECTIONS } from "@/lib/utility_collection";
import Swal from "sweetalert2";

const Day17SocialMedia = ({ id, fetchData }) => {

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [currentDate, setCurrentDate] = useState("");

  const isFrozen = loading || status === "Completed";

  useEffect(() => {

    const fetchStatus = async () => {

      const docRef = doc(db, COLLECTIONS.prospect, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setStatus(docSnap.data().day17Status || "");
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
        day17Status: "Completed"
      });

      setStatus("Completed");

      Swal.fire({
        icon: "success",
        title: "Saved",
        text: "Day 17–18 completed successfully"
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
          Day 17–18 – Understanding Social Media Participation
        </h2>

        <p className="text-gray-700 mb-4">
          Date: {currentDate}
        </p>

        <h3 className="font-semibold mt-4 mb-2">
          Introduction to UJustBe Social Media Platforms
        </h3>

        <ul className="list-disc ml-6 text-gray-700">
          <li>Facebook</li>
          <li>Instagram</li>
          <li>LinkedIn</li>
          <li>WhatsApp Groups</li>
        </ul>

        <h3 className="font-semibold mt-6 mb-2">
          Best Practices
        </h3>

        <ul className="list-disc ml-6 text-gray-700">
          <li>Like posts that inspire you</li>
          <li>Comment thoughtfully</li>
          <li>Share meaningful content</li>
          <li>Create posts aligned with UJustBe values</li>
        </ul>

        <h3 className="font-semibold mt-6 mb-2">
          Visibility Strategies
        </h3>

        <ul className="list-disc ml-6 text-gray-700">
          <li>Use relevant hashtags</li>
          <li>Understand social media algorithms</li>
          <li>Engage quickly with comments</li>
          <li>Post consistently</li>
        </ul>

        <h3 className="font-semibold mt-6 mb-2">
          Activity
        </h3>

        <p className="text-gray-700">
          Each Orbiter will create a post sharing their personal experience
          with UJustBe and tag official handles using hashtags like
          <strong> #UJustBe #MyUJustBeJourney #ContributionInAction</strong>.
        </p>

        <div className="mt-6">

          <button
            onClick={handleComplete}
            disabled={isFrozen}
            className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 disabled:bg-gray-400"
          >
            Mark Day 17–18 Completed
          </button>

        </div>

      </div>

    </div>

  );

};

export default Day17SocialMedia;