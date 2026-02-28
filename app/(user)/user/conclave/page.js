"use client";

import React, { useEffect, useState } from "react";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { app } from "@/firebaseConfig";
import Link from "next/link";
import { Calendar, Users, Crown } from "lucide-react";
import { COLLECTIONS } from "@/lib/utility_collection";

const db = getFirestore(app);

export default function AllConclaves() {
  const [events, setEvents] = useState([]);
  const [leaderNames, setLeaderNames] = useState({});

  /* ================= FETCH CONCLAVES ================= */
  useEffect(() => {
    const fetchAllConclaves = async () => {
      try {
        const snapshot = await getDocs(
          collection(db, COLLECTIONS.conclaves)
        );

        const conclaveList = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            ...data,
            orbiterCount: data.orbiters?.length || 0,
            ntMemberCount: data.ntMembers?.length || 0,
          };
        });

        setEvents(conclaveList);

        // Fetch leader names
        const namesMap = {};
        for (const conclave of conclaveList) {
          if (conclave.leader && !namesMap[conclave.leader]) {
            const userRef = doc(db, "userdetails", conclave.leader);
            const userDoc = await getDoc(userRef);
            namesMap[conclave.leader] =
              userDoc.exists()
                ? userDoc.data()[" Name"]
                : "User";
          }
        }

        setLeaderNames(namesMap);

      } catch (error) {
        console.error("Error fetching conclaves:", error);
      }
    };

    fetchAllConclaves();
  }, []);

  const sortedEvents = [...events].sort((a, b) => {
    const dateA = new Date(a.startDate || 0);
    const dateB = new Date(b.startDate || 0);
    return dateB - dateA;
  });

  return (
    <div className="min-h-screen bg-[#0b1120] pb-20">

      {/* ================= HERO ================= */}
      <div className="relative h-[240px] w-full">
        <img
          src="/space.jpeg"
          className="absolute inset-0 w-full h-full object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-[#0b1120]" />

        <div className="relative z-10 flex flex-col items-center justify-center h-full text-white text-center">
          <h1 className="text-3xl font-bold">Conclave Meetings</h1>
          <p className="text-sm mt-2 opacity-80">
            Collaboration • Leadership • Growth
          </p>
        </div>
      </div>

      {/* ================= LIST ================= */}
      <div className="max-w-4xl mx-auto px-5 -mt-8 space-y-6">

        {sortedEvents.map((conclave) => {

          const eventDate = conclave.startDate
            ? new Date(conclave.startDate)
            : null;

          const now = new Date();
          const isEnded = eventDate ? eventDate < now : false;

          return (
            <div
              key={conclave.id}
              className="bg-white rounded-3xl shadow-xl p-6 hover:scale-[1.02] transition duration-300"
            >
              {/* DATE */}
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                <Calendar size={14} />
                {eventDate
                  ? eventDate.toLocaleDateString("en-GB")
                  : "N/A"}
              </div>

              {/* STATUS */}
              <div className="mb-3">
                <span
                  className={`px-3 py-1 text-xs font-semibold rounded-full ${
                    isEnded
                      ? "bg-gray-200 text-gray-600"
                      : "bg-indigo-100 text-indigo-600"
                  }`}
                >
                  {isEnded ? "Completed" : "Upcoming"}
                </span>
              </div>

              {/* TITLE */}
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                {conclave.conclaveStream || "No Stream"}
              </h3>

              {/* STATS ROW */}
              <div className="flex justify-between items-center text-sm mb-6">

                <div className="flex items-center gap-2 text-indigo-600">
                  <Users size={16} />
                  {conclave.orbiterCount} Orbiters
                </div>

                <div className="flex items-center gap-2 text-purple-600">
                  <Users size={16} />
                  {conclave.ntMemberCount} NT Members
                </div>

                <div className="flex items-center gap-2 text-orange-600">
                  <Crown size={16} />
                  {leaderNames[conclave.leader] || "Loading..."}
                </div>

              </div>

              {/* FOOTER */}
              <div className="flex justify-between items-center">
                <Link
                  href={`/user/conclave/${conclave.id}`}
                  className="text-indigo-600 text-sm font-semibold hover:underline"
                >
                  View Details →
                </Link>
              </div>

            </div>
          );
        })}

        {sortedEvents.length === 0 && (
          <div className="text-center text-white/70 py-10">
            No conclaves available.
          </div>
        )}

      </div>
    </div>
  );
}