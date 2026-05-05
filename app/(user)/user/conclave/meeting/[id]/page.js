"use client";

import React, { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
  CalendarDays,
  FileText,
  BookOpen,
  Users,
  ClipboardList,
  MessageCircle,
  Handshake,
} from "lucide-react";
import {
  fetchUserConclaveMeetingDetails,
  submitConclaveMeetingResponse,
} from "@/services/conclaveService";

function toDateValue(value) {
  if (!value) return null;
  if (typeof value?.seconds === "number") return new Date(value.seconds * 1000);

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function RenderList({ items = [], empty = "No data available." }) {
  if (!Array.isArray(items) || items.length === 0) {
    return <p className="text-sm text-slate-500">{empty}</p>;
  }

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={index} className="rounded-xl border border-slate-200 p-3">
          {item}
        </div>
      ))}
    </div>
  );
}

export default function MeetingDetails() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const conclaveId = String(searchParams.get("conclaveId") || "").trim();

  const [meetingInfo, setMeetingInfo] = useState(null);
  const [conclaveInfo, setConclaveInfo] = useState(null);
  const [leaderName, setLeaderName] = useState("");
  const [userName, setUserName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [activeTab, setActiveTab] = useState("Agenda");
  const [showModal, setShowModal] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [responseType, setResponseType] = useState(null);
  const [hasResponded, setHasResponded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!id || !conclaveId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setLoadError("");
        const data = await fetchUserConclaveMeetingDetails(conclaveId, id);
        setMeetingInfo(data.meeting || null);
        setConclaveInfo(data.conclave || null);
        setLeaderName(String(data.conclave?.leaderName || "").trim());
        setUserName(String(data.currentUser?.name || "").trim());
        setPhoneNumber(String(data.currentUser?.phoneNumber || "").trim());
        const existingStatus = String(data.response?.status || "").trim();
        const alreadyResponded = existingStatus === "Accepted" || existingStatus === "Declined";
        setHasResponded(alreadyResponded);
        setShowModal(!alreadyResponded);
      } catch (error) {
        console.error(error);
        setLoadError(error?.message || "Failed to load meeting");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, conclaveId]);

  const handleAccept = async () => {
    if (!conclaveId || !id) return;

    await submitConclaveMeetingResponse(conclaveId, id, {
      response: "Accepted",
    });
    setHasResponded(true);
    setShowModal(false);
  };

  const handleDeclineSubmit = async () => {
    if (!declineReason.trim() || !conclaveId || !id) return;

    await submitConclaveMeetingResponse(conclaveId, id, {
      response: "Declined",
      reason: declineReason,
    });
    setHasResponded(true);
    setShowModal(false);
  };

  const datetime = toDateValue(meetingInfo?.datetime);

  const tabs = [
    { key: "Agenda", icon: CalendarDays },
    { key: "MoM", icon: FileText },
    { key: "Knowledge Sharing", icon: BookOpen },
    { key: "E2A", icon: Handshake },
    { key: "Referrals", icon: Users },
    { key: "Requirements", icon: ClipboardList },
    { key: "Interactions", icon: MessageCircle },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "Agenda":
        return meetingInfo?.agenda || "No agenda available";
      case "MoM":
        return (
          <RenderList
            items={(meetingInfo?.documentUploads || []).flatMap((upload = {}) =>
              (upload.files || []).map((file = {}, idx) => (
                <a
                  key={`${upload.timestamp || "doc"}-${idx}`}
                  href={file.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 underline break-all"
                >
                  {file.name || "View document"}
                </a>
              ))
            )}
            empty="No meeting documents uploaded."
          />
        );
      case "Knowledge Sharing":
        return (
          <RenderList
            items={(meetingInfo?.knowledgeSections || []).map((item = {}) => (
              <div>
                <p className="font-semibold text-slate-800">{item.topic || "Untitled topic"}</p>
                <p className="text-xs text-slate-500 mt-1">{item.name || "Unknown member"}</p>
                <p className="text-sm mt-2 text-slate-700">{item.description || "No description"}</p>
              </div>
            ))}
            empty="No knowledge-sharing entries."
          />
        );
      case "Referrals":
        return (
          <RenderList
            items={(meetingInfo?.referralSections || []).map((item = {}) => (
              <div>
                <p className="font-semibold text-slate-800">
                  {(item.referralFrom || "Unknown")} {" -> "} {(item.referralTo || "Unknown")}
                </p>
                <p className="text-sm mt-2 text-slate-700">{item.description || "No description"}</p>
              </div>
            ))}
            empty="No referral entries."
          />
        );
      case "E2A":
        return (
          <RenderList
            items={(meetingInfo?.e2aSections || []).map((item = {}) => (
              <div>
                <p className="font-semibold text-slate-800">{item.e2a || "Unknown member"}</p>
                <p className="text-sm mt-2 text-slate-700">{item.e2aDesc || "No description"}</p>
              </div>
            ))}
            empty="No E2A entries."
          />
        );
      case "Requirements":
        return (
          <RenderList
            items={(meetingInfo?.requirementSections || []).map((item = {}) => (
              <div>
                <p className="font-semibold text-slate-800">{item.reqfrom || "Unknown member"}</p>
                <p className="text-sm mt-2 text-slate-700">{item.reqDescription || "No description"}</p>
              </div>
            ))}
            empty="No requirement entries."
          />
        );
      case "Interactions":
        return (
          <RenderList
            items={(meetingInfo?.sections || []).map((item = {}) => (
              <div>
                <p className="font-semibold text-slate-800">
                  {(item.selectedParticipant1 || "Unknown")} with {(item.selectedParticipant2 || "Unknown")}
                </p>
                <p className="text-sm mt-2 text-slate-700">{item.interactionDate ? `Date: ${new Date(item.interactionDate).toLocaleString("en-IN")}` : "Date not set"}</p>
              </div>
            ))}
            empty="No 1-to-1 interactions."
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b1120] via-[#0f172a] to-black flex justify-center">
      <div className="w-full max-w-md pb-16">
        {loading ? (
          <div className="mx-4 mt-6 rounded-3xl bg-white p-8 text-center text-slate-500">
            Loading meeting...
          </div>
        ) : null}

        {!loading && loadError ? (
          <div className="mx-4 mt-6 rounded-3xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-700">
            {loadError}
          </div>
        ) : null}

        {!loading && !loadError ? (
          <>
        <div className="relative h-72 overflow-hidden rounded-3xl shadow-2xl mx-4 mt-6">
          <img
            src="/space.jpeg"
            className="absolute inset-0 w-full h-full object-cover"
            alt="bg"
          />
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

          <div className="relative z-10 flex flex-col items-center justify-center h-full text-white text-center px-6">
            <h1 className="text-xl font-bold">{conclaveInfo?.conclaveStream}</h1>
            <p className="text-xs opacity-80 mt-2">Leader: {leaderName || "N/A"}</p>
          </div>
        </div>

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
                    <span className="text-[11px] mt-1">{tab.key}</span>
                    {activeTab === tab.key && (
                      <div className="h-[2px] w-6 bg-orange-500 mt-1 rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="px-4 mt-6">
          <div className="bg-white rounded-3xl shadow-lg p-6">
            <h3 className="text-sm font-semibold mb-4">{activeTab}</h3>
            <div className="text-sm text-gray-700 leading-relaxed">
              {renderTabContent()}
            </div>
          </div>
        </div>
          </>
        ) : null}
      </div>

      {!loading && !loadError && !hasResponded && showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm">
            {!responseType && (
              <>
                <h2 className="text-lg font-semibold text-center mb-1">
                  Are you available?
                </h2>
                <p className="text-xs text-center text-slate-500 mb-6">
                  {userName || phoneNumber}
                </p>
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
                <h2 className="text-lg font-semibold mb-4">Reason for Decline</h2>

                <textarea
                  className="w-full border rounded-xl p-3 text-sm focus:ring-2 focus:ring-orange-400 outline-none"
                  rows={4}
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
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


