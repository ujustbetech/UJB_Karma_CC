import React, { useState, useEffect } from "react";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/firebaseClient";
import { COLLECTIONS } from "@/lib/utility_collection";
import Swal from "sweetalert2";

const Day22VisionAlignment = ({ id, fetchData }) => {

  const [statement, setStatement] = useState("");
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

        setStatement(data.visionStatement || "");
        setStatus(data.day22Status || "");

      }

    };

    const today = new Date().toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    setCurrentDate(today);

    fetchFirestoreData();

  }, [id]);

  const handleSubmitStatement = async () => {

    if (!statement.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Statement Required",
        text: "Please write your personal statement.",
      });
      return;
    }

    setLoading(true);

    try {

      const docRef = doc(db, COLLECTIONS.prospect, id);

      await updateDoc(docRef, {
        visionStatement: statement,
        day22Status: "Completed",
      });

      setStatus("Completed");

      Swal.fire({
        icon: "success",
        title: "Statement Saved",
        text: "Your personal vision statement has been submitted.",
      });

      fetchData?.();

    } catch (error) {

      console.error("Error saving statement:", error);

    }

    setLoading(false);

  };

  return (

    <div className="max-w-5xl mx-auto p-6">

      <div className="bg-white border rounded-xl shadow-sm p-6">

        <h2 className="text-xl font-semibold mb-4">
          Day 22–23 – Alignment with UJustBe Vision
        </h2>

        <p className="text-gray-700 mb-4">
          Date: {currentDate}
        </p>

        <h3 className="font-semibold mt-4 mb-2">
          Topics
        </h3>

        <ul className="list-disc ml-6 text-gray-700">
          <li>Core values of UJustBe</li>
          <li>Mission and purpose</li>
          <li>Personal and professional growth</li>
        </ul>

        <h3 className="font-semibold mt-6 mb-2">
          Exercise – Self Reflection
        </h3>

        <p className="text-gray-700">
          Reflect on your journey so far and think about how your
          values and goals align with the vision of the UJustBe
          Universe.
        </p>

        <h3 className="font-semibold mt-6 mb-2">
          Activity
        </h3>

        <p className="text-gray-700 mb-3">
          Write a personal statement describing how you see yourself
          contributing to the UJustBe community in the future.
        </p>

        <textarea
          value={statement}
          onChange={(e) => setStatement(e.target.value)}
          disabled={isFrozen}
          placeholder="Write your personal contribution statement here..."
          className="w-full border rounded-lg p-3 min-h-[140px]"
        />

        <div className="mt-5">

          <button
            onClick={handleSubmitStatement}
            disabled={isFrozen}
            className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 disabled:bg-gray-400"
          >
            Submit Personal Statement
          </button>

        </div>

      </div>

    </div>

  );

};

export default Day22VisionAlignment;
