"use client";

import React, { useState, useEffect } from "react";
import "react-quill-new/dist/quill.snow.css";
import emailjs from "@emailjs/browser";
import dynamic from "next/dynamic";
import { sendWhatsAppTemplateRequest } from "@/utils/whatsappClient";

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

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (data.sections?.[0]) {
      setSection(data.sections[0]);
      setHasData(true);
      setEditMode(false);
    }
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

      setHasData(true);
      setEditMode(false);

      const origin =
        typeof window !== "undefined"
          ? window.location.origin
          : "https://ujustbe.vercel.app";
      const formLink = `${origin}/user/prospects/${id}`;

      const orbiterName = data.orbiterName || "Orbiter";
      const prospectEmail = data.email || "orbiter@example.com";
      const prospectName = data.prospectName || "Prospect";
      const phone = data.prospectPhone || "9999999999";

      const emailBody = `
Dear ${prospectName},

It was a pleasure connecting with you and introducing UJustBe!

Please take a few minutes to fill out this assessment form: ${formLink}

Thank you!
`;

      await sendAssessmentEmail(
        orbiterName,
        prospectEmail,
        prospectName,
        formLink
      );

      await sendAssesmentMessage(
        orbiterName,
        prospectName,
        emailBody,
        phone
      );

    } catch (error) {

      console.error("Error saving section:", error);

    }

    setLoading(false);
  };

  const sanitizeText = (text) => {
    return text
      .replace(/[\n\t]/g, " ")
      .replace(/ {5,}/g, "    ")
      .trim();
  };

  const sendAssesmentMessage = async (
    orbiterName,
    prospectName,
    bodyText,
    phone
  ) => {
    try {
      await sendWhatsAppTemplateRequest({
        phone,
        templateName: "enrollment_journey",
        parameters: [
          sanitizeText(bodyText),
          sanitizeText(orbiterName),
        ],
      });
      console.log("WhatsApp message sent");
    } catch (error) {
      console.error("WhatsApp failed", error);
    }
  };

  const sendAssessmentEmail = async (
    orbiterName,
    prospectEmail,
    prospectName,
    formLink
  ) => {

    const templateParams = {
      prospect_name: prospectName,
      to_email: prospectEmail,
      body: `Please fill feedback form ${formLink}`,
      orbiter_name: orbiterName,
    };

    try {

      await emailjs.send(
        "service_acyimrs",
        "template_cdm3n5x",
        templateParams,
        "w7YI9DEqR9sdiWX9h"
      );

    } catch (error) {

      console.error("Email failed", error);

    }

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

      </div>

    </div>
  );
};

export default AditionalInfo;

