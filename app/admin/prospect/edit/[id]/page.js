"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/firebaseClient";
import { COLLECTIONS } from "@/lib/utility_collection";

import Card from "@/components/ui/Card";
import Text from "@/components/ui/Text";
import Button from "@/components/ui/Button";

import {
  FileText,
  ClipboardCheck,
  MessageCircle,
  Layers,
  MessageSquare,
  CheckCircle,
  UserCheck,
  Activity,
  BookOpen,
  Book,
  Library,
  Mail,
  Phone,
  Users,
  Network,
  Calendar,
  Sparkles,
  Star,
  Eye,
  ClipboardList,
  Share2,
  GitBranch,
  Smile,
  Compass,
  ShieldCheck,
  Rocket,
  CalendarCheck,
  MessageSquareText,
} from "lucide-react";

import Edit from "@/components/admin/prospect/EditProspectForm";
import AditionalInfo from "@/components/admin/prospect/AdditionalInfo";
import FollowUpInfo from "@/components/admin/prospect/FollowUps";
import Assesment from "@/components/admin/prospect/Assesment";
import NTIntro from "@/components/admin/prospect/NTIntro";
import NTBriefCall from "@/components/admin/prospect/NTBriefCall";
import EnrollmentStage from "@/components/admin/prospect/EnrollmentStage";
import ProspectFormDetails from "@/components/admin/prospect/ProspectDetails";
import EngagementForm from "@/components/admin/prospect/Engagementform";
import EngagementActivity from "@/components/admin/prospect/EngagementActivity";
import ProspectFeedback from "@/components/admin/prospect/ProspectFeedback";
import KnowledgeSharing4 from "@/components/admin/prospect/KnowledgeSharing4";
import KnowledgeSharing5 from "@/components/admin/prospect/KnowledgeSharing5";
import KnowledgeSeries9 from "@/components/admin/prospect/KnowledgeSeries9";
import KnowledgeSeries10 from "@/components/admin/prospect/KnowledgeSeries10";
import CaseStudy1 from "@/components/admin/prospect/CaseStudy1";
import CaseStudy2 from "@/components/admin/prospect/CaseStudy2";
import AssesmentCall from "@/components/admin/prospect/AssesmentCall";
import AssesmentMail from "@/components/admin/prospect/AssesmentMail";
import Assessment from "@/components/admin/prospect/AssesmentBtn";
import Day17SocialMedia from "@/components/admin/prospect/SocialParticipation";
import Day19Referral from "@/components/admin/prospect/ReferralParticipation";
import Day21HappyFace from "@/components/admin/prospect/HappyFace";
import Day22VisionAlignment from "@/components/admin/prospect/VisionAllignment";
import Day24IntegrityReferral from "@/components/admin/prospect/IntegrityReferral";
import Day25CosmOrbiterImpact from "@/components/admin/prospect/CosmOrbiterImpact";
import Day27Events from "@/components/admin/prospect/Events";
import Day28Feedback from "@/components/admin/prospect/FinalFeedback";

const tabs = [
  "Prospect Details",
  "Assesment Form",
  "Meeting Logs",
  "Pre Enrollment Form",
  "Feedback Form",
  "Authentic Choice",
  "Enrollment Status",
  "Engagement Logs",
  "Introduction to UJustBe",
  "Terms Knowledge Transfer",
  "Knowledge Series",
  "Mail for NT",
  "Briefing on NT",
  "NT Introduction",
  "Referrals Knowledge",
  "Monthly Meeting Knowledge",
  "As Lived Part 1",
  "As Lived Part 2",
  "Review Session",
  "Assesment Completion",
  "Social Participation",
  "Referral Participation",
  "Happy Face",
  "Vision Allignment",
  "Integrity Referral",
  "CosmOrbiter Impact",
  "Event",
  "Feedback",
];

const icons = [
  FileText,
  ClipboardCheck,
  MessageCircle,
  Layers,
  MessageSquare,
  CheckCircle,
  UserCheck,
  Activity,
  BookOpen,
  Book,
  Library,
  Mail,
  Phone,
  Users,
  Network,
  Calendar,
  Sparkles,
  Star,
  Eye,
  ClipboardList,
  Share2,
  GitBranch,
  Smile,
  Compass,
  ShieldCheck,
  Rocket,
  CalendarCheck,
  MessageSquareText,
];

export default function EditAdminEvent() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [activeTab, setActiveTab] = useState(0);
  const [eventData, setEventData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvent = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        const docRef = doc(db, COLLECTIONS.prospect, id);
        const snap = await getDoc(docRef);

        if (snap.exists()) {
          setEventData(snap.data());
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id]);

  const nextTab = () => {
    if (activeTab < tabs.length - 1) {
      setActiveTab(activeTab + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const prevTab = () => {
    if (activeTab > 0) {
      setActiveTab(activeTab - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const exportProspect = () => {
    if (!eventData || !id) return;

    const headers = Object.keys(eventData);
    const rows = [
      headers.join(","),
      headers.map((header) => JSON.stringify(eventData[header] ?? "")).join(","),
    ];
    const csv = `data:text/csv;charset=utf-8,${rows.join("\n")}`;

    const link = document.createElement("a");
    link.href = encodeURI(csv);
    link.download = `Prospect_${id}.csv`;
    link.click();
  };

  const renderTab = () => {
    if (!eventData || !id) return null;

    switch (activeTab) {
      case 0:
        return <Edit data={eventData} id={id} />;
      case 1:
        return <ProspectFormDetails data={eventData} id={id} />;
      case 2:
        return <FollowUpInfo data={eventData} id={id} />;
      case 3:
        return <AditionalInfo data={eventData} id={id} />;
      case 4:
        return <ProspectFeedback data={eventData} id={id} />;
      case 5:
        return <Assesment data={eventData} id={id} />;
      case 6:
        return <EnrollmentStage data={eventData} id={id} />;
      case 7:
        return <EngagementForm data={eventData} id={id} />;
      case 8:
        return <EngagementActivity data={eventData} id={id} />;
      case 9:
        return <KnowledgeSharing4 data={eventData} id={id} />;
      case 10:
        return <KnowledgeSharing5 data={eventData} id={id} />;
      case 11:
        return <NTIntro data={eventData} id={id} />;
      case 12:
        return <NTBriefCall data={eventData} id={id} />;
      case 13:
        return <KnowledgeSeries9 data={eventData} id={id} />;
      case 14:
        return <KnowledgeSeries10 data={eventData} id={id} />;
      case 15:
        return <AssesmentMail data={eventData} id={id} />;
      case 16:
        return <CaseStudy1 data={eventData} id={id} />;
      case 17:
        return <CaseStudy2 data={eventData} id={id} />;
      case 18:
        return <AssesmentCall data={eventData} id={id} />;
      case 19:
        return <Assessment data={eventData} id={id} />;
      case 20:
        return <Day17SocialMedia data={eventData} id={id} />;
      case 21:
        return <Day19Referral data={eventData} id={id} />;
      case 22:
        return <Day21HappyFace data={eventData} id={id} />;
      case 23:
        return <Day22VisionAlignment data={eventData} id={id} />;
      case 24:
        return <Day24IntegrityReferral data={eventData} id={id} />;
      case 25:
        return <Day25CosmOrbiterImpact data={eventData} id={id} />;
      case 26:
        return <Day27Events data={eventData} id={id} />;
      case 27:
        return <Day28Feedback data={eventData} id={id} />;
      default:
        return null;
    }
  };

  return (
    <div className="grid grid-cols-12 gap-6 pb-28">
      <div className="col-span-2">
        <Card className="sticky top-6 p-3">
          <Text variant="h3">Prospect</Text>

          <div className="mt-4 space-y-2">
            {tabs.map((tab, index) => {
              const Icon = icons[index] || FileText;
              const isActive = activeTab === index;

              return (
                <button
                  key={index}
                  onClick={() => setActiveTab(index)}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                    isActive
                      ? "bg-brand-primary/10 font-medium text-brand-primary"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon size={16} />
                    {tab}
                  </span>
                </button>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="col-span-8 space-y-6">
        {loading ? (
          <Card className="p-6">
            <p>Loading...</p>
          </Card>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <Text variant="h1">{tabs[activeTab]}</Text>

              <Button variant="secondary" onClick={exportProspect}>
                Export
              </Button>
            </div>

            <Card className="p-6">{renderTab()}</Card>

            <div className="flex justify-between">
              <Button
                variant="secondary"
                onClick={prevTab}
                disabled={activeTab === 0}
              >
                Back
              </Button>

              {activeTab < tabs.length - 1 && (
                <Button onClick={nextTab}>Next</Button>
              )}
            </div>
          </>
        )}
      </div>

      <div className="col-span-2">
        <Card className="sticky top-6 p-4">
          <Text variant="h4">Tips</Text>

          <ul className="mt-2 space-y-1 text-xs text-slate-600">
            <li>Complete assessment form</li>
            <li>Add engagement logs</li>
            <li>Track follow-up meetings</li>
            <li>Fill knowledge sessions</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
