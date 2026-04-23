"use client";

import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { useParams, useRouter } from "next/navigation";

const tabs = ["Mentor", "Prospect", "Alignment", "Assessment"];
const today = new Date().toISOString().split("T")[0];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^(?:\+91)?[6-9]\d{9}$/;

const initialFormState = {
  fullName: "",
  phoneNumber: "",
  email: "",
  country: "",
  city: "",
  profession: "",
  companyName: "",
  industry: "",
  socialProfile: "",
  howFound: "",
  interestLevel: "",
  interestAreas: [],
  contributionWays: [],
  informedStatus: "",
  alignmentLevel: "",
  recommendation: "",
  additionalComments: "",
  mentorName: "",
  mentorPhone: "",
  mentorEmail: "",
  howFoundOther: "",
  interestOther: "",
  contributionOther: "",
  assessmentDate: today,
};

const interestOptions = [
  "Skill Sharing & Collaboration",
  "Business Growth & Referrals",
  "Learning & Personal Development",
  "Community Engagement",
  "Others (please specify)",
];

const contributionOptions = [
  "Sharing knowledge and expertise",
  "Providing business or services",
  "Connecting with fellow Orbiters",
  "Active participation in events/meetings",
  "Other (please specify)",
];

function normalizePhone(value) {
  const digits = String(value || "").replace(/\D/g, "");

  if (digits.length === 12 && digits.startsWith("91")) {
    return `+${digits}`;
  }

  if (digits.length === 10) {
    return `+91${digits}`;
  }

  return String(value || "").trim();
}

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

export default function ProspectForm() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;

  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [countries, setCountries] = useState([]);
  const [cities, setCities] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetch("https://countriesnow.space/api/v0.1/countries/positions")
      .then((res) => res.json())
      .then((data) =>
        setCountries(Array.isArray(data.data) ? data.data.map((c) => c.name) : [])
      )
      .catch(() => setCountries([]));
  }, []);

  useEffect(() => {
    const fetchProspectDetails = async () => {
      if (!id) return;

      try {
        const res = await fetch(`/api/prospects/${id}`);
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(data.message || "Failed to fetch prospect");
        }

        if (data.isSubmitted) {
          router.replace(`/user/prospects/${id}/completed`);
          return;
        }

        const prospect = data.prospect || {};
        const nextCountry = prospect.country || "";

        setFormData((prev) => ({
          ...prev,
          fullName: prospect.prospectName || "",
          phoneNumber: prospect.prospectPhone || "",
          email: prospect.email || "",
          country: nextCountry,
          city: prospect.city || "",
          profession: prospect.occupation || "",
          companyName: prospect.companyName || "",
          industry: prospect.industry || "",
          socialProfile: prospect.socialProfile || "",
          mentorName: prospect.orbiterName || "",
          mentorPhone: prospect.orbiterContact || "",
          mentorEmail: prospect.orbiterEmail || "",
        }));

        if (nextCountry) {
          const cityRes = await fetch(
            "https://countriesnow.space/api/v0.1/countries/cities",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ country: nextCountry }),
            }
          );
          const cityData = await cityRes.json().catch(() => ({}));
          setCities(Array.isArray(cityData.data) ? cityData.data : []);
        }
      } catch (error) {
        Swal.fire(
          "Error",
          error?.message || "Unable to load prospect details",
          "error"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProspectDetails();
  }, [id, router]);

  const validateForm = (data) => {
    const nextErrors = {};

    if (!data.mentorName.trim()) nextErrors.mentorName = "Mentor name is required.";
    if (!PHONE_REGEX.test(data.mentorPhone.replace(/\s/g, ""))) {
      nextErrors.mentorPhone = "Enter a valid Indian mobile number.";
    }
    if (!EMAIL_REGEX.test(data.mentorEmail.trim())) {
      nextErrors.mentorEmail = "Enter a valid email address.";
    }
    if (!data.assessmentDate) {
      nextErrors.assessmentDate = "Assessment date is required.";
    } else {
      const selectedDate = new Date(`${data.assessmentDate}T00:00:00`);
      const maxDate = new Date();
      maxDate.setHours(0, 0, 0, 0);

      if (Number.isNaN(selectedDate.getTime()) || selectedDate > maxDate) {
        nextErrors.assessmentDate = "Assessment date cannot be in the future.";
      }
    }

    if (!data.fullName.trim()) nextErrors.fullName = "Prospect name is required.";
    if (!PHONE_REGEX.test(data.phoneNumber.replace(/\s/g, ""))) {
      nextErrors.phoneNumber = "Enter a valid Indian mobile number.";
    }
    if (!EMAIL_REGEX.test(data.email.trim())) {
      nextErrors.email = "Enter a valid email address.";
    }
    if (!data.country) nextErrors.country = "Country is required.";
    if (!data.city) nextErrors.city = "City is required.";
    if (!data.profession.trim()) nextErrors.profession = "Occupation is required.";

    if (!data.howFound) nextErrors.howFound = "Please select an option.";
    if (data.howFound === "Other" && !data.howFoundOther.trim()) {
      nextErrors.howFoundOther = "Please specify how you found the prospect.";
    }

    if (!data.interestLevel) nextErrors.interestLevel = "Please select an option.";
    if (data.interestAreas.length === 0) {
      nextErrors.interestAreas = "Select at least one interest area.";
    }
    if (
      data.interestAreas.includes("Others (please specify)") &&
      !data.interestOther.trim()
    ) {
      nextErrors.interestOther = "Please specify the other interest area.";
    }

    if (data.contributionWays.length === 0) {
      nextErrors.contributionWays = "Select at least one contribution way.";
    }
    if (
      data.contributionWays.includes("Other (please specify)") &&
      !data.contributionOther.trim()
    ) {
      nextErrors.contributionOther = "Please specify the other contribution.";
    }

    if (!data.informedStatus) {
      nextErrors.informedStatus = "Please select an option.";
    }
    if (!data.alignmentLevel) {
      nextErrors.alignmentLevel = "Please select an option.";
    }
    if (!data.recommendation) {
      nextErrors.recommendation = "Please select an option.";
    }

    return nextErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleCountryChange = async (e) => {
    const country = e.target.value;

    setFormData((prev) => ({ ...prev, country, city: "" }));
    setErrors((prev) => ({ ...prev, country: "", city: "" }));

    if (!country) {
      setCities([]);
      return;
    }

    try {
      const response = await fetch(
        "https://countriesnow.space/api/v0.1/countries/cities",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ country }),
        }
      );

      const data = await response.json().catch(() => ({}));
      setCities(Array.isArray(data.data) ? data.data : []);
    } catch (error) {
      setCities([]);
    }
  };

  const handleCityChange = (e) => {
    setFormData((prev) => ({ ...prev, city: e.target.value }));
    setErrors((prev) => ({ ...prev, city: "" }));
  };

  const handleCheckboxChange = (e, key) => {
    const { value, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [key]: checked
        ? [...prev[key], value]
        : prev[key].filter((entry) => entry !== value),
    }));

    setErrors((prev) => ({
      ...prev,
      [key]: "",
      ...(key === "interestAreas" ? { interestOther: "" } : {}),
      ...(key === "contributionWays" ? { contributionOther: "" } : {}),
    }));
  };

  const handleSubmit = async () => {
    const normalizedData = {
      ...formData,
      phoneNumber: normalizePhone(formData.phoneNumber),
      mentorPhone: normalizePhone(formData.mentorPhone),
      email: formData.email.trim(),
      mentorEmail: formData.mentorEmail.trim(),
      fullName: formData.fullName.trim(),
      mentorName: formData.mentorName.trim(),
      profession: formData.profession.trim(),
      companyName: formData.companyName.trim(),
      industry: formData.industry.trim(),
      socialProfile: formData.socialProfile.trim(),
      howFoundOther: formData.howFoundOther.trim(),
      interestOther: formData.interestOther.trim(),
      contributionOther: formData.contributionOther.trim(),
      additionalComments: formData.additionalComments.trim(),
    };

    const validationErrors = validateForm(normalizedData);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      Swal.fire("Validation", "Please complete the required fields.", "warning");
      return;
    }

    setErrors({});
    setSubmitting(true);

    try {
      const res = await fetch(`/api/prospects/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(normalizedData),
      });
      const data = await res.json().catch(() => ({}));

      if (res.status === 409) {
        router.replace(`/user/prospects/${id}/completed`);
        return;
      }

      if (res.status === 400 && data.errors) {
        setErrors(data.errors);
        Swal.fire(
          "Validation",
          data.message || "Please correct the highlighted fields.",
          "warning"
        );
        return;
      }

      if (!res.ok) {
        throw new Error(data.message || "Something went wrong.");
      }

      router.replace(`/user/prospects/${id}/completed?submitted=1`);
    } catch (error) {
      Swal.fire("Error", "Something went wrong.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const nextTab = () =>
    activeTab < tabs.length - 1 && setActiveTab(activeTab + 1);

  const prevTab = () => activeTab > 0 && setActiveTab(activeTab - 1);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 py-10">
        <div className="mx-auto max-w-4xl rounded-2xl bg-white p-8 shadow-lg">
          <p className="text-center text-gray-600">Loading assessment form...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-10">
      <div className="mx-auto max-w-4xl max-h-[85vh] overflow-y-auto rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-10 flex justify-between gap-2">
          {tabs.map((tab, index) => (
            <div
              key={tab}
              onClick={() => setActiveTab(index)}
              className={`cursor-pointer rounded-full px-4 py-2 text-sm ${
                activeTab === index
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              {tab}
            </div>
          ))}
        </div>

        <form className="min-h-[500px] space-y-6">
          {activeTab === 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700">
                MentOrbiter Details
              </h3>

              <div>
                <FieldLabel label="MentOrbiter Name" required />
                <input
                  className={getFieldClass(errors.mentorName)}
                  name="mentorName"
                  value={formData.mentorName}
                  onChange={handleChange}
                  placeholder="Your Name"
                />
                <FieldError message={errors.mentorName} />
              </div>

              <div>
                <FieldLabel label="MentOrbiter Contact Number" required />
                <input
                  className={getFieldClass(errors.mentorPhone)}
                  name="mentorPhone"
                  value={formData.mentorPhone}
                  onChange={handleChange}
                  placeholder="Contact Number"
                />
                <FieldError message={errors.mentorPhone} />
              </div>

              <div>
                <FieldLabel label="MentOrbiter Email Address" required />
                <input
                  className={getFieldClass(errors.mentorEmail)}
                  name="mentorEmail"
                  value={formData.mentorEmail}
                  onChange={handleChange}
                  placeholder="Email Address"
                />
                <FieldError message={errors.mentorEmail} />
              </div>

              <div>
                <FieldLabel label="Assessment Date" required />
                <input
                  type="date"
                  className={getFieldClass(errors.assessmentDate)}
                  name="assessmentDate"
                  value={formData.assessmentDate}
                  onChange={handleChange}
                  max={today}
                />
                <FieldError message={errors.assessmentDate} />
              </div>
            </div>
          )}

          {activeTab === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700">
                Prospect Details
              </h3>

              <div>
                <FieldLabel label="Prospect Name" required />
                <input
                  className={getFieldClass(errors.fullName)}
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Prospect Name"
                />
                <FieldError message={errors.fullName} />
              </div>

              <div>
                <FieldLabel label="Contact Number" required />
                <input
                  className={getFieldClass(errors.phoneNumber)}
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder="Contact Number"
                />
                <FieldError message={errors.phoneNumber} />
              </div>

              <div>
                <FieldLabel label="Email Address" required />
                <input
                  className={getFieldClass(errors.email)}
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Email Address"
                />
                <FieldError message={errors.email} />
              </div>

              <div>
                <FieldLabel label="Country" required />
                <select
                  className={getFieldClass(errors.country)}
                  value={formData.country}
                  onChange={handleCountryChange}
                >
                  <option value="">Select Country</option>
                  {countries.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
                <FieldError message={errors.country} />
              </div>

              <div>
                <FieldLabel label="City" required />
                <select
                  className={getFieldClass(errors.city)}
                  value={formData.city}
                  onChange={handleCityChange}
                >
                  <option value="">Select City</option>
                  {cities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
                <FieldError message={errors.city} />
              </div>

              <div>
                <FieldLabel label="Occupation" required />
                <input
                  className={getFieldClass(errors.profession)}
                  name="profession"
                  value={formData.profession}
                  onChange={handleChange}
                  placeholder="Occupation"
                />
                <FieldError message={errors.profession} />
              </div>

              <div>
                <FieldLabel label="Company" />
                <input
                  className={getFieldClass()}
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  placeholder="Company"
                />
              </div>

              <div>
                <FieldLabel label="Industry" />
                <input
                  className={getFieldClass()}
                  name="industry"
                  value={formData.industry}
                  onChange={handleChange}
                  placeholder="Industry"
                />
              </div>

              <div>
                <FieldLabel label="Social Profile" />
                <input
                  className={getFieldClass()}
                  name="socialProfile"
                  value={formData.socialProfile}
                  onChange={handleChange}
                  placeholder="Social Profile"
                />
              </div>
            </div>
          )}

          {activeTab === 2 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-700">
                Alignment with UJustBe
              </h3>

              <div>
                <FieldLabel label="How did you find the prospect?" required />
                <select
                  name="howFound"
                  value={formData.howFound}
                  onChange={handleChange}
                  className={`${getFieldClass(errors.howFound)} mt-2`}
                >
                  <option value="">Select</option>
                  <option value="Referral">Referral</option>
                  <option value="Networking Event">Networking Event</option>
                  <option value="Social Media">Social Media</option>
                  <option value="Other">Other</option>
                </select>
                <FieldError message={errors.howFound} />
              </div>

              {formData.howFound === "Other" && (
                <div>
                  <FieldLabel label="How did you find the prospect? (Other)" required />
                  <input
                    className={getFieldClass(errors.howFoundOther)}
                    name="howFoundOther"
                    value={formData.howFoundOther}
                    onChange={handleChange}
                    placeholder="Please specify"
                  />
                  <FieldError message={errors.howFoundOther} />
                </div>
              )}

              <div>
                <FieldLabel label="Interest Level" required />
                <select
                  name="interestLevel"
                  value={formData.interestLevel}
                  onChange={handleChange}
                  className={`${getFieldClass(errors.interestLevel)} mt-2`}
                >
                  <option value="">Select</option>
                  <option value="Actively involved">Actively involved</option>
                  <option value="Some interest">Some interest</option>
                  <option value="Unfamiliar but open">Unfamiliar but open</option>
                </select>
                <FieldError message={errors.interestLevel} />
              </div>

              <div>
                <FieldLabel label="Interest Areas" required />
                <div className="mt-2 space-y-2">
                  {interestOptions.map((option) => (
                    <label key={option} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        value={option}
                        checked={formData.interestAreas.includes(option)}
                        onChange={(e) => handleCheckboxChange(e, "interestAreas")}
                      />
                      {option}
                    </label>
                  ))}
                </div>
                <FieldError message={errors.interestAreas} />
              </div>

              {formData.interestAreas.includes("Others (please specify)") && (
                <div>
                  <FieldLabel label="Other Interest Area" required />
                  <input
                    className={getFieldClass(errors.interestOther)}
                    name="interestOther"
                    value={formData.interestOther}
                    onChange={handleChange}
                    placeholder="Enter interest"
                  />
                  <FieldError message={errors.interestOther} />
                </div>
              )}

              <div>
                <FieldLabel label="Contribution Ways" required />
                <div className="mt-2 space-y-2">
                  {contributionOptions.map((option) => (
                    <label key={option} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        value={option}
                        checked={formData.contributionWays.includes(option)}
                        onChange={(e) =>
                          handleCheckboxChange(e, "contributionWays")
                        }
                      />
                      {option}
                    </label>
                  ))}
                </div>
                <FieldError message={errors.contributionWays} />
              </div>

              {formData.contributionWays.includes("Other (please specify)") && (
                <div>
                  <FieldLabel label="Other Contribution" required />
                  <input
                    className={getFieldClass(errors.contributionOther)}
                    name="contributionOther"
                    value={formData.contributionOther}
                    onChange={handleChange}
                    placeholder="Enter contribution"
                  />
                  <FieldError message={errors.contributionOther} />
                </div>
              )}

              <div>
                <FieldLabel label="Informed Status" required />
                <select
                  name="informedStatus"
                  value={formData.informedStatus}
                  onChange={handleChange}
                  className={`${getFieldClass(errors.informedStatus)} mt-2`}
                >
                  <option value="">Select</option>
                  <option value="Fully aware">Fully aware</option>
                  <option value="Partially aware">Partially aware</option>
                  <option value="Not informed">Not informed</option>
                </select>
                <FieldError message={errors.informedStatus} />
              </div>
            </div>
          )}

          {activeTab === 3 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-700">
                Assessment & Recommendation
              </h3>

              <div>
                <FieldLabel label="Alignment Level" required />
                <select
                  name="alignmentLevel"
                  value={formData.alignmentLevel}
                  onChange={handleChange}
                  className={`${getFieldClass(errors.alignmentLevel)} mt-2`}
                >
                  <option value="">Select</option>
                  <option value="Not aligned">Not aligned</option>
                  <option value="Slightly aligned">Slightly aligned</option>
                  <option value="Neutral">Neutral</option>
                  <option value="Mostly aligned">Mostly aligned</option>
                  <option value="Fully aligned">Fully aligned</option>
                </select>
                <FieldError message={errors.alignmentLevel} />
              </div>

              <div>
                <FieldLabel label="Recommendation" required />
                <select
                  name="recommendation"
                  value={formData.recommendation}
                  onChange={handleChange}
                  className={`${getFieldClass(errors.recommendation)} mt-2`}
                >
                  <option value="">Select</option>
                  <option value="Strongly recommended">
                    Strongly recommended
                  </option>
                  <option value="Needs alignment">Needs alignment</option>
                  <option value="Not recommended">Not recommended</option>
                </select>
                <FieldError message={errors.recommendation} />
              </div>

              <div>
                <FieldLabel label="Additional Comments" />
                <textarea
                  name="additionalComments"
                  value={formData.additionalComments}
                  onChange={handleChange}
                  rows={4}
                  className={`${getFieldClass()} mt-2`}
                />
              </div>
            </div>
          )}

          <div className="flex justify-between pt-6">
            <button
              type="button"
              onClick={prevTab}
              disabled={activeTab === 0 || submitting}
              className="rounded-lg bg-gray-200 px-6 py-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Back
            </button>

            {activeTab === tabs.length - 1 ? (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className={`rounded-lg px-6 py-2 text-white ${
                  submitting
                    ? "cursor-not-allowed bg-gray-400"
                    : "bg-indigo-600"
                }`}
              >
                {submitting ? "Submitting..." : "Submit"}
              </button>
            ) : (
              <button
                type="button"
                onClick={nextTab}
                disabled={submitting}
                className="rounded-lg bg-indigo-600 px-6 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                Next
              </button>
            )}
          </div>
        </form>
      </div>
    </main>
  );
}
