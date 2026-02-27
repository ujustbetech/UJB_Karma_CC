"use client";

import { use, useEffect, useState } from "react";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  getDocs,
} from "firebase/firestore";
import { app } from "@/firebaseConfig";
import {
  FileText,
  Users,
  CalendarDays,
  Clock,
  Sparkles,
} from "lucide-react";

const db = getFirestore(app);

export default function EventDetailsPage({ params }) {
  const { id } = use(params);

  const [eventInfo, setEventInfo] = useState(null);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState("agenda");
  const [timeLeft, setTimeLeft] = useState(null);

  /* ================= FETCH EVENT ================= */
  useEffect(() => {
    if (!id) return;

    const fetchEventData = async () => {
      try {
        const eventSnap = await getDoc(doc(db, "MonthlyMeeting", id));
        if (eventSnap.exists()) setEventInfo(eventSnap.data());

        const regSnap = await getDocs(
          collection(db, "MonthlyMeeting", id, "registeredUsers")
        );

        const userDetails = await Promise.all(
          regSnap.docs.map(async (docSnap) => {
            const phone = docSnap.id;
            const regUserData = docSnap.data();

            const userDoc = await getDoc(doc(db, "userdetails", phone));
            const name = userDoc.exists()
              ? userDoc.data()[" Name"]
              : "Unknown";

            return {
              phone,
              name,
              attendance:
                regUserData.attendanceStatus === true
                  ? "Yes"
                  : "No",
            };
          })
        );

        setUsers(userDetails);
      } catch (error) {
        console.error("Error loading event:", error);
      }
    };

    fetchEventData();
  }, [id]);

  /* ================= COUNTDOWN ================= */
  useEffect(() => {
    if (!eventInfo?.time) return;

    const targetTime = eventInfo.time.toDate().getTime();

    const interval = setInterval(() => {
      const diff = targetTime - Date.now();

      if (diff <= 0) {
        setTimeLeft(null);
        clearInterval(interval);
        return;
      }

      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [eventInfo]);

  if (!eventInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const renderCardSection = (title, content) => (
    <div className="bg-white rounded-3xl shadow-lg border p-8 mb-8 transition hover:shadow-xl">
      <h3 className="text-xl font-semibold mb-6 text-gray-800">
        {title}
      </h3>
      {content}
    </div>
  );

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-white">

      {/* HERO SECTION */}
      <div className="relative h-96 overflow-hidden">
        <img
          src={eventInfo.imageUploads?.[0]?.image?.url || "/space.jpeg"}
          className="absolute inset-0 w-full h-full object-cover"
        />

        <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/80 backdrop-blur-sm" />

        <div className="relative z-10 flex flex-col items-center justify-center h-full text-white text-center px-6">
          <h1 className="text-4xl font-bold mb-4">
            {eventInfo.Eventname}
          </h1>

          <div className="flex items-center gap-4 text-sm opacity-90 mb-4">
            <CalendarDays size={16} />
            {eventInfo.time?.toDate().toLocaleString()}
          </div>

          {timeLeft && (
            <div className="bg-white/20 backdrop-blur-md px-8 py-4 rounded-2xl shadow-lg">
              <p className="text-2xl font-semibold">
                {timeLeft.days > 0
                  ? `${timeLeft.days}d ${timeLeft.hours}h ${timeLeft.minutes}m`
                  : `${timeLeft.hours}h ${timeLeft.minutes}m ${timeLeft.seconds}s`}
              </p>
              <p className="text-xs opacity-80 mt-1">
                Time Remaining
              </p>
            </div>
          )}
        </div>
      </div>

      {/* CONTENT */}
      <div className="max-w-6xl mx-auto px-6 py-14">

        {/* USER COUNT */}
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <Users size={20} className="text-indigo-600" />
            <span className="font-medium text-gray-700">
              {users.length} people joining this meeting
            </span>
          </div>
        </div>

        {/* TABS */}
        <div className="flex flex-wrap gap-3 mb-12">
          {[
            "agenda",
            "documents",
            "facilitators",
            "knowledge",
            "prospects",
            "referrals",
            "requirements",
            "e2a",
            "121",
            "users",
          ].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition ${
                activeTab === tab
                  ? "bg-indigo-600 text-white shadow-md"
                  : "bg-white border text-gray-700 hover:bg-gray-100"
              }`}
            >
              {tab.toUpperCase()}
            </button>
          ))}
        </div>

        {/* TAB CONTENT */}

        {activeTab === "agenda" &&
          renderCardSection(
            "Agenda",
            <ul className="space-y-3">
              {eventInfo.agenda?.map((item, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-3 text-gray-700"
                >
                  <span className="w-7 h-7 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-semibold">
                    {idx + 1}
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          )}

        {activeTab === "documents" &&
          renderCardSection(
            "Documents",
            eventInfo.documentUploads?.map((doc, idx) => (
              <div key={idx} className="mb-6">
                <p className="font-semibold text-gray-800 mb-2">
                  {doc.description}
                </p>
                {doc.files?.map((file, i) => (
                  <a
                    key={i}
                    href={file.url}
                    target="_blank"
                    className="flex items-center gap-2 text-indigo-600 text-sm mt-1 hover:underline"
                  >
                    <FileText size={16} />
                    {file.name}
                  </a>
                ))}
              </div>
            ))
          )}

        {activeTab === "users" &&
          renderCardSection(
            "Registered Users",
            users.length === 0 ? (
              <p>No users registered.</p>
            ) : (
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
                {users.map((u) => (
                  <div
                    key={u.phone}
                    className="flex items-center justify-between bg-gray-50 rounded-2xl p-4 hover:shadow-md transition"
                  >
                    <span className="font-medium text-gray-700">
                      {u.name}
                    </span>
                    <span
                      className={`text-xs font-semibold ${
                        u.attendance === "Yes"
                          ? "text-green-600"
                          : "text-gray-400"
                      }`}
                    >
                      {u.attendance}
                    </span>
                  </div>
                ))}
              </div>
            )
          )}

      </div>
    </main>
  );
}