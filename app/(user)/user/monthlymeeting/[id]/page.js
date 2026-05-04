"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  collection,
  doc,
  onSnapshot,
  db,
} from "@/services/adminMonthlyMeetingFirebaseService";
import { COLLECTIONS } from "@/lib/utility_collection";
import {
  fetchUserMonthlyMeetingDetails,
  registerUserForMonthlyMeeting,
} from "@/services/monthlyMeetingService";
import { useToast } from "@/components/ui/ToastProvider";
import {
  getVisibleMonthlyMeetingUserTabs,
} from "@/lib/monthlymeeting/userTabsConfig";

function toDateValue(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value?.toDate === "function") return value.toDate();
  if (typeof value?.seconds === "number") return new Date(value.seconds * 1000);

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDateTime(value) {
  const date = toDateValue(value);
  if (!date) return "";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function RenderRichText({ value, emptyLabel = "No details available." }) {
  if (!value) {
    return <p className="text-sm text-slate-500">{emptyLabel}</p>;
  }

  return (
    <div
      className="prose prose-sm max-w-none break-words overflow-hidden text-slate-700"
      dangerouslySetInnerHTML={{ __html: value }}
    />
  );
}

function isEnrollmentOpen(event) {
  if (typeof event?.enrollmentEnabled === "boolean") return event.enrollmentEnabled;
  if (event?.isEnrollmentOpen !== undefined) return event.isEnrollmentOpen;
  if (!event?.enrollmentDeadline) return true;
  return new Date(event.enrollmentDeadline).getTime() >= Date.now();
}

function EmptyState({ label }) {
  return <p className="text-sm text-slate-500">{label}</p>;
}

export default function EventDetailsPage() {
  const toast = useToast();
  const params = useParams();
  const id = params?.id;

  const [eventInfo, setEventInfo] = useState(null);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState("agenda");
  const [tabVisibilityConfig, setTabVisibilityConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchEventData = async () => {
      try {
        setLoading(true);
        const data = await fetchUserMonthlyMeetingDetails(id);
        setEventInfo(data.event || null);
        setUsers(Array.isArray(data.users) ? data.users : []);
        setTabVisibilityConfig(data.visibleTabsConfig || null);
      } catch (error) {
        console.error(error);
        setEventInfo(null);
        setUsers([]);
        setTabVisibilityConfig(null);
      } finally {
        setLoading(false);
      }
    };

    fetchEventData();
  }, [id]);

  useEffect(() => {
    if (!id) return;

    const eventRef = doc(db, COLLECTIONS.monthlyMeeting, id);
    const usersRef = collection(db, COLLECTIONS.monthlyMeeting, id, "registeredUsers");

    const unsubscribeEvent = onSnapshot(eventRef, (snapshot) => {
      if (snapshot.exists()) {
        setEventInfo((prev) => ({
          ...(snapshot.data() || {}),
          isUserRegistered: prev?.isUserRegistered || false,
        }));
      }
    });

    const unsubscribeUsers = onSnapshot(usersRef, (snapshot) => {
      const nextUsers = [];
      snapshot.forEach((docSnap) => {
        const user = docSnap.data() || {};
        nextUsers.push({
          phone: docSnap.id,
          name: user.name || "Unknown",
          category: user.category || "",
          ujbCode: user.ujbCode || "",
          attendance: user.attendanceStatus === true ? "Present" : "Pending",
          feedback: Array.isArray(user.feedback) ? user.feedback : [],
        });
      });

      setUsers(nextUsers);
    });

    return () => {
      unsubscribeEvent();
      unsubscribeUsers();
    };
  }, [id]);

  const eventTime = useMemo(() => formatDateTime(eventInfo?.time), [eventInfo]);

  const tabs = useMemo(
    () => getVisibleMonthlyMeetingUserTabs(tabVisibilityConfig),
    [tabVisibilityConfig]
  );

  useEffect(() => {
    if (!tabs.length) return;
    if (!tabs.some((tab) => tab.key === activeTab)) {
      setActiveTab(tabs[0].key);
    }
  }, [tabs, activeTab]);

  const handleRegister = async () => {
    if (!id || registering || eventInfo?.isUserRegistered || !isEnrollmentOpen(eventInfo)) return;

    try {
      setRegistering(true);
      const response = await registerUserForMonthlyMeeting(id);
      setEventInfo((prev) =>
        prev ? { ...prev, isUserRegistered: true } : prev
      );
      toast.success(
        response?.alreadyRegistered
          ? "You are already registered for this meeting"
          : "Registration successful"
      );
    } catch (error) {
      toast.error(error?.message || "Failed to register");
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!eventInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        Monthly meeting not found.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b1120] via-[#0f172a] to-black flex justify-center">
      <div className="w-full max-w-md pb-12">
        <div className="relative h-80 overflow-hidden rounded-3xl shadow-2xl mx-4 mt-6">
          <img
            src={eventInfo.imageUploads?.[0]?.image?.url || "/space.jpeg"}
            alt={eventInfo.Eventname || "Monthly meeting"}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

          <div className="relative z-10 flex flex-col items-center justify-center h-full text-white text-center px-6">
            <h1 className="text-xl font-bold">{eventInfo.Eventname}</h1>
            <p className="text-xs opacity-80 mt-2">{eventTime || "Date not set"}</p>
            <button
              type="button"
              onClick={handleRegister}
              disabled={registering || eventInfo?.isUserRegistered || !isEnrollmentOpen(eventInfo)}
              className="mt-3 rounded-full bg-emerald-500/90 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-white/30"
            >
              {eventInfo?.isUserRegistered
                ? "Registered"
                : !isEnrollmentOpen(eventInfo)
                ? "Enrollment Closed"
                : registering
                ? "Registering..."
                : "Register"}
            </button>
            {eventInfo.titleOfTheDay && (
              <div className="mt-4 bg-white/15 border border-white/20 text-white text-xs px-4 py-2 rounded-full">
                {eventInfo.titleOfTheDay}
              </div>
            )}
          </div>
        </div>

        <div className="px-4 -mt-6 relative z-20">
          <div className="bg-white rounded-2xl shadow-xl p-2">
            {tabs.length ? (
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
                      <span className="text-[11px] mt-1">{tab.label}</span>
                      {activeTab === tab.key && (
                        <div className="h-[2px] w-6 bg-orange-500 mt-1 rounded-full" />
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="px-3 py-4 text-sm text-slate-500">
                No monthly meeting sections are enabled right now.
              </p>
            )}
          </div>
        </div>

        <div className="px-4 mt-6 space-y-6">
          <div className="bg-white rounded-3xl shadow-lg p-6">
            {!tabs.length && <EmptyState label="No sections are available for this meeting right now." />}
            {activeTab === "agenda" && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-sm font-semibold mb-4">Agenda</h3>
                  {eventInfo.agenda?.length ? (
                    <ul className="space-y-3">
                      {eventInfo.agenda.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-sm text-gray-700">
                          <span className="w-6 h-6 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center text-[10px] font-semibold">
                            {idx + 1}
                          </span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <EmptyState label="No agenda added yet." />
                  )}
                </div>

                <div className="border-t pt-5">
                  <h3 className="text-sm font-semibold mb-3">Topic of the Day</h3>
                  <p className="text-base font-medium text-slate-800">
                    {eventInfo.titleOfTheDay || "No topic added yet."}
                  </p>
                <div className="mt-3 min-w-0 overflow-hidden">
                  <RenderRichText value={eventInfo.description} />
                </div>
                </div>
              </div>
            )}

            {activeTab === "documents" && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Documents</h3>
                {eventInfo.documentUploads?.length ? (
                  eventInfo.documentUploads.map((upload, index) => (
                    <div key={upload.timestamp || index} className="rounded-2xl border border-slate-200 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium text-slate-800">{upload.description || "Untitled upload"}</p>
                        <span className="text-[11px] bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                          {upload.category || "General"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{formatDateTime(upload.timestamp)}</p>
                      <div className="mt-3 space-y-2">
                        {(upload.files || []).map((file, fileIndex) => (
                          <a
                            key={`${file.name}-${fileIndex}`}
                            href={file.url}
                            target="_blank"
                            rel="noreferrer"
                            className="block text-sm text-blue-600 underline break-all"
                          >
                            {file.name || "View document"}
                          </a>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptyState label="No documents available yet." />
                )}
              </div>
            )}

            {activeTab === "facilitators" && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Facilitators</h3>
                {eventInfo.facilitatorSections?.length ? (
                  eventInfo.facilitatorSections.map((item, index) => (
                    <div key={index} className="rounded-2xl border border-slate-200 p-4 space-y-2">
                      <p className="font-medium text-slate-800">{item.name || "Unnamed facilitator"}</p>
                      <p className="text-xs text-slate-500">{formatDateTime(item.date)}</p>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">{item.topic || "No topic added."}</p>
                    </div>
                  ))
                ) : (
                  <EmptyState label="No facilitators added yet." />
                )}
              </div>
            )}

            {activeTab === "knowledge" && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Knowledge Sharing</h3>
                {eventInfo.knowledgeSections?.length ? (
                  eventInfo.knowledgeSections.map((item, index) => (
                    <div key={index} className="rounded-2xl border border-slate-200 p-4 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium text-slate-800">{item.topic || "Untitled topic"}</p>
                          <p className="text-xs text-slate-500">{item.name || "Unknown orbiter"}</p>
                        </div>
                        {item.status && (
                          <span className="text-[11px] bg-green-100 text-green-700 px-2 py-1 rounded-full">
                            {item.status}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">{item.description || "No description added."}</p>
                      {item.writeup && <RenderRichText value={item.writeup} emptyLabel="" />}
                      {item.referenceUrl && (
                        <a
                          href={item.referenceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="block text-sm text-blue-600 underline break-all"
                        >
                          {item.fileName || "Open reference"}
                        </a>
                      )}
                    </div>
                  ))
                ) : (
                  <EmptyState label="No knowledge-sharing entries yet." />
                )}
              </div>
            )}

            {activeTab === "prospects" && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Prospects</h3>
                {eventInfo.prospectSections?.length ? (
                  eventInfo.prospectSections.map((item, index) => (
                    <div key={index} className="rounded-2xl border border-slate-200 p-4 space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium text-slate-800">{item.prospectName || "Unnamed prospect"}</p>
                          <p className="text-xs text-slate-500">{item.prospect || "Unknown orbiter"}</p>
                        </div>
                        {item.stage && (
                          <span className="text-[11px] bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                            {item.stage}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">{item.prospectDescription || "No details added."}</p>
                    </div>
                  ))
                ) : (
                  <EmptyState label="No prospect entries yet." />
                )}
              </div>
            )}

            {activeTab === "referrals" && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Referrals</h3>
                {eventInfo.referralSections?.length ? (
                  eventInfo.referralSections.map((item, index) => (
                    <div key={index} className="rounded-2xl border border-slate-200 p-4 space-y-2">
                      <p className="font-medium text-slate-800">{item.name || "Unknown member"}</p>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">{item.description || "No description added."}</p>
                    </div>
                  ))
                ) : (
                  <EmptyState label="No referral entries yet." />
                )}
              </div>
            )}

            {activeTab === "requirements" && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Requirements</h3>
                {eventInfo.requirementSections?.length ? (
                  eventInfo.requirementSections.map((item, index) => (
                    <div key={index} className="rounded-2xl border border-slate-200 p-4 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium text-slate-800">{item.reqfrom || "Unknown member"}</p>
                        {item.stage && (
                          <span className="text-[11px] bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                            {item.stage}
                          </span>
                        )}
                      </div>
                      <RenderRichText value={item.reqDescription} />
                    </div>
                  ))
                ) : (
                  <EmptyState label="No requirements added yet." />
                )}
              </div>
            )}

            {activeTab === "e2a" && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">E2A</h3>
                {eventInfo.e2aSections?.length ? (
                  eventInfo.e2aSections.map((item, index) => (
                    <div key={index} className="rounded-2xl border border-slate-200 p-4 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium text-slate-800">{item.e2a || "Unnamed facilitator"}</p>
                          <p className="text-xs text-slate-500">{formatDateTime(item.e2aDate)}</p>
                        </div>
                        {item.status && (
                          <span className="text-[11px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                            {item.status}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">{item.e2aDesc || "No description added."}</p>
                      {item.notes && <RenderRichText value={item.notes} emptyLabel="" />}
                      {item.referenceUrl && (
                        <a
                          href={item.referenceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="block text-sm text-blue-600 underline break-all"
                        >
                          {item.fileName || "Open reference"}
                        </a>
                      )}
                    </div>
                  ))
                ) : (
                  <EmptyState label="No E2A entries yet." />
                )}
              </div>
            )}

            {activeTab === "121" && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">1-2-1 Interactions</h3>
                {eventInfo.sections?.length ? (
                  eventInfo.sections.map((item, index) => (
                    <div key={index} className="rounded-2xl border border-slate-200 p-4 space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium text-slate-800">
                          {item.selectedParticipant1 || "Unknown"} with {item.selectedParticipant2 || "Unknown"}
                        </p>
                        {item.status && (
                          <span className="text-[11px] bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
                            {item.status}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">{formatDateTime(item.interactionDate)}</p>
                    </div>
                  ))
                ) : (
                  <EmptyState label="No 1-2-1 interactions recorded yet." />
                )}
              </div>
            )}

            {activeTab === "users" && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold mb-1">Registered Users</h3>
                {users.length ? (
                  users.map((u) => (
                    <div key={u.phone} className="rounded-2xl border border-slate-200 p-4">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-700">{u.name}</p>
                          <p className="text-xs text-slate-500 mt-1">{u.phone}</p>
                          {(u.category || u.ujbCode) && (
                            <p className="text-xs text-slate-500 mt-1">
                              {[u.category, u.ujbCode].filter(Boolean).join(" | ")}
                            </p>
                          )}
                        </div>
                        <span
                          className={`text-xs font-semibold px-2 py-1 rounded-full ${
                            u.attendance === "Present"
                              ? "bg-green-100 text-green-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {u.attendance}
                        </span>
                      </div>
                      {u.feedback?.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {u.feedback.map((feedback, index) => (
                            <div key={index} className="rounded-xl bg-slate-50 p-3">
                              <p className="text-xs font-medium text-slate-700">
                                {feedback.predefined || "Feedback"}
                              </p>
                              <p className="text-xs text-slate-500 mt-1">
                                {feedback.custom && feedback.custom !== "None" ? feedback.custom : "No custom feedback"}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <EmptyState label="No registered users found yet." />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


