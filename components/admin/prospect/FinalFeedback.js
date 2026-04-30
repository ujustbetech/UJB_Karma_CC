import React, { useState, useEffect } from "react";
import { doc, updateDoc, getDoc, db } from "@/services/adminProspectJourneyFirebaseService";
import { COLLECTIONS } from "@/lib/utility_collection";
import Swal from "sweetalert2";

const Day28Feedback = ({ id, fetchData }) => {

  const [experience, setExperience] = useState("");
  const [participation, setParticipation] = useState("");
  const [suggestion, setSuggestion] = useState("");

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

        setExperience(data.feedbackExperience || "");
        setParticipation(data.feedbackParticipation || "");
        setSuggestion(data.feedbackSuggestion || "");
        setStatus(data.day30Status || "");

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

  const handleSubmitFeedback = async () => {

    if (!experience.trim() || !participation.trim() || !suggestion.trim()) {

      Swal.fire({
        icon: "warning",
        title: "All Fields Required",
        text: "Please complete all feedback sections before submitting."
      });

      return;

    }

    setLoading(true);

    try {

      const docRef = doc(db, COLLECTIONS.prospect, id);

      await updateDoc(docRef, {
        feedbackExperience: experience,
        feedbackParticipation: participation,
        feedbackSuggestion: suggestion,
        day30Status: "Completed"
      });

      setStatus("Completed");

      Swal.fire({
        icon: "success",
        title: "Journey Completed 🎉",
        text: "Thank you for completing your first 30-day journey with UJustBe."
      });

      fetchData?.();

    } catch (error) {

      console.error("Error saving feedback:", error);

    }

    setLoading(false);

  };

  return (

    <div className="max-w-5xl mx-auto p-6">

      <div className="bg-white border rounded-xl shadow-sm p-6">

        <h2 className="text-xl font-semibold mb-4">
          Day 28–30 – Feedback and Contributions
        </h2>

        <p className="text-gray-700 mb-4">
          Date: {currentDate}
        </p>

        <h3 className="font-semibold mt-4 mb-2">
          Topics
        </h3>

        <ul className="list-disc ml-6 text-gray-700">
          <li>Importance of feedback</li>
          <li>Community participation</li>
          <li>Improvement suggestions</li>
        </ul>

        <h3 className="font-semibold mt-6 mb-2">
          Activity – Structured Feedback
        </h3>

        <label className="block font-medium mb-2">
          Your Experience in First 30 Days
        </label>

        <textarea
          value={experience}
          onChange={(e) => setExperience(e.target.value)}
          disabled={isFrozen}
          placeholder="Share your experience during the first 30 days..."
          className="w-full border rounded-lg p-3 min-h-[100px] mb-4"
        />

        <label className="block font-medium mb-2">
          Your Participation in Community
        </label>

        <textarea
          value={participation}
          onChange={(e) => setParticipation(e.target.value)}
          disabled={isFrozen}
          placeholder="Describe how you participated in UJustBe activities..."
          className="w-full border rounded-lg p-3 min-h-[100px] mb-4"
        />

        <label className="block font-medium mb-2">
          Suggestions for Improvement
        </label>

        <textarea
          value={suggestion}
          onChange={(e) => setSuggestion(e.target.value)}
          disabled={isFrozen}
          placeholder="Share at least one suggestion to improve the journey..."
          className="w-full border rounded-lg p-3 min-h-[100px]"
        />

        <div className="mt-6">

          <button
            onClick={handleSubmitFeedback}
            disabled={isFrozen}
            className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 disabled:bg-gray-400"
          >
            Submit Final Feedback
          </button>

        </div>

      </div>

    </div>

  );

};

export default Day28Feedback;


