import React, { useState, useEffect } from "react";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/firebaseConfig";
import { COLLECTIONS } from "@/lib/utility_collection";
import Swal from "sweetalert2";

const Day21HappyFace = ({ id, fetchData }) => {

  const [note, setNote] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState("");

  const isFrozen = loading || status === "Completed";

  useEffect(() => {

    const fetchDataFromFirestore = async () => {

      const docRef = doc(db, COLLECTIONS.prospect, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {

        const data = docSnap.data();

        setStatus(data.day21Status || "");
        setNote(data.happyFaceNote || "");

      }

    };

    const today = new Date().toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });

    setCurrentDate(today);

    fetchDataFromFirestore();

  }, [id]);

  const handleSubmitNote = async () => {

    if (!note.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Note Required",
        text: "Please write an appreciation note."
      });
      return;
    }

    setLoading(true);

    try {

      const docRef = doc(db, COLLECTIONS.prospect, id);

      await updateDoc(docRef, {
        happyFaceNote: note,
        day21Status: "Completed"
      });

      setStatus("Completed");

      Swal.fire({
        icon: "success",
        title: "Note Submitted",
        text: "Your appreciation note has been saved."
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
          Day 21 – What is Happy Face
        </h2>

        <p className="text-gray-700 mb-4">
          Date: {currentDate}
        </p>

        <h3 className="font-semibold mt-4 mb-2">
          Concept
        </h3>

        <ul className="list-disc ml-6 text-gray-700">
          <li>Promotes positivity and gratitude</li>
          <li>Encourages contribution within the community</li>
        </ul>

        <h3 className="font-semibold mt-6 mb-2">
          Topics
        </h3>

        <ul className="list-disc ml-6 text-gray-700">
          <li>Ripple effect of positivity</li>
          <li>Recognizing contributors</li>
        </ul>

        <h3 className="font-semibold mt-6 mb-2">
          Activity
        </h3>

        <p className="text-gray-700 mb-3">
          Write an appreciation note for a member who has positively impacted
          your journey so far.
        </p>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          disabled={isFrozen}
          placeholder="Write your appreciation note here..."
          className="w-full border rounded-lg p-3 min-h-[120px]"
        />

        <div className="mt-5">

          <button
            onClick={handleSubmitNote}
            disabled={isFrozen}
            className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 disabled:bg-gray-400"
          >
            Submit Appreciation Note
          </button>

        </div>

      </div>

    </div>

  );

};

export default Day21HappyFace;