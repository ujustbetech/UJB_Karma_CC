"use client";

import React, { useState, useEffect } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/firebaseConfig";
import { COLLECTIONS } from "@/lib/utility_collection";
import "react-quill-new/dist/quill.snow.css";
import emailjs from "@emailjs/browser";
import axios from "axios";
import dynamic from "next/dynamic";

const ReactQuill = dynamic(() => import("react-quill-new"), {
  ssr: false,
  loading: () => <p>Loading editor...</p>,
});

const AditionalInfo = ({ id, data = { sections: [] }, fetchData }) => {
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

  const WHATSAPP_API_URL =
    "https://graph.facebook.com/v22.0/527476310441806/messages";

  const WHATSAPP_API_TOKEN =
    "Bearer EAAHwbR1fvgsBOwUInBvR1SGmVLSZCpDZAkn9aZCDJYaT0h5cwyiLyIq7BnKmXAgNs0ZCC8C33UzhGWTlwhUarfbcVoBdkc1bhuxZBXvroCHiXNwZCZBVxXlZBdinVoVnTB7IC1OYS4lhNEQprXm5l0XZAICVYISvkfwTEju6kV4Aqzt4lPpN8D3FD7eIWXDhnA4SG6QZDZD";

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (data.sections?.[0]) {
      setSection(data.sections[0]);
    }
  }, [data]);

  const handleInputChange = (value, field) => {
    setSection((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setLoading(true);

    try {
      const existingDocRef = doc(db, COLLECTIONS.prospect, id);

      await updateDoc(existingDocRef, { sections: [section] });

      const formLink = `https://otc-app.vercel.app/prospectfeedbackform/${id}`;

      const orbiterName = data.orbiterName || "Orbiter";
      const prospectEmail = data.email || "orbiter@example.com";
      const prospectName = data.prospectName || "Prospect";
      const phone = data.prospectPhone || "9999999999";

      const emailBody = `
Dear ${prospectName},

It was a pleasure connecting with you and introducing UJustBe!

Please take a few minutes to fill out this form: ${formLink}

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
    const payload = {
      messaging_product: "whatsapp",
      to: `91${phone}`,
      type: "template",
      template: {
        name: "enrollment_journey",
        language: { code: "en" },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: sanitizeText(bodyText) },
              { type: "text", text: sanitizeText(orbiterName) },
            ],
          },
        ],
      },
    };

    try {
      await axios.post(WHATSAPP_API_URL, payload, {
        headers: {
          Authorization: WHATSAPP_API_TOKEN,
          "Content-Type": "application/json",
        },
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
          <h4 className="text-lg font-medium mb-2">As lived Experience</h4>
          {renderEditor("lived", "Lived")}
        </div>

        <div>
          <h4 className="text-lg font-medium mb-2">Overview of UJustBe</h4>
          {renderEditor("overviewOfUJB", "")}
        </div>

        <div>
          <h4 className="text-lg font-medium mb-2">Why UJustBe</h4>
          {renderEditor("whyUJB", "")}
        </div>

        <div>
          <h4 className="text-lg font-medium mb-2">Selection Rationale</h4>
          {renderEditor("selectionRational", "")}
        </div>

        <div>
          <h4 className="text-lg font-medium mb-2">Tangible Aspects</h4>
          {renderEditor("tangible", "Tangible")}
        </div>

        <div>
          <h4 className="text-lg font-medium mb-2">Intangible Aspects</h4>
          {renderEditor("intangible", "Intangible")}
        </div>

        <div>
          <h4 className="text-lg font-medium mb-2">Vision Statement</h4>
          {renderEditor("vision", "Vision")}
        </div>

        <div>
          <h4 className="text-lg font-medium mb-2">Happy Face</h4>
          {renderEditor("happyFace", "Happy Face")}
        </div>

      </div>

      <div className="mt-8 flex justify-end">
        <button
          onClick={handleSave}
          disabled={loading}
          className={`px-6 py-2 rounded-lg text-white transition ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-black hover:bg-gray-800"
          }`}
        >
          {loading ? "Saving..." : "Save"}
        </button>
      </div>

    </div>

  </div>
);
};

export default AditionalInfo;