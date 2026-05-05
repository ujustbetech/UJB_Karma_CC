"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { doc, collection, onSnapshot, db } from "@/services/adminMonthlyMeetingFirebaseService";
import { auth } from "@/lib/firebase/firebaseClient";
import { signInWithCustomToken } from "firebase/auth";
import { COLLECTIONS } from "@/lib/utility_collection";
import { useAdminSession } from "@/context/adminSessionContext";

import TopicSection from "@/components/admin/monthlymeeting/sections/TopicSection";
import ParticipantSection from "@/components/admin/monthlymeeting/sections/ParticipantSection";
import E2ASection from "@/components/admin/monthlymeeting/sections/E2ASection";
import ProspectSection from "@/components/admin/monthlymeeting/sections/ProspectSection";
import KnowledgeSharingSection from "@/components/admin/monthlymeeting/sections/KnowledgeSharingSection";
import RequirementSection from "@/components/admin/monthlymeeting/sections/RequirementSection";
import DocumentUploadSection from "@/components/admin/monthlymeeting/sections/DocumentUploadSection";
import ImageUploadSection from "@/components/admin/monthlymeeting/sections/ImageUploadSection";
import RegisteredUsersSection from "@/components/admin/monthlymeeting/sections/RegisteredUsersSection";
import AddUserSection from "@/components/admin/monthlymeeting/sections/AddUserSection";
import ConclaveSection from "@/components/admin/monthlymeeting/sections/ConclaveSection";
import EventInfoSection from "@/components/admin/monthlymeeting/sections/EventInfoSection";

import Card from "@/components/ui/Card";
import Text from "@/components/ui/Text";

import {
  Info,
  BookOpen,
  Users,
  Brain,
  Target,
  ClipboardList,
  FileText,
  Image,
  UserPlus,
  Network,
} from "lucide-react";

export default function MonthlyMeetingDetailsPage() {
  const { eventId } = useParams();
  const searchParams = useSearchParams();
  const { admin } = useAdminSession();

  const [data, setData] = useState(null);
  const [active, setActive] = useState("basic");
  const [loading, setLoading] = useState(true);
  const [savingAll, setSavingAll] = useState(false);

  const basicRef = useRef();
  const topicRef = useRef();
  const participantRef = useRef();
  const e2aRef = useRef();
  const prospectRef = useRef();
  const knowledgeRef = useRef();
  const requirementRef = useRef();

  const [registeredCount, setRegisteredCount] = useState(0);
  const [presentCount, setPresentCount] = useState(0);

  useEffect(() => {
    const requestedTab = String(searchParams?.get("tab") || "").trim().toLowerCase();
    if (!requestedTab) return;

    const tabAliasMap = {
      basic: "basic",
      topic: "topic",
      participants: "participants",
      knowledge: "knowledge",
      e2a: "e2a",
      prospects: "prospects",
      requirements: "requirements",
      documents: "documents",
      images: "images",
      registered: "registered",
      adduser: "adduser",
      "add-users": "adduser",
      conclave: "conclave",
    };

    const resolvedTab = tabAliasMap[requestedTab];
    if (resolvedTab) {
      setActive(resolvedTab);
    }
  }, [searchParams]);

  const fetchData = async () => {};

  useEffect(() => {
    let cancelled = false;

    const ensureFirebaseStorageAuth = async () => {
      if (auth.currentUser) return;

      try {
        const res = await fetch("/api/admin/session/firebase-token", {
          credentials: "include",
        });

        if (!res.ok) return;
        const body = await res.json().catch(() => ({}));
        if (!body?.customToken) return;

        await signInWithCustomToken(auth, body.customToken);
      } catch {
        if (!cancelled) {
          console.warn("Unable to establish Firebase client auth for storage uploads.");
        }
      }
    };

    ensureFirebaseStorageAuth();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!eventId) return;

    setLoading(true);
    const ref = doc(db, COLLECTIONS.monthlyMeeting, eventId);
    const unsubscribe = onSnapshot(ref, (snap) => {
      setData(snap.exists() ? snap.data() : {});
      setLoading(false);
    });

    return () => unsubscribe();
  }, [eventId]);

  useEffect(() => {
    if (!data?.Eventname) return;
    document.title = `${data.Eventname} | Monthly Meeting`;
  }, [data?.Eventname]);

  useEffect(() => {
    if (!eventId) return;

    const unsub = onSnapshot(
      collection(db, COLLECTIONS.monthlyMeeting, eventId, "registeredUsers"),
      (snapshot) => {
        let present = 0;
        snapshot.forEach((docSnap) => {
          if (docSnap.data().attendanceStatus === true) present++;
        });

        setRegisteredCount(snapshot.size);
        setPresentCount(present);
      }
    );

    return () => unsub();
  }, [eventId]);

  const handleSaveAll = async () => {
    setSavingAll(true);

    const refs = [
      basicRef,
      topicRef,
      participantRef,
      e2aRef,
      prospectRef,
      knowledgeRef,
      requirementRef,
    ];

    let savedAny = false;

    for (const ref of refs) {
      if (ref.current?.isDirty?.()) {
        const ok = await ref.current.save();
        if (ok) savedAny = true;
      }
    }

    if (savedAny) await fetchData();
    setSavingAll(false);
  };

  const groupedSections = [
    {
      title: "Meeting",
      items: [
        { id: "basic", label: "Basic", icon: Info },
        { id: "topic", label: "Topic", icon: BookOpen },
        { id: "participants", label: "121", icon: Users },
        { id: "knowledge", label: "Knowledge", icon: Brain },
      ],
    },
    {
      title: "Business",
      items: [
        { id: "e2a", label: "E2A", icon: Network },
        { id: "prospects", label: "Prospects", icon: Target },
        { id: "requirements", label: "Requirements", icon: ClipboardList },
      ],
    },
    {
      title: "Media",
      items: [
        { id: "documents", label: "Documents", icon: FileText },
        { id: "images", label: "Images", icon: Image },
      ],
    },
    {
      title: "Users",
      items: [
        { id: "registered", label: "Users", icon: Users },
        { id: "adduser", label: "Add User", icon: UserPlus },
        { id: "conclave", label: "Conclave", icon: Network },
      ],
    },
  ];

  const renderSection = () => {
    switch (active) {
      case "basic":
        return (
          <EventInfoSection
            ref={basicRef}
            eventId={eventId}
            data={data}
            fetchData={fetchData}
            currentAdmin={admin}
          />
        );
      case "topic":
        return (
          <TopicSection
            ref={topicRef}
            eventID={eventId}
            data={data}
            fetchData={fetchData}
            currentAdmin={admin}
          />
        );
      case "participants":
        return (
          <ParticipantSection
            ref={participantRef}
            eventID={eventId}
            data={data}
            fetchData={fetchData}
            currentAdmin={admin}
          />
        );
      case "knowledge":
        return (
          <KnowledgeSharingSection
            ref={knowledgeRef}
            eventId={eventId}
            data={data}
            fetchData={fetchData}
            currentAdmin={admin}
          />
        );
      case "e2a":
        return <E2ASection ref={e2aRef} eventId={eventId} data={data} fetchData={fetchData} currentAdmin={admin} />;
      case "prospects":
        return (
          <ProspectSection
            ref={prospectRef}
            eventId={eventId}
            data={data}
            fetchData={fetchData}
            currentAdmin={admin}
          />
        );
      case "requirements":
        return (
          <RequirementSection
            ref={requirementRef}
            eventId={eventId}
            data={data}
            fetchData={fetchData}
            currentAdmin={admin}
          />
        );
      case "documents":
        return <DocumentUploadSection eventID={eventId} fetchData={fetchData} currentAdmin={admin} />;
      case "images":
        return <ImageUploadSection eventID={eventId} fetchData={fetchData} currentAdmin={admin} />;
      case "registered":
        return <RegisteredUsersSection eventId={eventId} data={data} currentAdmin={admin} />;
      case "adduser":
        return <AddUserSection eventId={eventId} data={data} currentAdmin={admin} />;
      case "conclave":
        return <ConclaveSection eventId={eventId} data={data} currentAdmin={admin} />;
      default:
        return null;
    }
  };

  const formatAuditValue = (value) => {
    if (value == null || value === "" || value === "—") return "—";

    if (typeof value === "string") {
      const trimmed = value.trim();

      if ((trimmed.startsWith("[") && trimmed.endsWith("]")) || (trimmed.startsWith("{") && trimmed.endsWith("}"))) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) return `${parsed.length} item(s)`;
          if (typeof parsed === "object") return `${Object.keys(parsed).length} field(s)`;
        } catch {
          // Keep as string if parsing fails.
        }
      }

      return trimmed.length > 90 ? `${trimmed.slice(0, 90)}...` : trimmed;
    }

    if (Array.isArray(value)) return `${value.length} item(s)`;
    if (typeof value === "object") return `${Object.keys(value).length} field(s)`;
    return String(value);
  };

  return (
    <div className="grid grid-cols-12 gap-6 pb-28 bg-slate-50 min-h-screen p-6">
      <div className="col-span-3">
        <Card className="sticky top-6 p-3">
          <Text variant="h3">{data?.Eventname || "Monthly Meeting"}</Text>

          <div className="mt-4 space-y-5">
            {groupedSections.map((group) => (
              <div key={group.title}>
                <div className="text-xs font-semibold text-slate-400 uppercase mb-2 px-2">
                  {group.title}
                </div>

                <div className="space-y-1">
                  {group.items.map((section) => {
                    const Icon = section.icon;
                    const isActive = active === section.id;

                    return (
                      <button
                        key={section.id}
                        title={section.label}
                        onClick={() => setActive(section.id)}
                        className={`relative w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition text-left overflow-hidden ${
                          isActive
                            ? "bg-blue-100 text-blue-700 font-medium"
                            : "hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        {isActive && (
                          <span className="absolute left-0 top-1 bottom-1 w-1 bg-blue-600 rounded" />
                        )}

                        <Icon size={17} className="shrink-0" />
                        <span className="truncate flex-1">{section.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="col-span-7 space-y-6">
        <Card className="p-4">
          <h1 className="text-xl font-semibold text-slate-800">
            {data?.Eventname || "Monthly Meeting"}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {data?.time
              ? new Date(data.time.seconds * 1000).toLocaleString()
              : "Event Date"}
          </p>
        </Card>

        <Card className="p-6 min-h-[400px]">
          {loading ? "Loading..." : renderSection()}
        </Card>

        <Card className="p-4">
          <Text variant="h4">Audit Trail</Text>
          <div className="mt-3 space-y-3 max-h-[45vh] overflow-y-auto pr-1">
            {Array.isArray(data?.auditLogs) && data.auditLogs.length > 0 ? (
              [...data.auditLogs].slice(-20).reverse().map((log) => (
                <div key={log.id || `${log.field}-${log.timestamp}`} className="rounded-lg bg-slate-50 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 break-words">
                        {log.section || "Meeting"}: {log.field || "update"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500 break-words">
                        {formatAuditValue(log.before)} {"→"} {formatAuditValue(log.after)}
                      </p>
                    </div>
                  </div>
                  <p className="mt-2 text-[11px] text-slate-400">
                    {log.changedBy?.name || "Unknown"} •{" "}
                    {log.timestamp ? new Date(log.timestamp).toLocaleString() : "Unknown time"}
                  </p>
                </div>
              ))
            ) : (
              <Text variant="muted">No audit activity yet.</Text>
            )}
          </div>
        </Card>
      </div>

      <div className="col-span-2">
        <div className="sticky top-6 space-y-4">
          <Card className="p-4">
            <Text variant="h4">Stats</Text>
            <p className="text-sm mt-2">{registeredCount} Registered</p>
            <p className="text-xs text-slate-500">Present: {presentCount}</p>
          </Card>

          <Card className="p-4">
            <Text variant="h4">Tips</Text>
            <ul className="mt-2 text-xs text-slate-600 space-y-1">
              <li>Add participants</li>
              <li>Upload docs</li>
              <li>Track attendance</li>
            </ul>
          </Card>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white p-4 flex justify-end gap-3 shadow-md">
        <button className="border px-4 py-2 rounded-lg">Cancel</button>

        <button
          onClick={handleSaveAll}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg"
        >
          {savingAll ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}



