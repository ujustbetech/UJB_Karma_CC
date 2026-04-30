"use client";

import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { useParams, useRouter } from "next/navigation";

const interestOptions = [
  "Space for Personal Growth & Contribution",
  "Freedom to Express and Connect",
  "Business Promotion & Visibility",
  "Earning Through Referral",
  "Networking & Events",
];

const communicationOptions = ["Whatsapp", "Email", "Phone call"];

const understandingOptions = [
  { label: "Select", value: "" },
  { label: "Excellent", value: "Excellent" },
  { label: "Good", value: "Good" },
  { label: "Fair", value: "Fair" },
  { label: "Poor", value: "Poor" },
];

const selfGrowthOptions = [
  { label: "Select", value: "" },
  { label: "Yes, very clearly", value: "Yes, very clearly" },
  { label: "Somewhat", value: "Somewhat" },
  { label: "No, still unclear", value: "No, still unclear" },
];

const joinInterestOptions = [
  { label: "Select", value: "" },
  { label: "Yes, I am interested", value: "Yes, I am interested" },
  {
    label: "I would like to think about it",
    value: "I would like to think about it",
  },
  { label: "No, not interested", value: "No, not interested" },
];

const emptyForm = {
  fullName: "",
  phoneNumber: "",
  email: "",
  mentorName: "",
  understandingLevel: "",
  selfGrowthUnderstanding: "",
  joinInterest: "",
  interestAreas: [],
  communicationOptions: [],
  additionalComments: "",
};

function getFieldClass(error) {
  return `w-full rounded-lg border p-3 ${
    error ? "border-red-500 focus:border-red-500" : "border-gray-300"
  }`;
}

function FieldError({ message }) {
  if (!message) return null;

  return <p className="mt-1 text-sm text-red-600">{message}</p>;
}

function FieldLabel({ label, required = false }) {
  return (
    <label className="mb-2 block text-sm font-medium text-gray-700">
      {label}
      {required ? <span className="text-red-600"> *</span> : null}
    </label>
  );
}

export default function ProspectFeedbackFormPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchProspectFeedbackDetails = async () => {
      if (!id) return;

      try {
        const res = await fetch(`/api/prospects/${id}/feedback`);
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(data.message || "Failed to fetch prospect feedback form");
        }

        if (data.isSubmitted) {
          router.replace(`/user/prospects/${id}/completed?type=feedback`);
          return;
        }

        const prospect = data.prospect || {};

        setFormData((prev) => ({
          ...prev,
          fullName: prospect.prospectName || "",
          phoneNumber: prospect.prospectPhone || "",
          email: prospect.email || "",
          mentorName: prospect.orbiterName || "",
        }));
      } catch (error) {
        Swal.fire("Error", "Unable to load prospect feedback form", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchProspectFeedbackDetails();
  }, [id, router]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSelectChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleCheckboxChange = (e, key) => {
    const { value, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [key]: checked
        ? [...prev[key], value]
        : prev[key].filter((entry) => entry !== value),
    }));

    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch(`/api/prospects/${id}/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json().catch(() => ({}));

      if (res.status === 409) {
        router.replace(`/user/prospects/${id}/completed?type=feedback`);
        return;
      }

      if (res.status === 400 && data.errors) {
        setErrors(data.errors);
        Swal.fire(
          "Validation",
          data.message || "Please complete the required fields.",
          "warning"
        );
        return;
      }

      if (!res.ok) {
        throw new Error(data.message || "Something went wrong.");
      }

      router.replace(`/user/prospects/${id}/completed?submitted=1&type=feedback`);
    } catch (error) {
      Swal.fire("Error", "Something went wrong.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 py-10">
        <div className="mx-auto max-w-4xl rounded-2xl bg-white p-8 shadow-lg">
          <p className="text-center text-gray-600">Loading feedback form...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-10">
      <div className="mx-auto max-w-4xl rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="mb-8 text-3xl font-bold text-slate-900">
          Prospect Feedback Form
        </h1>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <FieldLabel label="Prospect Name" required />
              <input
                className={getFieldClass(errors.fullName)}
                name="fullName"
                value={formData.fullName}
                disabled
                onChange={handleChange}
              />
              <FieldError message={errors.fullName} />
            </div>

            <div>
              <FieldLabel label="Phone Number" required />
              <input
                className={getFieldClass(errors.phoneNumber)}
                name="phoneNumber"
                value={formData.phoneNumber}
                disabled
                onChange={handleChange}
              />
              <FieldError message={errors.phoneNumber} />
            </div>

            <div>
              <FieldLabel label="Email" required />
              <input
                className={getFieldClass(errors.email)}
                name="email"
                value={formData.email}
                disabled
                onChange={handleChange}
              />
              <FieldError message={errors.email} />
            </div>

            <div>
              <FieldLabel label="Orbiter Name" required />
              <input
                className={getFieldClass(errors.mentorName)}
                name="mentorName"
                value={formData.mentorName}
                disabled
                onChange={handleChange}
              />
              <FieldError message={errors.mentorName} />
            </div>
          </div>

          <div>
            <FieldLabel label="Understanding of UJustBe" required />
            <select
              className={getFieldClass(errors.understandingLevel)}
              value={formData.understandingLevel}
              onChange={(e) =>
                handleSelectChange("understandingLevel", e.target.value)
              }
            >
              {understandingOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <FieldError message={errors.understandingLevel} />
          </div>

          <div>
            <FieldLabel label="Self Growth Clarity" required />
            <select
              className={getFieldClass(errors.selfGrowthUnderstanding)}
              value={formData.selfGrowthUnderstanding}
              onChange={(e) =>
                handleSelectChange("selfGrowthUnderstanding", e.target.value)
              }
            >
              {selfGrowthOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <FieldError message={errors.selfGrowthUnderstanding} />
          </div>

          <div>
            <FieldLabel label="Interest in Joining" required />
            <select
              className={getFieldClass(errors.joinInterest)}
              value={formData.joinInterest}
              onChange={(e) => handleSelectChange("joinInterest", e.target.value)}
            >
              {joinInterestOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <FieldError message={errors.joinInterest} />
          </div>

          <div>
            <FieldLabel label="Interest Areas" required />
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {interestOptions.map((option) => (
                <label key={option} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    value={option}
                    checked={formData.interestAreas.includes(option)}
                    onChange={(e) => handleCheckboxChange(e, "interestAreas")}
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
            <FieldError message={errors.interestAreas} />
          </div>

          <div>
            <FieldLabel label="Preferred Communication" required />
            <div className="flex flex-col gap-2 md:flex-row md:gap-4">
              {communicationOptions.map((option) => (
                <label key={option} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    value={option}
                    checked={formData.communicationOptions.includes(option)}
                    onChange={(e) =>
                      handleCheckboxChange(e, "communicationOptions")
                    }
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
            <FieldError message={errors.communicationOptions} />
          </div>

          <div>
            <FieldLabel label="Comments" />
            <textarea
              className={getFieldClass(errors.additionalComments)}
              name="additionalComments"
              value={formData.additionalComments}
              onChange={handleChange}
              rows={5}
            />
            <FieldError message={errors.additionalComments} />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-indigo-600 px-6 py-3 font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Submitting..." : "Submit Feedback"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}


