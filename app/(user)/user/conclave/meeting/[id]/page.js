"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { app } from "@/firebaseConfig";
import { COLLECTIONS } from "@/lib/utility_collection";

import {
  CalendarDays,
  FileText,
  BookOpen,
  Users,
  ClipboardList,
  MessageCircle,
} from "lucide-react";

const db = getFirestore(app);

export default function MeetingDetails() {
  const { id } = useParams();

  const [meetingInfo, setMeetingInfo] = useState(null);
  const [conclaveInfo, setConclaveInfo] = useState(null);
  const [leaderName, setLeaderName] = useState("");

  const [userName, setUserName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const [activeTab, setActiveTab] = useState("Agenda");

  const [showModal, setShowModal] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [responseType, setResponseType] = useState(null);

  const conclaveId =
    typeof window !== "undefined"
      ? localStorage.getItem("conclaveId")
      : null;

  /* ================= FETCH ================= */
  useEffect(() => {
    const fetchData = async () => {
      const phone = localStorage.getItem("mmOrbiter");
      if (!phone || !id || !conclaveId) return;

      setPhoneNumber(phone);

      const q = query(
        collection(db, COLLECTIONS.userDetail),
        where("MobileNo", "==", phone)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        setUserName(snap.docs[0].data()["Name"] || "");
      }

      const meetingRef = doc(
        db,
        COLLECTIONS.conclaves,
        conclaveId,
        "meetings",
        id
      );
      const meetingSnap = await getDoc(meetingRef);
      if (meetingSnap.exists()) {
        setMeetingInfo(meetingSnap.data());
      }

      const conclaveRef = doc(db, COLLECTIONS.conclaves, conclaveId);
      const conclaveSnap = await getDoc(conclaveRef);

      if (conclaveSnap.exists()) {
        const data = conclaveSnap.data();
        setConclaveInfo(data);

        if (data.leader) {
          const q2 = query(
            collection(db, COLLECTIONS.userDetail),
            where("MobileNo", "==", data.leader)
          );
          const leaderSnap = await getDocs(q2);
          if (!leaderSnap.empty) {
            setLeaderName(leaderSnap.docs[0].data()["Name"]);
          }
        }
      }

      setShowModal(true);
    };

    fetchData();
  }, [id, conclaveId]);

  /* ================= ACCEPT ================= */
  const handleAccept = async () => {
    await setDoc(
      doc(
        db,
        COLLECTIONS.conclaves,
        conclaveId,
        "meetings",
        id,
        "registeredUsers",
        phoneNumber
      ),
      {
        phoneNumber,
        name: userName,
        response: "Accepted",
        responseTime: new Date(),
      },
      { merge: true }
    );
    setShowModal(false);
  };

  const handleDeclineSubmit = async () => {
    if (!declineReason.trim()) return;

    await setDoc(
      doc(
        db,
        COLLECTIONS.conclaves,
        conclaveId,
        "meetings",
        id,
        "registeredUsers",
        phoneNumber
      ),
      {
        phoneNumber,
        name: userName,
        response: "Declined",
        reason: declineReason,
        responseTime: new Date(),
      },
      { merge: true }
    );
    setShowModal(false);
  };

  const datetime = meetingInfo?.datetime?.seconds
    ? new Date(meetingInfo.datetime.seconds * 1000)
    : null;

  const tabs = [
    { key: "Agenda", icon: CalendarDays },
    { key: "MoM", icon: FileText },
    { key: "Knowledge Sharing", icon: BookOpen },
    { key: "Referrals", icon: Users },
    { key: "Requirements", icon: ClipboardList },
    { key: "Interactions", icon: MessageCircle },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "Agenda":
        return meetingInfo?.agenda || "No agenda available";
      case "MoM":
        return "Minutes of meeting section";
      case "Knowledge Sharing":
        return "Knowledge sharing content";
      case "Referrals":
        return "Referral details";
      case "Requirements":
        return "Requirement details";
      case "Interactions":
        return "Interaction details";
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b1120] via-[#0f172a] to-black flex justify-center">

      <div className="w-full max-w-md pb-16">

        {/* HERO */}
        <div className="relative h-72 overflow-hidden rounded-3xl shadow-2xl mx-4 mt-6">
          <img
            src="/space.jpeg"
            className="absolute inset-0 w-full h-full object-cover"
            alt="bg"
          />
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

          <div className="relative z-10 flex flex-col items-center justify-center h-full text-white text-center px-6">
            <h1 className="text-xl font-bold">
              {conclaveInfo?.conclaveStream}
            </h1>
            <p className="text-xs opacity-80 mt-2">
              Leader: {leaderName || "N/A"}
            </p>
          </div>
        </div>

        {/* MEETING CARD */}
        <div className="px-4 -mt-6 relative z-20">
          <div className="bg-white rounded-3xl shadow-xl p-6">
            <h2 className="text-lg font-semibold text-gray-800">
              {meetingInfo?.meetingName}
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              {datetime?.toLocaleString("en-GB")}
            </p>
          </div>
        </div>

        {/* ICON TABS */}
        <div className="px-4 mt-6">
          <div className="bg-white rounded-2xl shadow-xl p-2">
            <div className="flex overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex flex-col items-center justify-center px-4 py-2 min-w-[80px] transition ${
                      activeTab === tab.key
                        ? "text-orange-500"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <Icon size={18} />
                    <span className="text-[11px] mt-1">
                      {tab.key}
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

        {/* TAB CONTENT */}
        <div className="px-4 mt-6">
          <div className="bg-white rounded-3xl shadow-lg p-6">
            <h3 className="text-sm font-semibold mb-4">
              {activeTab}
            </h3>
            <div className="text-sm text-gray-700 leading-relaxed">
              {renderTabContent()}
            </div>
          </div>
        </div>

      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm">

            {!responseType && (
              <>
                <h2 className="text-lg font-semibold text-center mb-6">
                  Are you available?
                </h2>

                <div className="flex justify-center gap-4">
                  <button
                    onClick={handleAccept}
                    className="bg-green-600 text-white px-6 py-2 rounded-xl hover:bg-green-700 transition"
                  >
                    Yes
                  </button>

                  <button
                    onClick={() => setResponseType("decline")}
                    className="bg-red-500 text-white px-6 py-2 rounded-xl hover:bg-red-600 transition"
                  >
                    No
                  </button>
                </div>
              </>
            )}

            {responseType === "decline" && (
              <>
                <h2 className="text-lg font-semibold mb-4">
                  Reason for Decline
                </h2>

                <textarea
                  className="w-full border rounded-xl p-3 text-sm focus:ring-2 focus:ring-orange-400 outline-none"
                  rows={4}
                  value={declineReason}
                  onChange={(e) =>
                    setDeclineReason(e.target.value)
                  }
                  placeholder="Enter reason..."
                />

                <div className="flex justify-end gap-3 mt-4">
                  <button
                    onClick={handleDeclineSubmit}
                    className="bg-orange-500 text-white px-4 py-2 rounded-xl"
                  >
                    Submit
                  </button>
                  <button
                    onClick={() => setResponseType(null)}
                    className="bg-gray-200 px-4 py-2 rounded-xl"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      )}
    </div>
  );
}