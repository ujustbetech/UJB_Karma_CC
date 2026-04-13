"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  getDocs,
} from "firebase/firestore";
import { app } from "@/lib/firebase/firebaseClient";
import Link from "next/link";
import { Calendar, Video, MapPin, Crown, CalendarDays } from "lucide-react";
import { COLLECTIONS } from "@/lib/utility_collection";
import UserPageHeader from "@/components/user/UserPageHeader";

const db = getFirestore(app);

function formatMeetingDate(value) {
  if (typeof value?.seconds === "number") {
    const date = new Date(value.seconds * 1000);

    return `${date.toLocaleDateString("en-IN")} ${date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  }

  return "Date not set";
}

export default function ConclaveDetails() {
  const { id } = useParams();

  const [conclave, setConclave] = useState(null);
  const [meetings, setMeetings] = useState([]);

  useEffect(() => {
    if (!id) return;

    const fetchConclave = async () => {
      try {
        const conclaveRef = doc(db, COLLECTIONS.conclaves, id);
        const snap = await getDoc(conclaveRef);

        if (snap.exists()) {
          setConclave(snap.data());
        }
      } catch (error) {
        console.error("Error fetching conclave:", error);
      }
    };

    const fetchMeetings = async () => {
      try {
        const meetingsRef = collection(db, COLLECTIONS.conclaves, id, "meetings");
        const snap = await getDocs(meetingsRef);

        setMeetings(
          snap.docs.map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data(),
          }))
        );
      } catch (error) {
        console.error("Error fetching meetings:", error);
      }
    };

    fetchConclave();
    fetchMeetings();
  }, [id]);

  const nextMeetingLabel = useMemo(() => {
    const datedMeetings = meetings
      .map((meeting) => ({
        ...meeting,
        timestamp:
          typeof meeting.datetime?.seconds === "number"
            ? meeting.datetime.seconds * 1000
            : 0,
      }))
      .filter((meeting) => meeting.timestamp > 0)
      .sort((left, right) => left.timestamp - right.timestamp);

    if (!datedMeetings.length) {
      return "Schedule unavailable";
    }

    return formatMeetingDate({ seconds: Math.floor(datedMeetings[0].timestamp / 1000) });
  }, [meetings]);

  return (
    <main className="min-h-screen py-6">
      <div className="space-y-5">
        <UserPageHeader
          title={conclave?.conclaveStream || "Conclave"}
          description="Explore all scheduled conclave meetings, meeting modes, and quick access links from one place."
          icon={Crown}
        />

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
              Meetings
            </p>
            <div className="mt-3 flex items-center gap-2 text-slate-800">
              <CalendarDays size={18} className="text-orange-500" />
              <span className="text-2xl font-semibold">{meetings.length}</span>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
              Next Up
            </p>
            <p className="mt-3 text-sm font-medium text-slate-700">
              {nextMeetingLabel}
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {meetings.map((meeting) => {
            const isOnline = String(meeting.mode || "").toLowerCase() === "online";

            return (
              <div
                key={meeting.id}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="mb-3 flex items-center gap-2 text-xs text-gray-500">
                  <Calendar size={14} />
                  {formatMeetingDate(meeting.datetime)}
                </div>

                <div className="mb-4">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      isOnline
                        ? "bg-green-100 text-green-600"
                        : "bg-indigo-100 text-indigo-600"
                    }`}
                  >
                    {isOnline ? "Online Meeting" : "Offline Meeting"}
                  </span>
                </div>

                <h3 className="mb-4 text-lg font-semibold text-gray-800">
                  {meeting.meetingName || "Untitled Meeting"}
                </h3>

                <div className="mb-6 space-y-2 text-sm text-gray-600">
                  {isOnline ? (
                    <div className="flex items-center gap-2">
                      <Video size={16} className="text-green-600" />
                      <a
                        href={meeting.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="break-all text-green-600 hover:underline"
                      >
                        Join via Zoom
                      </a>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <MapPin size={16} className="text-indigo-600" />
                      <span>{meeting.venue || "Venue not specified"}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <Link
                    href={`/user/conclave/meeting/${meeting.id}`}
                    onClick={() => localStorage.setItem("conclaveId", id)}
                    className="text-sm font-semibold text-indigo-600 hover:underline"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            );
          })}

          {meetings.length === 0 && (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
              No meetings available.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
