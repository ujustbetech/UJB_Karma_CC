"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  getDocs,
} from "firebase/firestore";
import { app } from "@/firebaseConfig";
import Link from "next/link";
import { Calendar, Video, MapPin } from "lucide-react";
import { COLLECTIONS } from "@/lib/utility_collection";

const db = getFirestore(app);

export default function ConclaveDetails() {
  const { id } = useParams(); // ✅ FIXED

  const [conclave, setConclave] = useState(null);
  const [meetings, setMeetings] = useState([]);

  /* ================= FETCH DATA ================= */
  useEffect(() => {
    if (!id) return;

    const fetchConclave = async () => {
      try {
        const conclaveRef = doc(db, COLLECTIONS.conclaves, id);
        const snap = await getDoc(conclaveRef);
        if (snap.exists()) {
          setConclave(snap.data());
        }
      } catch (err) {
        console.error("Error fetching conclave:", err);
      }
    };

    const fetchMeetings = async () => {
      try {
        const meetingsRef = collection(
          db,
          COLLECTIONS.conclaves,
          id,
          "meetings"
        );

        const snap = await getDocs(meetingsRef);
        const list = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setMeetings(list);
      } catch (err) {
        console.error("Error fetching meetings:", err);
      }
    };

    fetchConclave();
    fetchMeetings();
  }, [id]);

  return (
    <div className="min-h-screen bg-[#0b1120] pb-20">

      {/* ================= HERO ================= */}
      <div className="relative h-[220px] w-full">
        <img
          src="/space.jpeg"
          className="absolute inset-0 w-full h-full object-cover opacity-70"
          alt="background"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-[#0b1120]" />

        <div className="relative z-10 flex flex-col items-center justify-center h-full text-white text-center">
          <h1 className="text-3xl font-bold">
            {conclave?.conclaveStream || "Conclave"}
          </h1>
          <p className="text-sm mt-2 opacity-80">
            Explore all scheduled meetings
          </p>
        </div>
      </div>

      {/* ================= MEETING LIST ================= */}
      <div className="max-w-4xl mx-auto px-5 -mt-8 space-y-6">

        {meetings.map((meeting) => {
          const date = meeting.datetime?.seconds
            ? new Date(meeting.datetime.seconds * 1000)
            : null;

          const isOnline = meeting.mode === "online";

          return (
            <div
              key={meeting.id}
              className="bg-white rounded-3xl shadow-xl p-6 hover:scale-[1.02] transition duration-300"
            >
              {/* DATE */}
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                <Calendar size={14} />
                {date
                  ? `${date.toLocaleDateString("en-IN")} ${date.toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}`
                  : "Date not set"}
              </div>

              {/* MODE BADGE */}
              <div className="mb-4">
                <span
                  className={`px-3 py-1 text-xs font-semibold rounded-full ${
                    isOnline
                      ? "bg-green-100 text-green-600"
                      : "bg-indigo-100 text-indigo-600"
                  }`}
                >
                  {isOnline ? "Online Meeting" : "Offline Meeting"}
                </span>
              </div>

              {/* TITLE */}
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                {meeting.meetingName || "Untitled Meeting"}
              </h3>

              {/* DETAILS */}
              <div className="text-sm text-gray-600 mb-6 space-y-2">
                {isOnline ? (
                  <div className="flex items-center gap-2">
                    <Video size={16} className="text-green-600" />
                    <a
                      href={meeting.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-600 hover:underline break-all"
                    >
                      Join via Zoom
                    </a>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-indigo-600" />
                    <span>
                      {meeting.venue || "Venue not specified"}
                    </span>
                  </div>
                )}
              </div>

              {/* FOOTER */}
             <div className="flex justify-between items-center">
  <Link
    href={`/user/conclave/meeting/${meeting.id}`}
    onClick={() => localStorage.setItem("conclaveId", id)}
    className="text-indigo-600 text-sm font-semibold hover:underline"
  >
    View Details →
  </Link>
</div>
            </div>
          );
        })}

        {meetings.length === 0 && (
          <div className="text-center text-white/70 py-10">
            No meetings available.
          </div>
        )}

      </div>
    </div>
  );
}