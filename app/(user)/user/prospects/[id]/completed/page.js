"use client";

import { useEffect } from "react";
import Swal from "sweetalert2";
import { useSearchParams } from "next/navigation";

export default function ProspectAssessmentCompletedPage() {
  const searchParams = useSearchParams();
  const submitted = searchParams.get("submitted") === "1";
  const type = searchParams.get("type") || "assessment";
  const isFeedback = type === "feedback";

  useEffect(() => {
    if (!submitted) return;

    Swal.fire({
      icon: "success",
      title: "Thank you for submitting",
      text: isFeedback
        ? "Your feedback has been submitted successfully."
        : "Your assessment has been submitted successfully.",
      confirmButtonText: "OK",
    });
  }, [submitted, isFeedback]);

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-2xl rounded-3xl bg-white p-10 text-center shadow-lg">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-indigo-600">
          {isFeedback ? "Feedback Completed" : "Assessment Completed"}
        </p>
        <h1 className="mt-4 text-3xl font-bold text-slate-900">
          Thank you for your precious time.
        </h1>
        <p className="mt-6 text-lg leading-8 text-slate-600">
          {isFeedback
            ? "You have already completed this feedback form. We are in the process of reviewing the next onboarding steps."
            : "You have already completed this assessment. We are in the process of collecting the other details for onboarding."}
        </p>
      </div>
    </main>
  );
}
