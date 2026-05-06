"use client";

import React, { useEffect, useState } from "react";
import MentorInfo from "@/components/prospect/MentorInfo";
import ProspectForm from "@/components/prospect/ProspectForm";
import SuccessModal from "@/components/prospect/SuccessModal";
import UserPageHeader from "@/components/user/UserPageHeader";
import { UserPlus } from "lucide-react";
import emailjs from "@emailjs/browser";
import { getFallbackOnboardingEmailTemplate } from "@/lib/onboarding/onboarding_email";
import {
  createUserDraftProspect,
  fetchCurrentUserProfile,
} from "@/services/prospectService";

function applyTemplateVariables(template = "", values = {}) {
  return String(template || "").replace(/\{\{\s*(.*?)\s*\}\}/g, (_, key) => {
    const normalizedKey = String(key || "").trim();
    return values[normalizedKey] ?? `{{${normalizedKey}}}`;
  });
}

async function sendClientProspectAssessmentEmail({
  mentor,
  formData,
  formLink,
  prospect,
}) {
  const emailChannel = getFallbackOnboardingEmailTemplate(
    "prospect_assessment_request"
  );
  const recipient = emailChannel?.recipients?.orbiter;
  const orbiterEmail = String(
    mentor?.Email ||
      mentor?.email ||
      prospect?.orbiterEmail ||
      ""
  ).trim();
  const orbiterName = String(
    mentor?.Name || mentor?.name || prospect?.orbiterName || ""
  ).trim();

  if (!orbiterEmail) {
    return {
      ok: false,
      reason: "missing_orbiter_email",
      details: "MentOrbiter email not found on profile/prospect record.",
    };
  }

  if (!emailChannel?.serviceId || !emailChannel?.templateId || !emailChannel?.publicKey) {
    return {
      ok: false,
      reason: "missing_emailjs_config",
      details: "EmailJS config is missing in onboarding fallback template.",
    };
  }

  const values = {
    orbiter_name: orbiterName || "MentOrbiter",
    prospect_name: String(formData?.prospectName || "").trim(),
    form_link: String(formLink || "").trim(),
  };

  const body = applyTemplateVariables(recipient?.body, values);

  try {
    await emailjs.send(
      emailChannel.serviceId,
      emailChannel.templateId,
      {
        prospect_name: values.prospect_name,
        to_email: orbiterEmail,
        body,
        orbiter_name: values.orbiter_name,
      },
      emailChannel.publicKey
    );
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      reason: "email_send_failed",
      details: error?.message || "Unknown EmailJS error",
    };
  }
}

export default function UserAddProspect() {
  const [mentor, setMentor] = useState(null);
  const [loadingMentor, setLoadingMentor] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [messageTrigger, setMessageTrigger] = useState(null);

  const [formData, setFormData] = useState({
    prospectName: "",
    prospectPhone: "",
    email: "",
    dob: "",
    occupation: "",
    hobbies: "",
    source: "Orbiter",
    type: "orbiter_connection",
  });

  useEffect(() => {
    setLoadingMentor(true);

    const loadMentor = async () => {
      try {
        const profile = await fetchCurrentUserProfile();
        setMentor(profile);
      } catch {
        setMentor(null);
      } finally {
        setLoadingMentor(false);
      }
    };

    loadMentor();
  }, []);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (submitting) return;

    try {
      setSubmitting(true);
      setSubmitError("");
      const snapshotFormData = { ...formData };
      const result = await createUserDraftProspect(formData);
      const prospectId = result?.prospect?.id || "";
      const formLink = prospectId
        ? `${window.location.origin}/user/prospects/${prospectId}`
        : "";
      const emailResult = await sendClientProspectAssessmentEmail({
        mentor,
        formData: snapshotFormData,
        formLink,
        prospect: result?.prospect || null,
      });

      const triggerSummary = {
        ...(result?.messageTrigger || {}),
        email: emailResult,
        success: Boolean(result?.messageTrigger?.whatsapp?.ok) && Boolean(emailResult?.ok),
      };

      setMessageTrigger(triggerSummary);
      const noteText = triggerSummary.success
        ? "Prospect added and assessment email sent to the MentOrbiter"
        : `Assessment message trigger issue: Email failed (${emailResult?.details || emailResult?.reason || "unknown"}).`;
      try {
        await fetch("/api/user/prospects/draft", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            id: result?.prospect?.id,
            note: noteText,
            currentStage: triggerSummary.success ? "Assessment Form" : "",
          }),
        });
      } catch (noteError) {
        console.error("Failed to persist draft note:", noteError);
      }

      setFormData({
        prospectName: "",
        prospectPhone: "",
        email: "",
        dob: "",
        occupation: "",
        hobbies: "",
        source: "Orbiter",
        type: "orbiter_connection",
      });

      setShowSuccess(true);
    } catch (error) {
      console.error("Draft create failed:", error);
      setSubmitError(error?.message || "Unable to create draft prospect.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="min-h-screen py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <UserPageHeader
            title="Add Prospect"
            description="Register a new lead under your network and keep your prospect pipeline fresh and organized."
            icon={UserPlus}
          />

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm">
            {loadingMentor ? (
              <div className="p-6 animate-pulse space-y-4">
                <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                <div className="h-16 bg-slate-200 rounded-xl"></div>
              </div>
            ) : mentor ? (
              <MentorInfo mentor={mentor} />
            ) : (
              <div className="p-6 text-sm text-red-500">Mentor not found.</div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <ProspectForm
              formData={formData}
              onChange={handleChange}
              onSubmit={handleSubmit}
              submitting={submitting}
              submitError={submitError}
            />
          </div>
        </div>
      </div>

      <SuccessModal
        open={showSuccess}
        onClose={() => setShowSuccess(false)}
        messageTrigger={messageTrigger}
      />
    </>
  );
}


