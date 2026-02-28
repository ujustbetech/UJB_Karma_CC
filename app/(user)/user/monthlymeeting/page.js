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
import { CalendarDays, Video } from "lucide-react";

const db = getFirestore(app);

export default function AllEvents() {
  const [events, setEvents] = useState([]);

  /* ================= FETCH EVENTS ================= */
  useEffect(() => {
    const fetchAllEvents = async () => {
      try {
        const storedPhoneNumber =
          localStorage.getItem("mmOrbiter");

        const querySnapshot = await getDocs(
          collection(db, "MonthlyMeeting")
        );

        const eventList = await Promise.all(
          querySnapshot.docs.map(async (eventDoc) => {
            const eventData = {
              id: eventDoc.id,
              ...eventDoc.data(),
            };

            if (storedPhoneNumber) {
              const regUserRef = doc(
                db,
                "MonthlyMeeting",
                eventDoc.id,
                "registeredUsers",
                storedPhoneNumber
              );

              const regUserSnap = await getDoc(regUserRef);
              eventData.isUserRegistered =
                regUserSnap.exists();
            }

            return eventData;
          })
        );

        setEvents(eventList);
      } catch (error) {
        console.error("Error fetching events:", error);
      }
    };

    fetchAllEvents();
  }, []);

  const sortedEvents = [...events].sort((a, b) => {
    const dateA = a.time?.toDate?.() || new Date(0);
    const dateB = b.time?.toDate?.() || new Date(0);
    return dateB - dateA;
  });

  return (
    <main className="min-h-screen px-6">
      <div className="max-w-7xl mx-auto">

        {/* HEADER */}
        <div className="mb-14">
          <h2 className="text-4xl font-bold text-gray-800">
            Monthly Meetings
          </h2>
          <p className="text-gray-500 mt-2">
            Discover referrals, growth insights and community impact.
          </p>
        </div>

        {/* EVENTS GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

          {sortedEvents.map((event) => {

            const eventDate = event.time?.toDate?.();
            const now = new Date();
            const diffMs = eventDate ? eventDate - now : 0;

            const isEnded = diffMs <= 0;
            const isWithinOneHour =
              diffMs > 0 && diffMs <= 60 * 60 * 1000;

            const referralCount =
              event.referralSections?.length || 0;
            const prospectCount =
              event.prospectSections?.length || 0;
            const requirementCount =
              event.requirementSections?.length || 0;
            const oneToOneCount =
              event.sections?.length || 0;
            const e2aCount =
              event.e2aSections?.length || 0;

            return (
              <Link
                key={event.id}
                href={`/user/monthlymeeting/${event.id}`}
                className="block bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition duration-300 cursor-pointer"
              >

                {/* EVENT IMAGE */}
                {event.imageUploads?.[0]?.image?.url && (
                  <img
                    src={event.imageUploads[0].image.url}
                    className="w-full h-56 object-cover"
                  />
                )}

                <div className="p-7 flex flex-col h-full">

                  {/* STATUS + DATE */}
                  <div className="flex justify-between items-center mb-4">
                    <span
                      className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        isEnded
                          ? "bg-gray-200 text-gray-600"
                          : "bg-indigo-100 text-indigo-600"
                      }`}
                    >
                      {isEnded ? "Completed" : "Upcoming"}
                    </span>

                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <CalendarDays size={14} />
                      {eventDate?.toLocaleString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  {/* TITLE */}
                  <h3 className="text-xl font-bold text-gray-800 mb-3">
                    {event.Eventname}
                  </h3>

                  {/* DESCRIPTION PREVIEW */}
                  <div
                    className="text-sm text-gray-600 line-clamp-3 mb-6"
                    dangerouslySetInnerHTML={{
                      __html: event.description,
                    }}
                  />

                  {/* IMPACT METRICS */}
                  <div className="grid grid-cols-3 gap-4 text-center mb-6">

                    <MetricBox color="indigo" value={referralCount} label="Referrals" />
                    <MetricBox color="green" value={prospectCount} label="Prospects" />
                    <MetricBox color="purple" value={oneToOneCount} label="1-2-1" />
                    <MetricBox color="orange" value={requirementCount} label="Requirements" />
                    <MetricBox color="pink" value={e2aCount} label="E2A" />

                  </div>

                  {/* ACTIONS */}
                  <div className="mt-auto flex justify-between items-center">

                    <span className="text-indigo-600 text-sm font-semibold">
                      View Details →
                    </span>

                    {isEnded ? (
                      event.isUserRegistered && (
                        <span className="text-xs text-green-600 font-semibold">
                          ✅ Registered
                        </span>
                      )
                    ) : isWithinOneHour ? (
                      <a
                        href={event.zoomLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-2 bg-green-600 text-white text-xs px-4 py-2 rounded-xl hover:bg-green-700 transition"
                      >
                        <Video size={14} />
                        Join
                      </a>
                    ) : event.isUserRegistered ? (
                      <span className="text-xs text-green-600 font-semibold">
                        ✅ Registered
                      </span>
                    ) : (
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="bg-indigo-600 text-white text-xs px-4 py-2 rounded-xl hover:bg-indigo-700 transition"
                      >
                        Register
                      </button>
                    )}

                  </div>

                </div>
              </Link>
            );
          })}

        </div>
      </div>
    </main>
  );
}

/* ================= METRIC COMPONENT ================= */

function MetricBox({ color, value, label }) {
  const bg = {
    indigo: "bg-indigo-50 text-indigo-600",
    green: "bg-green-50 text-green-600",
    purple: "bg-purple-50 text-purple-600",
    orange: "bg-orange-50 text-orange-600",
    pink: "bg-pink-50 text-pink-600",
  };

  return (
    <div className={`p-3 rounded-xl ${bg[color]}`}>
      <p className="text-lg font-bold">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}