"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

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
} from "lucide-react";

import Edit from "@/components/admin/prospect/EditProspectForm";
import AditionalInfo from "@/components/admin/prospect/AdditionalInfo";
import FollowUpInfo from "@/components/admin/prospect/FollowUps";
import Assesment from "@/components/admin/prospect/Assesment";
import EnrollmentStage from "@/components/admin/prospect/EnrollmentStage";
import ProspectFormDetails from "@/components/admin/prospect/ProspectDetails";
import EngagementForm from "@/components/admin/prospect/Engagementform";
import ProspectFeedback from "@/components/admin/prospect/ProspectFeedback";

const tabs = [
  "Prospect Details",
  "Assesment Form",
  "Meeting Logs",
  "Pre Enrollment Form",
  "Feedback Form",
  "Authentic Choice",
  "Enrollment Status",
  "Engagement Logs",
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
];

export default function EditAdminEvent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const AUTHENTIC_CHOICE_TAB_INDEX = 5;

  const [activeTab, setActiveTab] = useState(0);
  const [eventData, setEventData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchEvent = async () => {
    if (!id) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/admin/prospects?id=${id}`, {
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch prospect");
      }

      if (data.prospect) {
        setEventData(data.prospect);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const isDeclinedByUJustBe = eventData?.status === "Decline by UJustBe";
  const isLockedTab = (index) =>
    isDeclinedByUJustBe && index > AUTHENTIC_CHOICE_TAB_INDEX;

  useEffect(() => {
    const tabParam = Number.parseInt(searchParams.get("tab") || "", 10);

    if (
      Number.isInteger(tabParam) &&
      tabParam >= 0 &&
      tabParam < tabs.length &&
      !isLockedTab(tabParam) &&
      tabParam !== activeTab
    ) {
      setActiveTab(tabParam);
    }
  }, [activeTab, isDeclinedByUJustBe, searchParams]);

  useEffect(() => {
    if (isLockedTab(activeTab)) {
      setActiveTab(AUTHENTIC_CHOICE_TAB_INDEX);
    }
  }, [activeTab, isDeclinedByUJustBe]);

  const setActiveTabWithQuery = (index) => {
    if (index < 0 || index >= tabs.length || isLockedTab(index)) {
      return;
    }

    setActiveTab(index);

    if (!id) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", String(index));
    router.replace(`/admin/prospect/edit/${id}?${params.toString()}`);
  };

  const nextTab = () => {
    const nextIndex = activeTab + 1;

    if (activeTab < tabs.length - 1 && !isLockedTab(nextIndex)) {
      setActiveTabWithQuery(nextIndex);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const prevTab = () => {
    if (activeTab > 0) {
      setActiveTabWithQuery(activeTab - 1);
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
        return <Assesment data={eventData} id={id} fetchData={fetchEvent} />;
      case 6:
        return <EnrollmentStage data={eventData} id={id} />;
      case 7:
        return <EngagementForm data={eventData} id={id} />;
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
              const isDisabled = isLockedTab(index);

              return (
                <button
                  key={index}
                  onClick={() => {
                    if (!isDisabled) {
                      setActiveTabWithQuery(index);
                    }
                  }}
                  disabled={isDisabled}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                    isActive
                      ? "bg-brand-primary/10 font-medium text-brand-primary"
                      : isDisabled
                      ? "cursor-not-allowed text-slate-400 opacity-60"
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
                <Button
                  onClick={nextTab}
                  disabled={isLockedTab(activeTab + 1)}
                >
                  Next
                </Button>
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
