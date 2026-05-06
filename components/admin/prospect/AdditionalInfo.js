"use client";

import React, { useState, useEffect } from "react";
import "react-quill-new/dist/quill.snow.css";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { formatDate, formatDateTime } from "@/lib/utils/dateFormat";

const ReactQuill = dynamic(() => import("react-quill-new"), {
  ssr: false,
  loading: () => <p>Loading editor...</p>,
});

const requiredHeading = (label) => (
  <>
    {label}
    <span className="text-red-600"> *</span>
  </>
);

const AditionalInfo = ({ id, data = { sections: [] } }) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [section, setSection] = useState({
    lived: "",
    overviewOfUJB: "",
    whyUJB: "",
    selectionRational: "",
    tangible: "",
    intangible: "",
    vision: "",
    happyFace: "",
  });

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);

  const [hasData, setHasData] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (data.sections?.[0]) {
      setSection(data.sections[0]);
      setHasData(true);
      setEditMode(false);
    }

    setAuditLogs(
      Array.isArray(data.formAuditLogs)
        ? data.formAuditLogs.filter(
            (log) =>
              log?.formName === "UJB Enrollment Form" ||
              log?.formName === "Feedback Form"
          )
        : []
    );
  }, [data]);

  const handleInputChange = (value, field) => {
    setSection((prev) => ({ ...prev, [field]: value }));
  };

  const getPlainText = (value) =>
    String(value || "")
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const validateSection = () => {
    const requiredFields = [
      { key: "lived", label: "As lived Experience" },
      { key: "overviewOfUJB", label: "Overview of UJustBe" },
      { key: "whyUJB", label: "Why UJustBe" },
      { key: "selectionRational", label: "Selection Rationale" },
      { key: "tangible", label: "Tangible Aspects" },
      { key: "intangible", label: "Intangible Aspects" },
      { key: "vision", label: "Vision Statement" },
      { key: "happyFace", label: "Happy Face" },
    ];

    const missingFields = requiredFields.filter(
      ({ key }) => !getPlainText(section[key])
    );

    if (missingFields.length > 0) {
      alert(
        `Please complete all required fields before saving. Missing: ${missingFields
          .map(({ label }) => label)
          .join(", ")}`
      );
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateSection()) {
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(
        `/api/admin/prospects?id=${id}&section=additionalinfo`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            update: {
              sections: [section],
            },
          }),
        }
      );
      const responseData = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(responseData.message || "Failed to save pre-enrollment form");
      }

      setAuditLogs(Array.isArray(responseData.auditLogs) ? responseData.auditLogs.filter(
        (log) =>
          log?.formName === "UJB Enrollment Form" ||
          log?.formName === "Feedback Form"
      ) : []);

      setHasData(true);
      setEditMode(false);

      const returnTab = searchParams.get("returnTab");
      if (returnTab && id) {
        router.push(`/admin/prospect/edit/${id}?tab=${returnTab}`);
      }

    } catch (error) {

      console.error("Error saving section:", error);

    }

    setLoading(false);
  };

  const renderEditor = (field, placeholder) => (

    <div className="editor-wrapper">

      {mounted && (
        <ReactQuill
          theme="snow"
          placeholder={placeholder}
          value={section[field]}
          readOnly={hasData && !editMode}
          onChange={(value) => handleInputChange(value, field)}
        />
      )}

    </div>

  );

  return (

    <div className="max-w-5xl mx-auto p-6">

      <div className="bg-white border rounded-xl shadow-sm p-6">

        <h2 className="text-2xl font-semibold mb-8">
          UJB Pre Enrollment Assessment Form
        </h2>

        <div className="space-y-8">

          <div>
            <h4 className="text-lg font-medium mb-2">{requiredHeading("As lived Experience")}</h4>
            {renderEditor("lived", "Lived")}
          </div>

          <div>
            <h4 className="text-lg font-medium mb-2">{requiredHeading("Overview of UJustBe")}</h4>
            {renderEditor("overviewOfUJB", "")}
          </div>

          <div>
            <h4 className="text-lg font-medium mb-2">{requiredHeading("Why UJustBe")}</h4>
            {renderEditor("whyUJB", "")}
          </div>

          <div>
            <h4 className="text-lg font-medium mb-2">{requiredHeading("Selection Rationale")}</h4>
            {renderEditor("selectionRational", "")}
          </div>

          <div>
            <h4 className="text-lg font-medium mb-2">{requiredHeading("Tangible Aspects")}</h4>
            {renderEditor("tangible", "Tangible")}
          </div>

          <div>
            <h4 className="text-lg font-medium mb-2">{requiredHeading("Intangible Aspects")}</h4>
            {renderEditor("intangible", "Intangible")}
          </div>

          <div>
            <h4 className="text-lg font-medium mb-2">{requiredHeading("Vision Statement")}</h4>
            {renderEditor("vision", "Vision")}
          </div>

          <div>
            <h4 className="text-lg font-medium mb-2">{requiredHeading("Happy Face")}</h4>
            {renderEditor("happyFace", "Happy Face")}
          </div>

        </div>

        <div className="mt-8 flex justify-end gap-3">

          {!hasData && (
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-6 py-2 rounded-lg text-white bg-black hover:bg-gray-800"
            >
              Save
            </button>
          )}

          {hasData && !editMode && (
            <button
              onClick={() => setEditMode(true)}
              className="px-6 py-2 rounded-lg text-white bg-black hover:bg-gray-800"
            >
              Edit
            </button>
          )}

          {editMode && (
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-6 py-2 rounded-lg text-white bg-black hover:bg-gray-800"
            >
              Update
            </button>
          )}

        </div>

        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-3">Audit Log</h3>
          <div className="space-y-3">
            {auditLogs.length === 0 ? (
              <p className="text-sm text-slate-500">No audit activity recorded yet.</p>
            ) : (
              [...auditLogs].reverse().map((log) => (
                <div
                  key={log.id}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                >
                  <p className="font-medium">
                    {log.formName} - {log.actionType}
                  </p>
                  <p className="text-sm text-slate-600">
                    {log.performedBy} ({log.userRole}) {log.userIdentity ? `- ${log.userIdentity}` : ""}
                  </p>
                  <p className="text-sm text-slate-600">
                    {formatDateTime(log.timestamp, "")}
                  </p>
                  {Array.isArray(log.changedFields) && log.changedFields.length > 0 ? (
                    <div className="mt-2 space-y-1">
                      {log.changedFields.map((fieldChange, index) => (
                        <p key={`${log.id}-${fieldChange.field}-${index}`} className="text-sm text-slate-600">
                          {fieldChange.field}: {formatDate(fieldChange.before, fieldChange.before || "empty") || fieldChange.before || "empty"} -&gt; {formatDate(fieldChange.after, fieldChange.after || "empty") || fieldChange.after || "empty"}
                        </p>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default AditionalInfo;



