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
  BookOpen,
  Briefcase,
  UserCheck,
  Target,
  Link,
  Handshake,
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
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const tabs = [
    { key: "agenda", label: "Agenda", icon: CalendarDays },
    { key: "documents", label: "Docs", icon: FileText },
    { key: "facilitators", label: "Facilitators", icon: UserCheck },
    { key: "knowledge", label: "Knowledge", icon: BookOpen },
    { key: "prospects", label: "Prospects", icon: Target },
    { key: "referrals", label: "Referrals", icon: Link },
    { key: "requirements", label: "Req.", icon: Briefcase },
    { key: "e2a", label: "E2A", icon: Handshake },
    { key: "121", label: "1-2-1", icon: Users },
    { key: "users", label: "Users", icon: Users },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b1120] via-[#0f172a] to-black flex justify-center">

      <div className="w-full max-w-md pb-12">

        {/* HERO CARD */}
        <div className="relative h-80 overflow-hidden rounded-3xl shadow-2xl mx-4 mt-6">
          <img
            src={eventInfo.imageUploads?.[0]?.image?.url || "/space.jpeg"}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

          <div className="relative z-10 flex flex-col items-center justify-center h-full text-white text-center px-6">
            <h1 className="text-xl font-bold">
              {eventInfo.Eventname}
            </h1>

            <p className="text-xs opacity-80 mt-2">
              {eventInfo.time?.toDate().toLocaleString()}
            </p>

            {timeLeft && (
              <div className="mt-4 bg-green-500 text-white text-xs px-4 py-2 rounded-full">
                In Progress
              </div>
            )}
          </div>
        </div>

        {/* TABS */}
        <div className="px-4 -mt-6 relative z-20">
          <div className="bg-white rounded-2xl shadow-xl p-2">
            <div className="flex overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex flex-col items-center justify-center px-4 py-2 min-w-[70px] transition ${
                      activeTab === tab.key
                        ? "text-orange-500"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <Icon size={18} />
                    <span className="text-[11px] mt-1">
                      {tab.label}
                    </span>

                    {activeTab === tab.key && (
                      <div className="h-[2px] w-6 bg-orange-500 mt-1 rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div className="px-4 mt-6 space-y-6">

          <div className="bg-white rounded-3xl shadow-lg p-6">

            {/* AGENDA */}
            {activeTab === "agenda" && (
              <>
                <h3 className="text-sm font-semibold mb-4">
                  Agenda
                </h3>
                <ul className="space-y-3">
                  {eventInfo.agenda?.map((item, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-3 text-sm text-gray-700"
                    >
                      <span className="w-6 h-6 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center text-[10px] font-semibold">
                        {idx + 1}
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </>
            )}

            {/* USERS */}
            {activeTab === "users" && (
              <>
                <h3 className="text-sm font-semibold mb-4">
                  Registered Users
                </h3>

                <div className="space-y-3">
                  {users.map((u) => (
                    <div
                      key={u.phone}
                      className="flex justify-between items-center bg-gray-50 rounded-xl p-3"
                    >
                      <span className="text-sm font-medium text-gray-700">
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
              </>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}