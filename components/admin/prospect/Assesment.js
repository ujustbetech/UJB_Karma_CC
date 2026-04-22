import React, { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import emailjs from "@emailjs/browser";

import { sendWhatsAppTemplateRequest } from "@/utils/whatsappClient";

const STATUS_CONFIG = {
  "Choose to enroll": {
    noteLabel: "",
    noteRequired: false,
    emailBody: ({ prospectName }) => `
Dear ${prospectName},

Subject: Welcome to UJustBe Universe - Ready to Make Your Authentic Choice?

We are happy to inform you that your enrollment into UJustBe has been approved because we find you aligned with the basic contributor criteria of the UJustBe Universe.

Now, we invite you to make your authentic choice:
To say Yes to this journey.
To say Yes to discovering, contributing, and growing.
To say Yes to being part of a community where you just be - and that is more than enough.

If this resonates with you, simply reply to this email with your confirmation as Yes. Once we receive your approval, we will share the details of the next steps in the enrollment process.
`.trim(),
    whatsappBody: ({ prospectName }) =>
      `Congratulations ${prospectName}! We are happy to inform you that your enrollment into UJustBe has been approved. Kindly reply Yes if you would like to proceed.`,
  },
  "Decline by UJustBe": {
    noteLabel: "Reason for declining",
    noteRequired: true,
    emailBody: ({ prospectName, note }) => `
Dear ${prospectName},

Thank you for your interest in becoming a part of the UJustBe Universe.

At this time, enrollment is not approved because we do not find the required alignment with the culture and values of UJustBe.

Reason: ${note || "Non-alignment with UJustBe culture and values."}

We appreciate your understanding and wish you all the best on your path ahead.
`.trim(),
    whatsappBody: ({ prospectName, note }) =>
      `Hello ${prospectName}, thank you for your interest in UJustBe. Enrollment is not approved at this time due to non-alignment. Reason: ${note || "Non-alignment with UJustBe culture and values."}`,
  },
  "Decline by Prospect": {
    noteLabel: "Reason shared by prospect",
    noteRequired: true,
    emailBody: ({ prospectName, note }) => `
Dear ${prospectName},

Thank you for taking the time to consider being part of the UJustBe Universe.

We truly value your honesty and respect your decision to not move forward at this time.

Reason shared: ${note || "Prospect chose not to proceed at this time."}

Your No is respected, and the door remains open for future consideration whenever you feel ready to re-explore this journey.
`.trim(),
    whatsappBody: ({ prospectName, note }) =>
      `Hello ${prospectName}, thank you for your honest response. We respect your decision not to move forward at this time. ${note ? `Reason: ${note}. ` : ""}The door remains open for future consideration.`,
  },
  "Need some time": {
    noteLabel: "Context / discussion note",
    noteRequired: false,
    emailBody: ({ prospectName, note }) => `
Dear ${prospectName},

Thank you for your honest response and we respect that you need some time before making a decision.

Please share your final decision within 5 working days so we can plan the next steps accordingly.

${note ? `Discussion note: ${note}` : ""}
`.trim(),
    whatsappBody: ({ prospectName, note }) =>
      `Hello ${prospectName}, thank you for your honest response. Please share your final decision within 5 working days. ${note || ""}`.trim(),
  },
  "Awaiting response": {
    noteLabel: "Reminder / response note",
    noteRequired: true,
    emailBody: ({ prospectName, note }) => `
Dear ${prospectName},

Your enrollment into the UJustBe Universe has been approved, and the only pending part is your reply.

Please respond with your decision, including confirming Yes if you want to proceed, within 2 working days.

${note ? `Reminder note: ${note}` : ""}
`.trim(),
    whatsappBody: ({ prospectName, note }) =>
      `Hello ${prospectName}, your enrollment is approved and we are awaiting your response. Please reply within 2 working days. ${note || ""}`.trim(),
  },
};

const FINAL_STATUSES = new Set([
  "Choose to enroll",
  "Decline by UJustBe",
  "Decline by Prospect",
]);

const sanitizeText = (text) =>
  String(text || "").replace(/[^a-zA-Z0-9 .,!?'"@#&()\-]/g, " ");

const formatDisplayDate = () =>
  new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

const formatLogDate = (value) => {
  if (!value) return "";

  if (value.seconds) {
    return new Date(value.seconds * 1000).toLocaleString("en-IN");
  }

  return new Date(value).toLocaleString("en-IN");
};

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

    const config = STATUS_CONFIG[selectedStatus];
    const body = config?.emailBody
      ? config.emailBody({
          prospectName: prospectMeta.prospectName,
          note,
        })
      : `Status updated: ${selectedStatus}`;

    try {
      await emailjs.send(
        "service_acyimrs",
        "template_cdm3n5x",
        {
          prospect_name: prospectMeta.prospectName,
          to_email: prospectMeta.prospectEmail,
          body,
          orbiter_name: prospectMeta.orbiterName,
        },
        "w7YI9DEqR9sdiWX9h"
      );
    } catch (error) {
      console.error("Failed to send status email:", error);
    }
  };

  const sendAssessmentMessage = async (selectedStatus, note) => {
    if (!prospectMeta.prospectPhone) return;

    const config = STATUS_CONFIG[selectedStatus];
    const bodyText = config?.whatsappBody
      ? config.whatsappBody({
          prospectName: prospectMeta.prospectName,
          note,
        })
      : `Status updated: ${selectedStatus}`;

    try {
      await sendWhatsAppTemplateRequest({
        phone: prospectMeta.prospectPhone,
        templateName: "enrollment_journey",
        parameters: [
          sanitizeText(bodyText),
          sanitizeText(prospectMeta.orbiterName),
        ],
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
