import React, { useState, useEffect } from "react";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/firebaseClient";
import { COLLECTIONS } from "@/lib/utility_collection";
import Swal from "sweetalert2";

const Day27Events = ({ id, fetchData }) => {

  const [eventName, setEventName] = useState("");
  const [strategy, setStrategy] = useState("");
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

        setEventName(data.eventName || "");
        setStrategy(data.eventStrategy || "");
        setStatus(data.day27Status || "");

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

  const handleSubmitEventPlan = async () => {

    if (!eventName.trim() || !strategy.trim()) {

      Swal.fire({
        icon: "warning",
        title: "Details Required",
        text: "Please enter the event name and your engagement strategy."
      });

      return;

    }

    setLoading(true);

    try {

      const docRef = doc(db, COLLECTIONS.prospect, id);

      await updateDoc(docRef, {
        eventName,
        eventStrategy: strategy,
        day27Status: "Completed"
      });

      setStatus("Completed");

      Swal.fire({
        icon: "success",
        title: "Saved",
        text: "Your event engagement plan has been recorded."
      });

      fetchData?.();

    } catch (error) {

      console.error("Error saving event plan:", error);

    }

    setLoading(false);

  };

  return (

    <div className="max-w-5xl mx-auto p-6">

      <div className="bg-white border rounded-xl shadow-sm p-6">

        <h2 className="text-xl font-semibold mb-4">
          Day 27 – Role of Events in UJustBe Universe
        </h2>

        <p className="text-gray-700 mb-4">
          Date: {currentDate}
        </p>

        <h3 className="font-semibold mt-4 mb-2">
          Topics
        </h3>

        <ul className="list-disc ml-6 text-gray-700">
          <li>Importance of events in building connections</li>
          <li>Learning opportunities through events</li>
          <li>Networking with Orbiters and community members</li>
        </ul>

        <h3 className="font-semibold mt-6 mb-2">
          Activity
        </h3>

        <p className="text-gray-700 mb-3">
          Register for an upcoming UJustBe event and plan your engagement strategy.
        </p>

        <label className="block font-medium mb-2">
          Event Name
        </label>

        <input
          type="text"
          value={eventName}
          onChange={(e) => setEventName(e.target.value)}
          disabled={isFrozen}
          placeholder="Enter the event you plan to attend"
          className="w-full border rounded-lg p-2 mb-4"
        />

        <label className="block font-medium mb-2">
          Engagement Strategy
        </label>

        <textarea
          value={strategy}
          onChange={(e) => setStrategy(e.target.value)}
          disabled={isFrozen}
          placeholder="Describe how you plan to engage in the event..."
          className="w-full border rounded-lg p-3 min-h-[120px]"
        />

        <div className="mt-5">

          <button
            onClick={handleSubmitEventPlan}
            disabled={isFrozen}
            className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 disabled:bg-gray-400"
          >
            Submit Event Plan
          </button>

        </div>

      </div>

    </div>

  );

};

export default Day27Events;
