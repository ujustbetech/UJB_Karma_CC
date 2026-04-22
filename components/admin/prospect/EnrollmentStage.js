import React, { useEffect, useMemo, useState } from "react";
import emailjs from "@emailjs/browser";
import Swal from "sweetalert2";

import { sendWhatsAppTemplateRequest } from "@/utils/whatsappClient";

const STAGE_OPTIONS = [
  {
    label: "Enrollment Initiation",
    statuses: [
      "Initiation not started",
      "Initiation in progress",
      "Initiation completed",
    ],
  },
  {
    label: "Enrollment documents mail",
    statuses: ["Documents pending", "Documents sent", "Documents need revision"],
  },
  {
    label: "Enrollment Fees Mail Status",
    statuses: ["Fee mail pending", "Fee mail sent", "Fee follow-up required"],
  },
  {
    label: "Enrollment fees Option Opted for",
    statuses: [
      "Option pending",
      "Upfront payment selected",
      "Adjustment selected",
      "No response - adjustment applied",
      "Upfront payment confirmed",
    ],
  },
  {
    label: "Enrollments Completion Status",
    statuses: ["Completion pending", "Enrollment completed", "Enrollment withdrawn"],
  },
];

const sanitizeText = (text) =>
  String(text || "")
    .replace(/[\n\t]/g, " ")
    .replace(/ {5,}/g, "    ")
    .trim();

const formatLogDate = (value) => {
  if (!value) return "";

  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime())
      ? value
      : parsed.toLocaleString("en-IN");
  }

  if (value?.seconds) {
    return new Date(value.seconds * 1000).toLocaleString("en-IN");
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? ""
    : parsed.toLocaleString("en-IN");
};

const stringifyValue = (value) => {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (value?.seconds) {
    return `${value.seconds}-${value.nanoseconds || 0}`;
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

const formatStageDate = (value) => {
  if (!value) return "";

  if (typeof value === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const parsed = new Date(`${value}T00:00:00`);
      return Number.isNaN(parsed.getTime())
        ? value
        : parsed.toLocaleDateString("en-IN");
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime())
      ? value
      : parsed.toLocaleDateString("en-IN");
  }

  if (value?.seconds) {
    return new Date(value.seconds * 1000).toLocaleDateString("en-IN");
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? ""
    : parsed.toLocaleDateString("en-IN");
};

const normalizeDateValue = (value) => {
  if (!value) return "";

  if (typeof value === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value;
    }

    if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
      const [month, day, year] = value.split("/");
      return `${year}-${month}-${day}`;
    }

    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString().split("T")[0];
    }
  }

  if (value?.seconds) {
    return new Date(value.seconds * 1000).toISOString().split("T")[0];
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().split("T")[0];
};

const getLogKey = (log, index) => {
  if (log?.id) {
    return String(log.id);
  }

  const clickedAt =
    log?.clickedAt && typeof log.clickedAt === "object"
      ? `${log.clickedAt.seconds || 0}-${log.clickedAt.nanoseconds || 0}`
      : stringifyValue(log?.clickedAt || "no-date");

  const action = stringifyValue(log?.action || "no-action");
  const targetLabel = stringifyValue(
    log?.targetLabel || log?.label || "no-target"
  );
  const clickedBy = stringifyValue(log?.clickedBy || "no-user");

  return `${clickedAt}-${action}-${targetLabel}-${clickedBy}-${index}`;
};

const getLogTitle = (log) => {
  const actionLabel =
    log.action === "send_email"
      ? "Notification sent"
      : log.action === "save"
        ? "Enrollment stages saved"
        : "Enrollment update";
  const label = log.targetLabel || log.label || "";

  return label ? `${actionLabel} - ${label}` : actionLabel;
};

const normalizeRows = (savedRows) =>
  STAGE_OPTIONS.map((stage) => {
    const match = savedRows.find((item) => item.label === stage.label);

    return (
      match || {
        label: stage.label,
        checked: false,
        date: "",
        status: "",
        sent: false,
      }
    );
  }).map((row) => ({
    ...row,
    date: normalizeDateValue(row.date),
  }));

const EnrollmentStage = ({ id, fetchData }) => {
  const [rows, setRows] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [prospectMeta, setProspectMeta] = useState({
    prospectName: "",
    email: "",
    prospectPhone: "",
    orbiterName: "Orbiter",
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetch(
          `/api/admin/prospects?id=${id}&section=enrollmentstages`,
          {
            credentials: "include",
          }
        );
        const responseData = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(responseData.message || "Failed to load enrollment stages");
        }

        const prospect = responseData.prospect || {};

        setRows(
          normalizeRows(
            Array.isArray(responseData.enrollmentStages)
              ? responseData.enrollmentStages
              : []
          )
        );
        setLogs(
          Array.isArray(responseData.enrollmentStageLogs)
            ? responseData.enrollmentStageLogs
            : []
        );
        setProspectMeta({
          prospectName: prospect.prospectName || "",
          email: prospect.email || "",
          prospectPhone: prospect.prospectPhone || "",
          orbiterName: prospect.orbiterName || "Orbiter",
        });
      } catch (err) {
        console.error("Error loading enrollment data:", err);
      }
    };

    if (id) {
      loadData();
    }
  }, [id]);

  const stagedRows = useMemo(() => rows, [rows]);

  const isRowUnlocked = (index) => {
    if (index === 0) return true;

    const previousRow = stagedRows[index - 1];
    return Boolean(previousRow?.checked && previousRow?.status);
  };

  const canSend = (row, index) =>
    isRowUnlocked(index) && Boolean(row.checked && row.date && row.status);

  const getSendLabel = (row) => {
    if (row.sent) return "Sent";

    switch (row.label) {
      case "Enrollment Initiation":
        return "Send initiation";
      case "Enrollment documents mail":
        return "Send document mail";
      case "Enrollment Fees Mail Status":
        return "Send fee mail";
      case "Enrollment fees Option Opted for":
        return "Send fee option";
      case "Enrollments Completion Status":
        return "Send completion";
      default:
        return "Send";
    }
  };

  const handleChange = (index, field, value) => {
    setRows((prev) =>
      prev.map((row, rowIndex) => {
        if (rowIndex !== index) return row;

        const nextRow = {
          ...row,
          [field]: value,
        };

        if (field !== "sent") {
          nextRow.sent = false;
        }

        return nextRow;
      })
    );
  };

  const persistRows = async (nextRows, action, targetLabel = "", logMeta = {}) => {
    const res = await fetch(
      `/api/admin/prospects?id=${id}&section=enrollmentstages`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          rows: nextRows,
          action,
          targetLabel,
          previousLogs: logs,
          logMeta,
        }),
      }
    );

    const responseData = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(responseData.message || "Failed to save enrollment stages");
    }

    const prospect = responseData.prospect || {};

    setRows(
      normalizeRows(
        Array.isArray(prospect.enrollmentStages)
          ? prospect.enrollmentStages
          : nextRows
      )
    );
    setLogs(
      Array.isArray(prospect.enrollmentStageLogs)
        ? prospect.enrollmentStageLogs
        : logs
    );
  };

  const buildEmailBody = (label, date, status) => {
    switch (label) {
      case "Enrollment Initiation":
        return `Hi ${prospectMeta.prospectName},\n\nYour enrollment initiation status is "${status}" as of ${date}.`;
      case "Enrollment documents mail":
        return `Hi ${prospectMeta.prospectName},\n\nYour enrollment documents status is "${status}". Please review the next steps shared by the team.`;
      case "Enrollment Fees Mail Status":
        return `Hi ${prospectMeta.prospectName},\n\nYour enrollment fee communication status is "${status}". Please review the instructions and respond accordingly.`;
      case "Enrollment fees Option Opted for":
        return `Hi ${prospectMeta.prospectName},\n\nYour selected enrollment fee option is "${status}".`;
      case "Enrollments Completion Status":
        return `Hi ${prospectMeta.prospectName},\n\nYour enrollment completion status is "${status}".`;
      default:
        return `Hi ${prospectMeta.prospectName},\n\nUpdate regarding "${label}" on ${date}: ${status}.`;
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      for (let index = 0; index < rows.length; index += 1) {
        const row = rows[index];
        const unlocked = isRowUnlocked(index);

        if (!unlocked && (row.checked || row.date || row.status || row.sent)) {
          throw new Error(`Complete the previous step before updating "${row.label}".`);
        }

        if (row.checked && (!row.date || !row.status)) {
          throw new Error(`Complete date and status for "${row.label}".`);
        }
      }

      await persistRows(rows, "save");
      Swal.fire("Saved!", "Enrollment stages have been saved.", "success");
      fetchData?.();
    } catch (err) {
      console.error("Error saving enrollment stages:", err);
      Swal.fire("Error", err.message || "Failed to save changes.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async (index) => {
    const row = rows[index];

    if (!canSend(row, index)) {
      Swal.fire("Incomplete step", "Please complete and save this step first.", "warning");
      return;
    }

    try {
      setLoading(true);

      const body = buildEmailBody(row.label, row.date, row.status);

      if (prospectMeta.email) {
        await emailjs.send(
          "service_acyimrs",
          "template_cdm3n5x",
          {
            to_email: prospectMeta.email,
            prospect_name: prospectMeta.prospectName || "Prospect",
            body,
          },
          "w7YI9DEqR9sdiWX9h"
        );
      }

      if (prospectMeta.prospectPhone) {
        await sendWhatsAppTemplateRequest({
          phone: prospectMeta.prospectPhone,
          templateName: "enrollment_journey",
          parameters: [sanitizeText(body), sanitizeText(prospectMeta.orbiterName)],
        });
      }

      const nextRows = rows.map((currentRow, rowIndex) =>
        rowIndex === index ? { ...currentRow, sent: true } : currentRow
      );

      await persistRows(nextRows, "send_email", row.label, {
        status: row.status,
        date: row.date,
        label: row.label,
      });

      Swal.fire("Sent!", `Notification sent for "${row.label}".`, "success");
    } catch (err) {
      console.error("Error sending enrollment update:", err);
      Swal.fire("Error", "Failed to send update.", "error");
    } finally {
      setLoading(false);
    }
  };

  const confirmAndSendEmail = (index) => {
    Swal.fire({
      title: "Are you sure?",
      text: "Do you want to send the email and WhatsApp update?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, send it!",
    }).then((result) => {
      if (result.isConfirmed) {
        handleSendEmail(index);
      }
    });
  };

  const confirmAndSave = () => {
    Swal.fire({
      title: "Are you sure?",
      text: "Do you want to save the changes?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, save it!",
    }).then((result) => {
      if (result.isConfirmed) {
        handleSave();
      }
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white border rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-6">Enrollment Status Updates</h2>

        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-100 text-gray-700 text-sm">
              <tr>
                <th className="px-4 py-3 text-left border-b">Check</th>
                <th className="px-4 py-3 text-left border-b">Stage</th>
                <th className="px-4 py-3 text-left border-b">Date</th>
                <th className="px-4 py-3 text-left border-b">Status</th>
                <th className="px-4 py-3 text-left border-b">Send Email</th>
              </tr>
            </thead>

            <tbody className="text-sm">
              {rows.map((row, index) => {
                const unlocked = isRowUnlocked(index);

                return (
                  <tr
                    key={row.label}
                    className={`border-b ${
                      unlocked ? "hover:bg-gray-50" : "bg-slate-50 text-slate-400"
                    }`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={row.checked}
                        disabled={!unlocked || loading}
                        onChange={(e) =>
                          handleChange(index, "checked", e.target.checked)
                        }
                        className="w-4 h-4"
                      />
                    </td>

                    <td className="px-4 py-3 font-medium">{row.label}</td>

                    <td className="px-4 py-3">
                      <input
                        type="date"
                        value={row.date}
                        disabled={!unlocked || !row.checked || loading}
                        onChange={(e) => handleChange(index, "date", e.target.value)}
                        className="border rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-black disabled:bg-slate-100"
                      />
                    </td>

                    <td className="px-4 py-3">
                      <select
                        value={row.status}
                        disabled={!unlocked || !row.checked || loading}
                        onChange={(e) => handleChange(index, "status", e.target.value)}
                        className="border rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-black disabled:bg-slate-100"
                      >
                        <option value="">Select</option>
                        {(STAGE_OPTIONS.find((stage) => stage.label === row.label)?.statuses || []).map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="px-4 py-3">
                      <button
                        onClick={() => confirmAndSendEmail(index)}
                        disabled={!canSend(row, index) || loading}
                        className="bg-black text-white px-4 py-1 rounded-lg hover:bg-gray-800 transition disabled:bg-gray-400"
                      >
                        {getSendLabel(row)}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={confirmAndSave}
            disabled={loading}
            className={`px-5 py-2 rounded-lg text-white transition ${
              loading ? "bg-gray-400 cursor-not-allowed" : "bg-black hover:bg-gray-800"
            }`}
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>

        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-3">Action Log</h3>

          {logs.length === 0 ? (
            <p className="text-gray-500">No actions logged yet.</p>
          ) : (
            <div className="space-y-3">
              {[...logs].reverse().map((log, index) => (
                <div
                  key={getLogKey(log, index)}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                >
                  <p className="font-medium">{getLogTitle(log)}</p>

                  <p className="text-sm text-slate-600">
                    <span className="font-medium">By:</span> {log.clickedBy || "Admin"}
                    {" · "}
                    <span className="font-medium">At:</span>{" "}
                    {formatLogDate(log.clickedAt)}
                  </p>

                  {log.status && (
                    <p className="text-sm text-slate-600">
                      <span className="font-medium">Selected status:</span> {log.status}
                    </p>
                  )}

                  {log.date && (
                    <p className="text-sm text-slate-600">
                      <span className="font-medium">Date:</span> {formatStageDate(log.date)}
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

export default EnrollmentStage;
