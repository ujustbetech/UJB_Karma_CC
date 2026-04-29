"use client";

import { useEffect, useMemo, useState } from "react";
import { Mail, MessageSquareText, UserRound, Users } from "lucide-react";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Text from "@/components/ui/Text";
import { useToast } from "@/components/ui/ToastProvider";

const CHANNEL_TABS = {
  email: { label: "Email", icon: Mail },
  whatsapp: { label: "WhatsApp", icon: MessageSquareText },
};

const RECIPIENT_TABS = {
  prospect: { label: "Prospect", icon: UserRound },
  orbiter: { label: "Orbiter", icon: Users },
};

const DEFAULT_VARIANT_LABELS = {
  schedule: "Schedule",
  reschedule: "Reschedule",
  thank_you: "Thank You",
};

const AUTHENTIC_CHOICE_VARIANT_LABELS = {
  choose_to_enroll: "Choose to Enroll",
  decline_by_ujussbe: "Decline by UJustBe",
  decline_by_prospect: "Decline by Prospect",
  need_some_time: "Need Some Time",
  awaiting_response: "Awaiting Response",
};

const ENROLLMENT_STATUS_VARIANT_LABELS = {
  enrollment_initiation_initiation_not_started: "Initiation Not Started",
  enrollment_initiation_initiation_in_progress: "Initiation In Progress",
  enrollment_initiation_initiation_completed: "Initiation Completed",
  enrollment_documents_mail_documents_pending: "Documents Pending",
  enrollment_documents_mail_documents_sent: "Documents Sent",
  enrollment_documents_mail_documents_need_revision: "Documents Need Revision",
  enrollment_fees_mail_status_fee_mail_pending: "Fee Mail Pending",
  enrollment_fees_mail_status_fee_mail_sent: "Fee Mail Sent",
  enrollment_fees_mail_status_fee_follow_up_required: "Fee Follow-up Required",
  enrollment_fees_option_opted_for_option_pending: "Option Pending",
  enrollment_fees_option_opted_for_upfront_payment_selected:
    "Upfront Payment Selected",
  enrollment_fees_option_opted_for_adjustment_selected: "Adjustment Selected",
  enrollment_fees_option_opted_for_no_response_adjustment_applied:
    "No Response - Adjustment Applied",
  enrollment_fees_option_opted_for_upfront_payment_confirmed:
    "Upfront Payment Confirmed",
  enrollments_completion_status_completion_pending: "Completion Pending",
  enrollments_completion_status_enrollment_completed: "Enrollment Completed",
  enrollments_completion_status_enrollment_withdrawn: "Enrollment Withdrawn",
};

const TEMPLATE_ITEMS = [
  {
    id: "prospect_assessment_request",
    name: "Prospect Assessment Request",
    file: "app/admin/prospect/add/page.js",
    section: "Onboarding",
    templateType: "simple",
    fetchUrl: "/api/admin/onboarding-templates?id=prospect_assessment_request",
    saveUrl: "/api/admin/onboarding-templates",
  },
  {
    id: "meeting_logs",
    name: "Meeting Logs",
    file: "components/admin/prospect/FollowUps.js",
    section: "Continuous Follow-up",
    templateType: "variant",
    variantLabels: DEFAULT_VARIANT_LABELS,
    fetchUrl: "/api/admin/journey-templates?id=meeting_logs",
    saveUrl: "/api/admin/journey-templates",
  },
  {
    id: "pre_enrollment_form",
    name: "Pre Enrollment Form",
    file: "components/admin/prospect/AdditionalInfo.js",
    section: "Continuous Follow-up",
    templateType: "variant",
    variantLabels: {
      default: "Default",
    },
    fetchUrl: "/api/admin/journey-templates?id=pre_enrollment_form",
    saveUrl: "/api/admin/journey-templates",
  },
  {
    id: "authentic_choice",
    name: "Authentic Choice",
    file: "components/admin/prospect/Assesment.js",
    section: "Continuous Follow-up",
    templateType: "variant",
    variantLabels: AUTHENTIC_CHOICE_VARIANT_LABELS,
    fetchUrl: "/api/admin/journey-templates?id=authentic_choice",
    saveUrl: "/api/admin/journey-templates",
  },
  {
    id: "enrollment_status",
    name: "Enrollment Status",
    file: "components/admin/prospect/EnrollmentStage.js",
    section: "Continuous Follow-up",
    templateType: "variant",
    variantLabels: ENROLLMENT_STATUS_VARIANT_LABELS,
    fetchUrl: "/api/admin/journey-templates?id=enrollment_status",
    saveUrl: "/api/admin/journey-templates",
  },
];

function splitVariableKeys(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function replaceDummyValues(value) {
  const dummyValues = {
    orbiter_name: "Khizar",
    prospect_name: "Aisha",
    form_link: "https://ujb.local/user/prospects/demo-id",
    recipient_name: "Khizar",
    name: "Khizar",
    date: "28 Apr 2026 at 11.00 AM",
    schedule_details: "Zoom Link: https://meet.example.com/room",
    location_details: "Zoom Link: https://meet.example.com/room",
    reason: "a scheduling conflict",
  };

  return String(value || "").replace(/\{\{\s*(.*?)\s*\}\}/g, (_, key) => {
    const normalizedKey = String(key || "").trim();
    return dummyValues[normalizedKey] || `{{${normalizedKey}}}`;
  });
}

function getEmptyRecipientDraft(channelType) {
  if (channelType === "email") {
    return {
      subject: "",
      body: "",
      variableKeys: "",
    };
  }

  return {
    templateName: "",
    body: "",
    variableKeys: "",
  };
}

function mapRecipientDraft(recipient, channelType) {
  const emptyRecipientDraft = getEmptyRecipientDraft(channelType);

  return {
    ...emptyRecipientDraft,
    ...(recipient || {}),
    variableKeys: Array.isArray(recipient?.variableKeys)
      ? recipient.variableKeys.join(", ")
      : "",
  };
}

function toSimpleDraft(template) {
  return {
    id: template.id,
    name: template.name || "",
    description: template.description || "",
    isActive: template.isActive !== false,
    sortOrder: template.sortOrder || 999,
    channels: {
      email: {
        provider: template?.channels?.email?.provider || "emailjs",
        serviceId: template?.channels?.email?.serviceId || "",
        templateId: template?.channels?.email?.templateId || "",
        publicKey: template?.channels?.email?.publicKey || "",
        recipients: {
          prospect: mapRecipientDraft(
            template?.channels?.email?.recipients?.prospect,
            "email"
          ),
          orbiter: mapRecipientDraft(
            template?.channels?.email?.recipients?.orbiter,
            "email"
          ),
        },
      },
      whatsapp: {
        recipients: {
          prospect: mapRecipientDraft(
            template?.channels?.whatsapp?.recipients?.prospect,
            "whatsapp"
          ),
          orbiter: mapRecipientDraft(
            template?.channels?.whatsapp?.recipients?.orbiter,
            "whatsapp"
          ),
        },
      },
    },
  };
}

function toVariantDraft(template) {
  const emailVariants = template?.channels?.email?.variants || {};
  const whatsappVariants = template?.channels?.whatsapp?.variants || {};
  const variantKeys = Array.from(
    new Set([...Object.keys(emailVariants), ...Object.keys(whatsappVariants)])
  );

  return {
    id: template.id,
    name: template.name || "",
    description: template.description || "",
    sortOrder: template.sortOrder || 999,
    channels: {
      email: {
        provider: template?.channels?.email?.provider || "emailjs",
        serviceId: template?.channels?.email?.serviceId || "",
        templateId: template?.channels?.email?.templateId || "",
        publicKey: template?.channels?.email?.publicKey || "",
        variants: Object.fromEntries(
          variantKeys.map((key) => [
            key,
            {
              recipients: {
                prospect: mapRecipientDraft(
                  emailVariants?.[key]?.recipients?.prospect,
                  "email"
                ),
                orbiter: mapRecipientDraft(
                  emailVariants?.[key]?.recipients?.orbiter,
                  "email"
                ),
              },
            },
          ])
        ),
      },
      whatsapp: {
        variants: Object.fromEntries(
          variantKeys.map((key) => [
            key,
            {
              recipients: {
                prospect: mapRecipientDraft(
                  whatsappVariants?.[key]?.recipients?.prospect,
                  "whatsapp"
                ),
                orbiter: mapRecipientDraft(
                  whatsappVariants?.[key]?.recipients?.orbiter,
                  "whatsapp"
                ),
              },
            },
          ])
        ),
      },
    },
  };
}

function buildSimplePayload(draft) {
  return {
    id: draft.id,
    name: draft.name,
    description: draft.description,
    isActive: draft.isActive !== false,
    sortOrder: draft.sortOrder,
    channels: {
      email: {
        provider: draft.channels.email.provider,
        serviceId: draft.channels.email.serviceId,
        templateId: draft.channels.email.templateId,
        publicKey: draft.channels.email.publicKey,
        recipients: Object.fromEntries(
          Object.entries(draft.channels.email.recipients).map(
            ([recipientKey, recipient]) => [
              recipientKey,
              {
                subject: recipient.subject,
                body: recipient.body,
                variableKeys: splitVariableKeys(recipient.variableKeys),
              },
            ]
          )
        ),
      },
      whatsapp: {
        recipients: Object.fromEntries(
          Object.entries(draft.channels.whatsapp.recipients).map(
            ([recipientKey, recipient]) => [
              recipientKey,
              {
                templateName: recipient.templateName,
                body: recipient.body,
                variableKeys: splitVariableKeys(recipient.variableKeys),
              },
            ]
          )
        ),
      },
    },
  };
}

function buildVariantPayload(draft) {
  return {
    id: draft.id,
    name: draft.name,
    description: draft.description,
    sortOrder: draft.sortOrder,
    channels: {
      email: {
        provider: draft.channels.email.provider,
        serviceId: draft.channels.email.serviceId,
        templateId: draft.channels.email.templateId,
        publicKey: draft.channels.email.publicKey,
        variants: Object.fromEntries(
          Object.entries(draft.channels.email.variants).map(([variantKey, variant]) => [
            variantKey,
            {
              recipients: Object.fromEntries(
                Object.entries(variant.recipients || {}).map(
                  ([recipientKey, recipient]) => [
                    recipientKey,
                    {
                      subject: recipient.subject,
                      body: recipient.body,
                      variableKeys: splitVariableKeys(recipient.variableKeys),
                    },
                  ]
                )
              ),
            },
          ])
        ),
      },
      whatsapp: {
        variants: Object.fromEntries(
          Object.entries(draft.channels.whatsapp.variants).map(
            ([variantKey, variant]) => [
              variantKey,
              {
                recipients: Object.fromEntries(
                  Object.entries(variant.recipients || {}).map(
                    ([recipientKey, recipient]) => [
                      recipientKey,
                      {
                        templateName: recipient.templateName,
                        body: recipient.body,
                        variableKeys: splitVariableKeys(recipient.variableKeys),
                      },
                    ]
                  )
                ),
              },
            ]
          )
        ),
      },
    },
  };
}

function hasRecipientContent(recipient, channelKey) {
  if (!recipient || typeof recipient !== "object") {
    return false;
  }

  if (channelKey === "email") {
    return Boolean(
      String(recipient.subject || "").trim() ||
        String(recipient.body || "").trim() ||
        splitVariableKeys(recipient.variableKeys).length
    );
  }

  return Boolean(
    String(recipient.templateName || "").trim() ||
      String(recipient.body || "").trim() ||
      splitVariableKeys(recipient.variableKeys).length
  );
}

function getAvailableRecipients(draft, templateType) {
  if (!draft) {
    return [];
  }

  const allRecipientKeys = Object.keys(RECIPIENT_TABS);

  return allRecipientKeys.filter((recipientKey) => {
    if (templateType === "variant") {
      return ["email", "whatsapp"].some((channelKey) =>
        Object.values(draft?.channels?.[channelKey]?.variants || {}).some((variant) =>
          hasRecipientContent(variant?.recipients?.[recipientKey], channelKey)
        )
      );
    }

    return ["email", "whatsapp"].some((channelKey) =>
      hasRecipientContent(
        draft?.channels?.[channelKey]?.recipients?.[recipientKey],
        channelKey
      )
    );
  });
}

function toDraft(item, template) {
  return item.templateType === "variant"
    ? toVariantDraft(template)
    : toSimpleDraft(template);
}

export default function OnBoardingPage() {
  const toast = useToast();
  const [selectedItemId, setSelectedItemId] = useState(TEMPLATE_ITEMS[0].id);
  const [activeRecipient, setActiveRecipient] = useState("prospect");
  const [activeTab, setActiveTab] = useState("email");
  const [activeVariant, setActiveVariant] = useState("schedule");
  const [loadingTemplateId, setLoadingTemplateId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [drafts, setDrafts] = useState({});
  const [persistedDrafts, setPersistedDrafts] = useState({});

  const selectedItem =
    TEMPLATE_ITEMS.find((item) => item.id === selectedItemId) || TEMPLATE_ITEMS[0];
  const selectedVariantLabels =
    selectedItem.variantLabels || DEFAULT_VARIANT_LABELS;
  const activeDraft = drafts[selectedItem.id] || null;
  const isTemplateLoading = loadingTemplateId === selectedItem.id;
  const groupedTemplateItems = TEMPLATE_ITEMS.reduce((groups, item) => {
    const sectionKey = item.section || "Templates";

    return {
      ...groups,
      [sectionKey]: [...(groups[sectionKey] || []), item],
    };
  }, {});

  useEffect(() => {
    if (selectedItem.templateType !== "variant") {
      return;
    }

    const availableVariantKeys = Object.keys(selectedVariantLabels);

    if (availableVariantKeys.length && !availableVariantKeys.includes(activeVariant)) {
      setActiveVariant(availableVariantKeys[0]);
    }
  }, [activeVariant, selectedItem.templateType, selectedVariantLabels]);

  const loadTemplateForItem = async (item) => {
    if (drafts[item.id]) {
      return;
    }

    setLoadingTemplateId(item.id);

    try {
      const res = await fetch(item.fetchUrl, { credentials: "include" });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.template) {
        throw new Error(data.message || `Failed to load ${item.name}`);
      }

      const nextDraft = toDraft(item, data.template);

      setDrafts((previous) => ({
        ...previous,
        [item.id]: nextDraft,
      }));
      setPersistedDrafts((previous) => ({
        ...previous,
        [item.id]: nextDraft,
      }));
    } catch (error) {
      toast.error(error.message || "Failed to load template");
    } finally {
      setLoadingTemplateId((current) => (current === item.id ? null : current));
    }
  };

  useEffect(() => {
    loadTemplateForItem(TEMPLATE_ITEMS[0]);
  }, []);
  const availableRecipients = useMemo(
    () => getAvailableRecipients(activeDraft, selectedItem.templateType),
    [activeDraft, selectedItem.templateType]
  );
  const activeSimpleChannelDraft =
    selectedItem.templateType === "simple"
      ? activeDraft?.channels?.[activeTab]
      : null;
  const activeSimpleRecipientDraft =
    activeSimpleChannelDraft?.recipients?.[activeRecipient] ||
    getEmptyRecipientDraft(activeTab);
  const activeVariantChannelDraft =
    selectedItem.templateType === "variant"
      ? activeDraft?.channels?.[activeTab]
      : null;
  const activeVariantDraft =
    activeVariantChannelDraft?.variants?.[activeVariant] || null;
  const activeVariantRecipientDraft =
    activeVariantDraft?.recipients?.[activeRecipient] ||
    getEmptyRecipientDraft(activeTab);

  const variableChips = useMemo(() => {
    const sourceDraft =
      selectedItem.templateType === "variant"
        ? activeVariantRecipientDraft
        : activeSimpleRecipientDraft;
    const fromText = `${sourceDraft?.subject || ""} ${sourceDraft?.body || ""}`.match(
      /\{\{[^}]+\}\}/g
    ) || [];
    const fromKeys = splitVariableKeys(sourceDraft?.variableKeys).map(
      (value) => `{{${value}}}`
    );

    return Array.from(new Set([...fromText, ...fromKeys]));
  }, [
    activeSimpleRecipientDraft,
    activeVariantRecipientDraft,
    selectedItem.templateType,
  ]);

  useEffect(() => {
    if (!availableRecipients.length) {
      return;
    }

    if (!availableRecipients.includes(activeRecipient)) {
      setActiveRecipient(availableRecipients[0]);
    }
  }, [activeRecipient, availableRecipients]);

  const handleMetaChange = (field, value) => {
    setDrafts((previous) => ({
      ...previous,
      [selectedItem.id]: {
        ...previous[selectedItem.id],
        [field]: value,
      },
    }));
  };

  const handleSimpleChannelChange = (field, value) => {
    setDrafts((previous) => ({
      ...previous,
      [selectedItem.id]: {
        ...previous[selectedItem.id],
        channels: {
          ...previous[selectedItem.id].channels,
          [activeTab]: {
            ...previous[selectedItem.id].channels[activeTab],
            [field]: value,
          },
        },
      },
    }));
  };

  const handleSimpleRecipientChange = (field, value) => {
    setDrafts((previous) => ({
      ...previous,
      [selectedItem.id]: {
        ...previous[selectedItem.id],
        channels: {
          ...previous[selectedItem.id].channels,
          [activeTab]: {
            ...previous[selectedItem.id].channels[activeTab],
            recipients: {
              ...previous[selectedItem.id].channels[activeTab].recipients,
              [activeRecipient]: {
                ...previous[selectedItem.id].channels[activeTab].recipients[
                  activeRecipient
                ],
                [field]: value,
              },
            },
          },
        },
      },
    }));
  };

  const handleVariantChannelChange = (field, value) => {
    setDrafts((previous) => ({
      ...previous,
      [selectedItem.id]: {
        ...previous[selectedItem.id],
        channels: {
          ...previous[selectedItem.id].channels,
          [activeTab]: {
            ...previous[selectedItem.id].channels[activeTab],
            [field]: value,
          },
        },
      },
    }));
  };

  const handleVariantRecipientChange = (field, value) => {
    setDrafts((previous) => ({
      ...previous,
      [selectedItem.id]: {
        ...previous[selectedItem.id],
        channels: {
          ...previous[selectedItem.id].channels,
          [activeTab]: {
            ...previous[selectedItem.id].channels[activeTab],
            variants: {
              ...previous[selectedItem.id].channels[activeTab].variants,
              [activeVariant]: {
                ...previous[selectedItem.id].channels[activeTab].variants[
                  activeVariant
                ],
                recipients: {
                  ...previous[selectedItem.id].channels[activeTab].variants[
                    activeVariant
                  ].recipients,
                  [activeRecipient]: {
                    ...previous[selectedItem.id].channels[activeTab].variants[
                      activeVariant
                    ].recipients[activeRecipient],
                    [field]: value,
                  },
                },
              },
            },
          },
        },
      },
    }));
  };

  const handleReset = () => {
    if (!persistedDrafts[selectedItem.id]) {
      return;
    }

    setDrafts((previous) => ({
      ...previous,
      [selectedItem.id]: JSON.parse(
        JSON.stringify(persistedDrafts[selectedItem.id])
      ),
    }));
  };

  const handleSave = async () => {
    const draft = drafts[selectedItem.id];

    if (!draft) {
      return;
    }

    setSaving(true);

    try {
      const payload =
        selectedItem.templateType === "variant"
          ? buildVariantPayload(draft)
          : buildSimplePayload(draft);

      const res = await fetch(selectedItem.saveUrl, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.template) {
        throw new Error(data.message || "Failed to save template");
      }

      const nextDraft =
        selectedItem.templateType === "variant"
          ? toVariantDraft(data.template)
          : toSimpleDraft(data.template);

      setDrafts((previous) => ({
        ...previous,
        [selectedItem.id]: nextDraft,
      }));
      setPersistedDrafts((previous) => ({
        ...previous,
        [selectedItem.id]: nextDraft,
      }));
      toast.success(`${selectedItem.name} saved successfully`);
    } catch (error) {
      toast.error(error.message || "Failed to save template");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Text variant="muted">
          This page owns the live communication templates that continue the onboarding flow. Templates can now be edited separately for prospects and orbiters inside each email and WhatsApp channel.
        </Text>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <Card className="p-0">
          <div className="border-b border-slate-200 px-5 py-4">
            <Text variant="h3">Templates</Text>
            <Text variant="muted" className="mt-1">
              {TEMPLATE_ITEMS.length} live template groups
            </Text>
          </div>

          <div className="space-y-2 p-3">
            {Object.entries(groupedTemplateItems).map(([section, items]) => (
                <div key={section} className="space-y-2">
                  <div className="px-2 pt-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                    {section}
                  </div>

                  {items.map((item) => {
                    const isActive = item.id === selectedItem.id;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setSelectedItemId(item.id);
                          loadTemplateForItem(item);
                        }}
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
                          {/* {item.file} */}
                        </div>
                        {loadingTemplateId === item.id ? (
                          <div className="mt-2 text-xs text-slate-400">
                            Loading...
                          </div>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              ))}
          </div>
        </Card>

        <Card className="p-0">
          <div className="border-b border-slate-200 px-5 py-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <Text variant="h3">{selectedItem.name}</Text>
                {/* <Text variant="muted" className="mt-1">
                  Source file: {selectedItem.file}
                </Text> */}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={handleReset}
                  disabled={!drafts[selectedItem.id] || saving}
                >
                  Reset Template
                </Button>
                <Button
                  onClick={handleSave}
                  loading={saving}
                  disabled={!drafts[selectedItem.id] || isTemplateLoading}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </div>

          {activeDraft ? (
            <div className="grid grid-cols-1 gap-4 border-b border-slate-200 px-5 py-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Template Name
                </label>
                <input
                  type="text"
                  value={activeDraft.name || ""}
                  onChange={(event) => handleMetaChange("name", event.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-300"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Description
                </label>
                <input
                  type="text"
                  value={activeDraft.description || ""}
                  onChange={(event) =>
                    handleMetaChange("description", event.target.value)
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-300"
                />
              </div>
            </div>
          ) : null}

          <div className="border-b border-slate-200 px-5 pt-4">
            <div className="flex flex-wrap gap-2">
              {availableRecipients.map((recipientKey) => {
                const tab = RECIPIENT_TABS[recipientKey];
                const TabIcon = tab.icon;
                const isActive = activeRecipient === recipientKey;

                return (
                  <button
                    key={recipientKey}
                    type="button"
                    onClick={() => setActiveRecipient(recipientKey)}
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

          <div className="border-b border-slate-200 px-5 pt-4">
            <div className="flex flex-wrap gap-2">
              {Object.entries(CHANNEL_TABS).map(([tabKey, tab]) => {
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

          {selectedItem.templateType === "variant" ? (
            <div className="border-b border-slate-200 px-5 py-4">
              <div className="flex flex-wrap gap-2">
                {Object.entries(selectedVariantLabels).map(([variantKey, label]) => {
                  const isActive = activeVariant === variantKey;

                  return (
                    <button
                      key={variantKey}
                      type="button"
                      onClick={() => setActiveVariant(variantKey)}
                      className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                        isActive
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-6 px-5 py-5 2xl:grid-cols-[minmax(0,1fr)_340px]">
            {isTemplateLoading ? (
              <div className="space-y-4 py-2">
                <div className="h-12 animate-pulse rounded-xl bg-slate-100" />
                <div className="h-12 animate-pulse rounded-xl bg-slate-100" />
                <div className="h-12 animate-pulse rounded-xl bg-slate-100" />
                <div className="h-64 animate-pulse rounded-xl bg-slate-100" />
              </div>
            ) : !activeDraft ? (
              <div className="py-10 text-sm leading-6 text-slate-500">
                Click a template from the sidebar to load its content.
              </div>
            ) : !availableRecipients.length ? (
              <div className="py-10 text-sm leading-6 text-slate-500">
                No email or WhatsApp message is sent in this step yet.
              </div>
            ) : selectedItem.templateType === "variant" ? (
              <>
                <div className="space-y-5">
                  {activeTab === "email" ? (
                    <>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-sm font-medium text-slate-700">
                            Email Service ID
                          </label>
                          <input
                            type="text"
                            value={activeDraft.channels.email.serviceId}
                            onChange={(event) =>
                              handleVariantChannelChange("serviceId", event.target.value)
                            }
                            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-300"
                          />
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium text-slate-700">
                            Email Template ID
                          </label>
                          <input
                            type="text"
                            value={activeDraft.channels.email.templateId}
                            onChange={(event) =>
                              handleVariantChannelChange("templateId", event.target.value)
                            }
                            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-300"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                          Email Public Key
                        </label>
                        <input
                          type="text"
                          value={activeDraft.channels.email.publicKey}
                          onChange={(event) =>
                            handleVariantChannelChange("publicKey", event.target.value)
                          }
                          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-300"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                          Subject
                        </label>
                        <input
                          type="text"
                          value={activeVariantRecipientDraft.subject || ""}
                          onChange={(event) =>
                            handleVariantRecipientChange("subject", event.target.value)
                          }
                          placeholder="Enter email subject"
                          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-300"
                        />
                      </div>
                    </>
                  ) : (
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        WhatsApp Template Name
                      </label>
                      <input
                        type="text"
                        value={activeVariantRecipientDraft.templateName || ""}
                        onChange={(event) =>
                          handleVariantRecipientChange("templateName", event.target.value)
                        }
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-300"
                      />
                    </div>
                  )}

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Body
                    </label>
                    <textarea
                      rows={14}
                      value={activeVariantRecipientDraft.body || ""}
                      onChange={(event) =>
                        handleVariantRecipientChange("body", event.target.value)
                      }
                      className="min-h-[280px] w-full rounded-xl border border-slate-200 px-4 py-3 text-sm leading-7 text-slate-900 outline-none transition focus:border-slate-300"
                    />
                    {activeTab === "whatsapp" ? (
                      <p className="mt-2 text-xs leading-5 text-amber-700">
                        Note: Any updates made here will not reflect in live WhatsApp sends until the same template is also updated in Facebook.
                      </p>
                    ) : null}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Variable Keys
                    </label>
                    <input
                      type="text"
                      value={activeVariantRecipientDraft.variableKeys || ""}
                      onChange={(event) =>
                        handleVariantRecipientChange("variableKeys", event.target.value)
                      }
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-300"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <Card className="shadow-none">
                    <Text variant="h3">Mapped Variant</Text>
                    <div className="mt-3 text-sm leading-6 text-slate-600">
                      {selectedVariantLabels[activeVariant] || activeVariant}
                    </div>
                    <div className="mt-2 text-sm leading-6 text-slate-500">
                      Recipient: {RECIPIENT_TABS[activeRecipient]?.label || activeRecipient}
                    </div>
                  </Card>

                  <Card className="shadow-none">
                    <Text variant="h3">Dummy Variables</Text>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {variableChips.length ? (
                        variableChips.map((chip) => (
                          <span
                            key={chip}
                            className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600"
                          >
                            {chip}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-slate-500">No variables found.</span>
                      )}
                    </div>
                  </Card>

                  <Card className="shadow-none">
                    <Text variant="h3">Preview</Text>
                    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                      {activeTab === "email" ? (
                        <>
                          <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                            Subject
                          </div>
                          <div className="mt-2 text-sm font-semibold text-slate-900">
                            {activeVariantRecipientDraft.subject || "No subject mapped yet"}
                          </div>
                        </>
                      ) : null}
                      <div className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-600">
                        {replaceDummyValues(activeVariantRecipientDraft.body || "") ||
                          "No body content"}
                      </div>
                    </div>
                  </Card>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-5">
                  {activeTab === "email" ? (
                    <>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-sm font-medium text-slate-700">
                            Email Service ID
                          </label>
                          <input
                            type="text"
                            value={activeDraft.channels.email.serviceId}
                            onChange={(event) =>
                              handleSimpleChannelChange("serviceId", event.target.value)
                            }
                            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-300"
                          />
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium text-slate-700">
                            Email Template ID
                          </label>
                          <input
                            type="text"
                            value={activeDraft.channels.email.templateId}
                            onChange={(event) =>
                              handleSimpleChannelChange("templateId", event.target.value)
                            }
                            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-300"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                          Email Public Key
                        </label>
                        <input
                          type="text"
                          value={activeDraft.channels.email.publicKey}
                          onChange={(event) =>
                            handleSimpleChannelChange("publicKey", event.target.value)
                          }
                          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-300"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                          Subject
                        </label>
                        <input
                          type="text"
                          value={activeSimpleRecipientDraft.subject || ""}
                          onChange={(event) =>
                            handleSimpleRecipientChange("subject", event.target.value)
                          }
                          placeholder="Enter email subject"
                          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-300"
                        />
                      </div>
                    </>
                  ) : (
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        WhatsApp Template Name
                      </label>
                      <input
                        type="text"
                        value={activeSimpleRecipientDraft.templateName || ""}
                        onChange={(event) =>
                          handleSimpleRecipientChange("templateName", event.target.value)
                        }
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-300"
                      />
                    </div>
                  )}

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Body
                    </label>
                    <textarea
                      rows={activeTab === "email" ? 14 : 10}
                      value={activeSimpleRecipientDraft.body || ""}
                      onChange={(event) =>
                        handleSimpleRecipientChange("body", event.target.value)
                      }
                      className="min-h-[240px] w-full rounded-xl border border-slate-200 px-4 py-3 text-sm leading-7 text-slate-900 outline-none transition focus:border-slate-300"
                    />
                    {activeTab === "whatsapp" ? (
                      <p className="mt-2 text-xs leading-5 text-amber-700">
                        Note: Any updates made here will not reflect in live WhatsApp sends until the same template is also updated in Facebook.
                      </p>
                    ) : null}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Variable Keys
                    </label>
                    <input
                      type="text"
                      value={activeSimpleRecipientDraft.variableKeys || ""}
                      onChange={(event) =>
                        handleSimpleRecipientChange("variableKeys", event.target.value)
                      }
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-300"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <Card className="shadow-none">
                    <Text variant="h3">Mapped Source</Text>
                    <div className="mt-3 text-sm leading-6 text-slate-600">
                      {selectedItem.file}
                    </div>
                    <div className="mt-2 text-sm leading-6 text-slate-500">
                      Recipient: {RECIPIENT_TABS[activeRecipient]?.label || activeRecipient}
                    </div>
                  </Card>

                  <Card className="shadow-none">
                    <Text variant="h3">Dummy Variables</Text>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {variableChips.length ? (
                        variableChips.map((chip) => (
                          <span
                            key={chip}
                            className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600"
                          >
                            {chip}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-slate-500">No variables found.</span>
                      )}
                    </div>
                  </Card>

                  <Card className="shadow-none">
                    <Text variant="h3">Preview</Text>
                    {activeTab === "email" ? (
                      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                          Subject
                        </div>
                        <div className="mt-2 text-sm font-semibold text-slate-900">
                          {replaceDummyValues(activeSimpleRecipientDraft.subject || "") ||
                            "No subject mapped yet"}
                        </div>
                        <div className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-600">
                          {replaceDummyValues(activeSimpleRecipientDraft.body || "")}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-600">
                        {activeSimpleRecipientDraft.body
                          ? replaceDummyValues(activeSimpleRecipientDraft.body)
                          : "This WhatsApp flow currently sends the approved template name and ordered variables from the database."}
                      </div>
                    )}
                  </Card>
                </div>
              </>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

