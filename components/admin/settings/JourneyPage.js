"use client";

import { useState } from "react";
import { Mail, MessageSquareText } from "lucide-react";

import Card from "@/components/ui/Card";
import Text from "@/components/ui/Text";

const JOURNEY_TEMPLATE_ITEMS = [
  { id: "meeting_logs", name: "Meeting Logs", file: "components/admin/prospect/FollowUps.js" },
  { id: "pre_enrollment_form", name: "Pre Enrollment Form", file: "components/admin/prospect/AdditionalInfo.js" },
  { id: "authentic_choice", name: "Authentic Choice", file: "components/admin/prospect/Assesment.js" },
  { id: "enrollment_status", name: "Enrollment Status", file: "components/admin/prospect/EnrollmentStage.js" },
  { id: "engagement_logs", name: "Engagement Logs", file: "components/admin/prospect/EngagementActivity.js" },
  { id: "introduction_to_ujussbe", name: "Introduction to UJustBe", file: "components/admin/prospect/KnowledgeSharing4.js" },
  { id: "terms_knowledge_transfer", name: "Terms Knowledge Transfer", file: "components/admin/prospect/KnowledgeSharing5.js" },
  { id: "knowledge_series", name: "Knowledge Series", file: "components/admin/prospect/NTIntro.js" },
  { id: "mail_for_nt", name: "Mail for NT", file: "components/admin/prospect/NTBriefCall.js" },
  { id: "briefing_on_nt", name: "Briefing on NT", file: "components/admin/prospect/KnowledgeSeries9.js" },
  { id: "nt_introduction", name: "NT Introduction", file: "components/admin/prospect/KnowledgeSeries10.js" },
  { id: "referrals_knowledge", name: "Referrals Knowledge", file: "components/admin/prospect/AssesmentMail.js" },
  { id: "monthly_meeting_knowledge", name: "Monthly Meeting Knowledge", file: "components/admin/prospect/CaseStudy1.js" },
  { id: "as_lived_part_1", name: "As Lived Part 1", file: "components/admin/prospect/CaseStudy2.js" },
  { id: "assesment_completion", name: "Assesment Completion", file: "components/admin/prospect/AssesmentBtn.js" },
];

const TAB_CONFIG = {
  email: { label: "Email", icon: Mail },
  whatsapp: { label: "WhatsApp", icon: MessageSquareText },
};

export default function JourneyPage() {
  const [selectedItemId, setSelectedItemId] = useState(
    JOURNEY_TEMPLATE_ITEMS[0].id
  );
  const [activeTab, setActiveTab] = useState("email");

  const selectedItem =
    JOURNEY_TEMPLATE_ITEMS.find((item) => item.id === selectedItemId) ||
    JOURNEY_TEMPLATE_ITEMS[0];

  return (
    <div className="space-y-6">
      <div>
        <Text variant="muted">
          Journey settings stays as the journey reference map. The live communication editor for the onboarding continuation flow has been shifted into onboarding settings.
        </Text>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <Card className="p-0">
          <div className="border-b border-slate-200 px-5 py-4">
            <Text variant="h3">Journey Tasks</Text>
            <Text variant="muted" className="mt-1">
              {JOURNEY_TEMPLATE_ITEMS.length} tasks mapped from the prospect journey
            </Text>
          </div>

          <div className="space-y-2 p-3">
            {JOURNEY_TEMPLATE_ITEMS.map((item) => {
              const isActive = item.id === selectedItem.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedItemId(item.id)}
                  className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                    isActive
                      ? "border-slate-300 bg-slate-100"
                      : "border-transparent hover:border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="text-sm font-semibold text-slate-900">
                    {item.name}
                  </div>
                  <div className="mt-1 text-xs leading-5 text-slate-500">
                    {item.file}
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        <Card className="p-0">
          <div className="border-b border-slate-200 px-5 py-4">
            <Text variant="h3">{selectedItem.name}</Text>
            <Text variant="muted" className="mt-1">
              Source file: {selectedItem.file}
            </Text>
          </div>

          <div className="border-b border-slate-200 px-5 pt-4">
            <div className="flex flex-wrap gap-2">
              {Object.entries(TAB_CONFIG).map(([tabKey, tab]) => {
                const TabIcon = tab.icon;
                const isActive = activeTab === tabKey;

                return (
                  <button
                    key={tabKey}
                    type="button"
                    onClick={() => setActiveTab(tabKey)}
                    className={`inline-flex items-center gap-2 rounded-t-xl border px-4 py-2 text-sm font-medium transition ${
                      isActive
                        ? "border-slate-300 border-b-white bg-white text-slate-900"
                        : "border-transparent text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    <TabIcon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="px-5 py-8 text-sm leading-6 text-slate-600">
            This page is now reference-only. Use onboarding settings to edit the converted live communication templates such as `Prospect Assessment Request` and `Meeting Logs`.
          </div>
        </Card>
      </div>
    </div>
  );
}

