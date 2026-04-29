"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
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
    await fetchData();
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
            conclaveId={conclaveId}
            meetingId={meetingId}
            data={data}
            fetchData={fetchData}
          />
        );
      case "participants":
        return (
          <ParticipantSection
            conclaveId={conclaveId}
            meetingId={meetingId}
            data={data}
            fetchData={fetchData}
          />
        );
      case "requirements":
        return (
          <RequirementSection
            conclaveId={conclaveId}
            meetingId={meetingId}
            data={data}
            fetchData={fetchData}
          />
        );
      case "prospects":
        return (
          <ProspectSection
            conclaveId={conclaveId}
            meetingId={meetingId}
            data={data}
            fetchData={fetchData}
          />
        );
      case "referrals":
        return (
          <ReferralSection
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
    <div className="grid grid-cols-[260px_1fr_300px] gap-6 min-h-screen pb-32">
      <Card className="px-3 py-4 h-fit sticky top-4 bg-[#f3f4f6] border-0 shadow-none rounded-2xl">
        <Text variant="h3" className="mb-4">Meeting Profile</Text>

        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;

            return (
              <div
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm cursor-pointer transition-all ${
                  isActive
                    ? "bg-gray-200 text-slate-900 font-medium"
                    : "text-slate-600 hover:bg-gray-100"
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-1 bottom-1 w-1 bg-slate-800 rounded-r" />
                )}
                <Icon size={16} />
                {item.label}
              </div>
            );
          })}
        </div>
      </Card>

      <div className="space-y-6">
        <Card className="flex items-center justify-between">
          <div>
            <Text variant="h1">Conclave Meeting Details</Text>
            <Text variant="muted">Conclave ID: {conclaveId}</Text>
          </div>

          <Button onClick={handleSaveAll}>
            {savingAll ? "Saving..." : "Save All Changes"}
          </Button>
        </Card>

        <Card>{loading ? <EventInfoSkeleton /> : renderSection()}</Card>
      </div>

      <div className="space-y-4">
        <Card>
          <Text variant="muted">Meeting Summary</Text>
        </Card>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40">
        <div className="max-w-[1400px] mx-auto px-6 pb-4">
          <Card className="flex items-center justify-between px-4 py-3 shadow-lg border">
            <Text className="text-sm text-slate-600">
              Don&apos;t forget to save your changes
            </Text>
            <Button onClick={handleSaveAll}>
              {savingAll ? "Saving..." : "Save All Changes"}
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}


