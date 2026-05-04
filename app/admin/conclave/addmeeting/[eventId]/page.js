"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { fetchAdminConclaveMeetingDetails } from "@/services/adminConclaveService";

import Card from "@/components/ui/Card";
import Text from "@/components/ui/Text";
import Button from "@/components/ui/Button";
import EventInfoSkeleton from "@/components/skeleton/EventInfoSkeleton";

import KnowledgeSharingSection from "@/components/admin/conclave/sections/KnowledgeSharingSection";
import ParticipantSection from "@/components/admin/conclave/sections/ParticipantSection";
import RequirementSection from "@/components/admin/conclave/sections/RequirementSection";

import ProspectSection from "@/components/admin/conclave/sections/ProspectSection";
import ReferralSection from "@/components/admin/conclave/sections/ReferralSection";
import DocumentUploadSection from "@/components/admin/conclave/sections/DocumentUploadSection";
import RegisteredUsersSection from "@/components/admin/conclave/sections/RegisteredUsersSection";
import MeetingDetailsSection from "@/components/admin/conclave/sections/MeetingDetailsSection";

import {
  Info,
  Brain,
  Users,
  ClipboardList,
  Target,
  Network,
  FileText,
  ChevronLeft,
  ChevronRight,
  Save,
} from "lucide-react";

export default function ConclaveMeetingDetailsPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const meetingId = params?.eventId;
  const conclaveId = searchParams.get("conclaveId");

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("details");
  const [savingAll, setSavingAll] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Refs for sections that support inline editing and validation
  const participantRef = useRef();
  const knowledgeRef = useRef();
  const requirementRef = useRef();
  const prospectRef = useRef();
  const referralRef = useRef();
  const [summaryOpen, setSummaryOpen] = useState(true);

  const fetchData = async () => {
    if (!conclaveId || !meetingId) return;

    setLoading(true);

    try {
      const meeting = await fetchAdminConclaveMeetingDetails(conclaveId, meetingId);
      setData(meeting || {});
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [meetingId, conclaveId]);

  const handleSaveAll = async () => {
    setSavingAll(true);

    const refs = [participantRef, knowledgeRef, requirementRef, prospectRef, referralRef];
    let savedAny = false;

    for (const ref of refs) {
      if (ref.current?.isDirty?.()) {
        const ok = await ref.current?.save?.();
        if (ok) savedAny = true;
      }
    }

    if (savedAny) {
      await fetchData();
    }
    
    setSavingAll(false);
  };

  const menuItems = [
    { id: "details", label: "Meeting Details", icon: Info },
    { id: "knowledge", label: "Knowledge Sharing", icon: Brain },
    { id: "participants", label: "121 Interaction", icon: Users },
    { id: "requirements", label: "Requirements", icon: ClipboardList },
    { id: "prospects", label: "Prospects", icon: Target },
    { id: "referrals", label: "Referrals", icon: Network },
    { id: "documents", label: "Upload Agenda", icon: FileText },
    { id: "registered", label: "Registered Users", icon: Users },
  ];

  const renderSection = () => {
    switch (activeSection) {
      case "details":
        return (
          <MeetingDetailsSection
            conclaveId={conclaveId}
            meetingId={meetingId}
            data={data}
            fetchData={fetchData}
          />
        );
      case "knowledge":
        return (
          <KnowledgeSharingSection
            ref={knowledgeRef}
            conclaveId={conclaveId}
            meetingId={meetingId}
            data={data}
            fetchData={fetchData}
          />
        );
      case "participants":
        return (
          <ParticipantSection
            ref={participantRef}
            conclaveId={conclaveId}
            meetingId={meetingId}
            data={data}
            fetchData={fetchData}
          />
        );
      case "requirements":
        return (
          <RequirementSection
            ref={requirementRef}
            conclaveId={conclaveId}
            meetingId={meetingId}
            data={data}
            fetchData={fetchData}
          />
        );
      case "prospects":
        return (
          <ProspectSection
            ref={prospectRef}
            conclaveId={conclaveId}
            meetingId={meetingId}
            data={data}
            fetchData={fetchData}
          />
        );
      case "referrals":
        return (
          <ReferralSection
            ref={referralRef}
            conclaveId={conclaveId}
            meetingId={meetingId}
            data={data}
            fetchData={fetchData}
          />
        );
      case "documents":
        return (
          <DocumentUploadSection
            conclaveId={conclaveId}
            meetingId={meetingId}
            data={data}
            fetchData={fetchData}
          />
        );
      case "registered":
        return (
          <RegisteredUsersSection
            conclaveId={conclaveId}
            meetingId={meetingId}
            data={data}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={`grid gap-6 min-h-screen transition-all duration-300 ${
        isSidebarOpen ? "grid-cols-[260px_1fr]" : "grid-cols-[70px_1fr]"
      }`}
    >
      <Card className="px-3 py-4 h-fit sticky top-4 bg-[#f3f4f6] border-0 shadow-none rounded-2xl flex flex-col overflow-hidden transition-all duration-300">
          <div
            className={`mb-4 flex cursor-pointer items-center ${
              isSidebarOpen ? "justify-between" : "justify-center"
            }`}
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            title="Toggle Sidebar"
          >
            {isSidebarOpen && <Text variant="h3" className="truncate flex-1">Meeting Profile</Text>}
            <Button variant="ghost" size="sm" className="p-1 shrink-0">
              {isSidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
            </Button>
          </div>

          <div className="space-y-4">
            <Button
              className={`w-full bg-blue-600 text-white transition-all ${
                !isSidebarOpen ? "px-0 flex justify-center" : ""
              }`}
              onClick={handleSaveAll}
              title="Save All Changes"
            >
              {isSidebarOpen ? (savingAll ? "Saving..." : "Save All Changes") : <Save size={18} />}
            </Button>

            <div className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;

                return (
                  <div
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    title={item.label}
                    className={`relative flex items-center gap-3 py-2 rounded-lg text-sm cursor-pointer transition-all ${
                      isSidebarOpen ? "px-3" : "justify-center px-0"
                    } ${
                      isActive
                        ? "bg-gray-200 text-slate-900 font-medium"
                        : "text-slate-600 hover:bg-gray-100"
                    }`}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-1 bottom-1 w-1 bg-slate-800 rounded-r" />
                    )}
                    <Icon size={isSidebarOpen ? 16 : 20} className="shrink-0" />
                    {isSidebarOpen && <span className="truncate flex-1">{item.label}</span>}
                  </div>
                );
              })}
            </div>
          </div>

      </Card>

      <div className="space-y-6 min-w-0">
        <Card>
          <div className="min-w-0">
            <Text variant="h1">Conclave Meeting Details</Text>
            <Text variant="muted">Conclave ID: {conclaveId}</Text>
          </div>
        </Card>

        <Card className="space-y-4">
          <div className="flex items-center justify-between gap-6">
            <Text variant="h3">Meeting Summary</Text>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setSummaryOpen((open) => !open)}
            >
              {summaryOpen ? "Hide Summary" : "Show Summary"}
            </Button>
          </div>

          {summaryOpen && (
            <div className="grid gap-3 text-sm text-slate-600 md:grid-cols-2 xl:grid-cols-3">
              <div className="flex justify-between gap-4 rounded-lg bg-slate-50 px-3 py-2">
                <span>Meeting Name</span>
                <span className="text-right">{data?.meetingName || "-"}</span>
              </div>
              <div className="flex justify-between gap-4 rounded-lg bg-slate-50 px-3 py-2">
                <span>Knowledge Entries</span>
                <span>{data?.knowledgeSections?.length || 0}</span>
              </div>
              <div className="flex justify-between gap-4 rounded-lg bg-slate-50 px-3 py-2">
                <span>1:1 Interactions</span>
                <span>{data?.sections?.length || 0}</span>
              </div>
              <div className="flex justify-between gap-4 rounded-lg bg-slate-50 px-3 py-2">
                <span>Requirements</span>
                <span>{data?.requirementSections?.length || 0}</span>
              </div>
              <div className="flex justify-between gap-4 rounded-lg bg-slate-50 px-3 py-2">
                <span>Prospects</span>
                <span>{data?.prospectSections?.length || 0}</span>
              </div>
              <div className="flex justify-between gap-4 rounded-lg bg-slate-50 px-3 py-2">
                <span>Referrals</span>
                <span>{data?.referralSections?.length || 0}</span>
              </div>
            </div>
          )}
        </Card>

        <Card>{loading ? <EventInfoSkeleton /> : renderSection()}</Card>
      </div>
    </div>
  );
}
