import React, { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import emailjs from "@emailjs/browser";

import { sendWhatsAppTemplateRequest } from "@/utils/whatsappClient";
import { formatDate, formatDateTime } from "@/lib/utils/dateFormat";
import { getFallbackJourneyEmailTemplate } from "@/lib/journey/journey_email";
import { getFallbackJourneyWhatsAppTemplate } from "@/lib/journey/journey_whatsapp";

const AUTHENTIC_CHOICE_TEMPLATE_ID = "authentic_choice";
const DEFAULT_AUTHENTIC_CHOICE_TEMPLATE = {
  channels: {
    email: getFallbackJourneyEmailTemplate(AUTHENTIC_CHOICE_TEMPLATE_ID),
    whatsapp: getFallbackJourneyWhatsAppTemplate(AUTHENTIC_CHOICE_TEMPLATE_ID),
  },
};

const STATUS_VARIANT_KEY = {
  "Choose to enroll": "choose_to_enroll",
  "Decline by UJustBe": "decline_by_ujussbe",
  "Decline by Prospect": "decline_by_prospect",
  "Need some time": "need_some_time",
  "Awaiting response": "awaiting_response",
};

const STATUS_CONFIG = {
  "Choose to enroll": {
    noteLabel: "",
    noteRequired: false,
  },
  "Decline by UJustBe": {
    noteLabel: "Reason for declining",
    noteRequired: true,
  },
  "Decline by Prospect": {
    noteLabel: "Reason shared by prospect",
    noteRequired: true,
  },
  "Need some time": {
    noteLabel: "Context / discussion note",
    noteRequired: false,
  },
  "Awaiting response": {
    noteLabel: "Reminder / response note",
    noteRequired: true,
  },
};

const FINAL_STATUSES = new Set([
  "Choose to enroll",
  "Decline by UJustBe",
  "Decline by Prospect",
]);

const sanitizeText = (text) =>
  String(text || "").replace(/[^a-zA-Z0-9 .,!?'"@#&()\-]/g, " ");

const applyTemplateVariables = (template = "", values = {}) =>
  String(template || "").replace(/\{\{\s*(.*?)\s*\}\}/g, (_, key) => {
    const normalizedKey = String(key || "").trim();
    return values[normalizedKey] ?? `{{${normalizedKey}}}`;
  });

const buildAuthenticChoiceNote = (selectedStatus, note) => {
  const trimmedNote = String(note || "").trim();

  if (trimmedNote) {
    if (selectedStatus === "Need some time") {
      return `Discussion note: ${trimmedNote}`;
    }

    if (selectedStatus === "Awaiting response") {
      return `Reminder note: ${trimmedNote}`;
    }

    if (selectedStatus === "Decline by Prospect") {
      return `Reason shared: ${trimmedNote}`;
    }

    return trimmedNote;
  }

  if (selectedStatus === "Decline by UJustBe") {
    return "Non-alignment with UJustBe culture and values.";
  }

  if (selectedStatus === "Decline by Prospect") {
    return "Prospect chose not to proceed at this time.";
  }

  return "";
};

const fetchAuthenticChoiceTemplate = async () => {
  try {
    const res = await fetch(
      `/api/admin/journey-templates?id=${AUTHENTIC_CHOICE_TEMPLATE_ID}`,
      { credentials: "include" }
    );
    const responseData = await res.json().catch(() => ({}));

    if (!res.ok || !responseData.template) {
      throw new Error(
        responseData.message || "Failed to load authentic choice template"
      );
    }

    return responseData.template;
  } catch (error) {
    console.error(
      "Authentic choice template fetch failed, using fallback:",
      error
    );
    return DEFAULT_AUTHENTIC_CHOICE_TEMPLATE;
  }
};

const formatDisplayDate = () => formatDate(new Date(), "");

const formatLogDate = (value) => formatDateTime(value, "");

const Assessment = ({ id, fetchData }) => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("No status yet");
  const [currentDate, setCurrentDate] = useState(formatDisplayDate());
  const [statusNote, setStatusNote] = useState("");
  const [logs, setLogs] = useState([]);
  const [prospectMeta, setProspectMeta] = useState({
    prospectName: "",
    prospectEmail: "",
    prospectPhone: "",
    orbiterName: "",
  });

  const isFrozen = loading || FINAL_STATUSES.has(status);

  const currentConfig = useMemo(
    () => STATUS_CONFIG[status] || null,
    [status]
  );

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch(
          `/api/admin/prospects?id=${id}&section=authenticchoice`,
          { credentials: "include" }
        );
        const responseData = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(responseData.message || "Failed to fetch authentic choice");
        }

        const prospect = responseData.prospect || {};
        setStatus(prospect.status || "No status yet");
        setStatusNote(prospect.declineReason || prospect.statusNote || "");
        setLogs(
          Array.isArray(responseData.authenticChoiceLogs)
            ? responseData.authenticChoiceLogs
            : []
        );
        setProspectMeta({
          prospectName: prospect.prospectName || "",
          prospectEmail: prospect.email || "",
          prospectPhone: prospect.prospectPhone || "",
          orbiterName: prospect.orbiterName || "Orbiter",
        });
      } catch (error) {
        console.error("Error fetching authentic choice:", error);
      }
    };

    setCurrentDate(formatDisplayDate());
    if (id) {
      fetchStatus();
    }
  }, [id]);

  const sendAssessmentEmail = async (selectedStatus, note) => {
    if (!prospectMeta.prospectEmail) return;

    const template = await fetchAuthenticChoiceTemplate();
    const variantKey = STATUS_VARIANT_KEY[selectedStatus];
    const emailChannel =
      template?.channels?.email || DEFAULT_AUTHENTIC_CHOICE_TEMPLATE.channels.email;
    const variant =
      emailChannel?.variants?.[variantKey] ||
      DEFAULT_AUTHENTIC_CHOICE_TEMPLATE.channels.email.variants?.[variantKey];
    const recipientTemplate =
      variant?.recipients?.prospect ||
      DEFAULT_AUTHENTIC_CHOICE_TEMPLATE.channels.email.variants?.[variantKey]
        ?.recipients?.prospect;
    const body = applyTemplateVariables(recipientTemplate?.body, {
      prospect_name: prospectMeta.prospectName,
      note: buildAuthenticChoiceNote(selectedStatus, note),
    }) || `Status updated: ${selectedStatus}`;

    try {
      await emailjs.send(
        emailChannel?.serviceId ||
          DEFAULT_AUTHENTIC_CHOICE_TEMPLATE.channels.email.serviceId,
        emailChannel?.templateId ||
          DEFAULT_AUTHENTIC_CHOICE_TEMPLATE.channels.email.templateId,
        {
          prospect_name: prospectMeta.prospectName,
          to_email: prospectMeta.prospectEmail,
          body,
          orbiter_name: prospectMeta.orbiterName,
        },
        emailChannel?.publicKey ||
          DEFAULT_AUTHENTIC_CHOICE_TEMPLATE.channels.email.publicKey
      );
    } catch (error) {
      console.error("Failed to send status email:", error);
    }
  };

  const sendAssessmentMessage = async (selectedStatus, note) => {
    if (!prospectMeta.prospectPhone) return;

    const template = await fetchAuthenticChoiceTemplate();
    const variantKey = STATUS_VARIANT_KEY[selectedStatus];
    const whatsappChannel =
      template?.channels?.whatsapp ||
      DEFAULT_AUTHENTIC_CHOICE_TEMPLATE.channels.whatsapp;
    const variant =
      whatsappChannel?.variants?.[variantKey] ||
      DEFAULT_AUTHENTIC_CHOICE_TEMPLATE.channels.whatsapp.variants?.[variantKey];
    const recipientTemplate =
      variant?.recipients?.prospect ||
      DEFAULT_AUTHENTIC_CHOICE_TEMPLATE.channels.whatsapp.variants?.[variantKey]
        ?.recipients?.prospect;
    const bodyText =
      applyTemplateVariables(recipientTemplate?.body, {
        prospect_name: prospectMeta.prospectName,
        note: buildAuthenticChoiceNote(selectedStatus, note),
      }) || `Status updated: ${selectedStatus}`;
    const parameterKeys =
      Array.isArray(recipientTemplate?.variableKeys) &&
      recipientTemplate.variableKeys.length
        ? recipientTemplate.variableKeys
        : DEFAULT_AUTHENTIC_CHOICE_TEMPLATE.channels.whatsapp.variants?.[variantKey]
            ?.recipients?.prospect?.variableKeys || [];

    try {
      await sendWhatsAppTemplateRequest({
        phone: prospectMeta.prospectPhone,
        templateName:
          recipientTemplate?.templateName ||
          DEFAULT_AUTHENTIC_CHOICE_TEMPLATE.channels.whatsapp.variants?.[variantKey]
            ?.recipients?.prospect?.templateName ||
          "enrollment_journey",
        parameters: parameterKeys.map((key) =>
          sanitizeText(
            {
              body_text: bodyText,
              orbiter_name: prospectMeta.orbiterName,
            }[key] ?? ""
          )
        ),
      });
    } catch (error) {
      console.error("Failed to send status WhatsApp:", error);
    }
  };

  const handleSaveStatus = async (selectedStatus, note = "") => {
    setLoading(true);

    try {
      const res = await fetch(
        `/api/admin/prospects?id=${id}&section=authenticchoice`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            status: selectedStatus,
            note,
          }),
        }
      );
      const responseData = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(responseData.message || "Failed to save authentic choice");
      }

      const prospect = responseData.prospect || {};
      setStatus(prospect.status || selectedStatus);
      setStatusNote(prospect.declineReason || prospect.statusNote || note);
      setLogs(
        Array.isArray(prospect.authenticChoiceLogs)
          ? prospect.authenticChoiceLogs
          : logs
      );

      await Promise.all([
        sendAssessmentEmail(selectedStatus, note),
        sendAssessmentMessage(selectedStatus, note),
      ]);

      Swal.fire({
        icon: "success",
        title: "Notification Sent",
        text: `Status "${selectedStatus}" has been saved and shared with the prospect.`,
        confirmButtonColor: "#3085d6",
      });

      fetchData?.();
    } catch (error) {
      console.error("Error saving authentic choice:", error);
      Swal.fire("Error", error.message || "Failed to save status", "error");
    } finally {
      setLoading(false);
    }
  };

  const confirmSaveStatus = (newStatus) => {
    const config = STATUS_CONFIG[newStatus];

    if (config?.noteLabel) {
      Swal.fire({
        title: newStatus,
        input: "textarea",
        inputLabel: config.noteLabel,
        inputPlaceholder: "Type here...",
        inputAttributes: {
          "aria-label": config.noteLabel,
        },
        showCancelButton: true,
        confirmButtonText: "Submit",
        preConfirm: (value) => {
          const trimmed = String(value || "").trim();

          if (config.noteRequired && !trimmed) {
            Swal.showValidationMessage(`${config.noteLabel} is required`);
          }

          return trimmed;
        },
      }).then((result) => {
        if (result.isConfirmed) {
          handleSaveStatus(newStatus, result.value || "");
        }
      });

      return;
    }

    Swal.fire({
      title: "Are you sure?",
      text: `You want to set status as "${newStatus}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, confirm it!",
    }).then((result) => {
      if (result.isConfirmed) {
        handleSaveStatus(newStatus);
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white border rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Authentic Choice by Prospect</h2>

        <h3 className="text-lg mb-2">
          Status: <span className="font-medium">{status || "No status yet"}</span>
        </h3>

        {statusNote && (
          <p className="mt-2 italic bg-slate-50 border border-slate-200 p-3 rounded-lg">
            {status.startsWith("Decline") ? "Reason" : "Note"}: {statusNote}
          </p>
        )}

        <div className="mt-4">
          <p className="text-gray-700 mb-4">Date: {currentDate}</p>

          <div className="flex flex-wrap gap-3">
            {Object.keys(STATUS_CONFIG).map((choice) => (
              <button
                key={choice}
                onClick={() => confirmSaveStatus(choice)}
                disabled={isFrozen}
                className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 disabled:bg-gray-400"
              >
                {choice}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-3">Decision Log</h3>

          {logs.length === 0 ? (
            <p className="text-gray-500">No actions logged yet.</p>
          ) : (
            <div className="space-y-3">
              {[...logs].reverse().map((entry, index) => (
                <div
                  key={`${entry.clickedAt || index}-${entry.status || index}`}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                >
                  <p className="font-medium">
                    {entry.status || "Status updated"}
                    {entry.previousStatus ? ` (from ${entry.previousStatus})` : ""}
                  </p>
                  <p className="text-sm text-slate-600">
                    {entry.clickedBy || "Admin"} on {formatLogDate(entry.clickedAt)}
                  </p>
                  {entry.note && (
                    <p className="mt-2 text-sm text-slate-700">
                      {entry.status?.startsWith("Decline") ? "Reason" : "Note"}:{" "}
                      {entry.note}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Assessment;


