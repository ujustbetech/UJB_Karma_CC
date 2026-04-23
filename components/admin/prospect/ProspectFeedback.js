"use client";

import React, { useEffect, useState } from "react";

import Text from "@/components/ui/Text";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import FormField from "@/components/ui/FormField";

const interestOptions = [
  "Space for Personal Growth & Contribution",
  "Freedom to Express and Connect",
  "Business Promotion & Visibility",
  "Earning Through Referral",
  "Networking & Events",
];

const communicationOptions = ["Whatsapp", "Email", "Phone call"];

const understandingOptions = [
  { label: "Excellent", value: "Excellent" },
  { label: "Good", value: "Good" },
  { label: "Fair", value: "Fair" },
  { label: "Poor", value: "Poor" },
];

const selfGrowthOptions = [
  { label: "Yes, very clearly", value: "Yes, very clearly" },
  { label: "Somewhat", value: "Somewhat" },
  { label: "No, still unclear", value: "No, still unclear" },
];

const joinInterestOptions = [
  { label: "Yes, I am interested", value: "Yes, I am interested" },
  { label: "I would like to think about it", value: "I would like to think about it" },
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

const withRequirement = (label, required = false) => (
  <>
    {label}
    {required ? <span className="text-red-600"> *</span> : null}
  </>
);

const ProspectFeedback = ({ id }) => {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

  const fetchForms = async () => {
    try {
      setFetchError("");
      const res = await fetch(
        `/api/admin/prospects?id=${id}&section=prospectfeedbackform`,
        { credentials: "include" }
      );
      const responseData = await res.json().catch(() => ({}));

      if (!res.ok) {
        setForms([]);
        setShowForm(false);
        setFetchError(
          responseData.message ||
            (res.status === 401
              ? "Your admin session has expired. Please sign in again."
              : "Failed to fetch feedback form.")
        );
        return;
      }

      const data = Array.isArray(responseData.forms) ? responseData.forms : [];
      const prospectData = responseData.prospect || {};

      setForms(data);

      const autofill = {
        fullName: prospectData.prospectName || "",
        phoneNumber: prospectData.prospectPhone || "",
        email: prospectData.email || "",
        mentorName: prospectData.orbiterName || "",
      };

      if (data.length === 0) {
        setFormData((prev) => ({
          ...prev,
          ...autofill,
        }));
        setShowForm(true);
      } else {
        setShowForm(false);
      }
    } catch (error) {
      console.error("Error fetching feedback form:", error);
      setForms([]);
      setShowForm(false);
      setFetchError("Failed to fetch feedback form.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchForms();
    }
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCheckboxChange = (e, key) => {
    const { value, checked } = e.target;
    const currentValues = Array.isArray(formData[key]) ? formData[key] : [];

    setFormData((prev) => ({
      ...prev,
      [key]: checked
        ? [...currentValues, value]
        : currentValues.filter((entry) => entry !== value),
    }));
  };

  const saveForms = async (formsPayload) => {
    const res = await fetch(
      `/api/admin/prospects?id=${id}&section=prospectfeedbackform`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ forms: formsPayload }),
      }
    );
    const responseData = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(responseData.message || "Failed to save feedback");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await saveForms([{ ...formData }]);
      alert("Form submitted successfully");
      await fetchForms();
      setShowForm(false);
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    try {
      await saveForms([{ id: editingId, ...formData }]);
      alert("Feedback updated successfully");
      setEditMode(false);
      setEditingId(null);
      await fetchForms();
    } catch (error) {
      console.error("Error updating form:", error);
    }
  };

  const startEdit = (form) => {
    setEditMode(true);
    setEditingId(form.id);
    setFormData({
      ...emptyForm,
      ...form,
      interestAreas: Array.isArray(form.interestAreas) ? form.interestAreas : [],
      communicationOptions: Array.isArray(form.communicationOptions)
        ? form.communicationOptions
        : [],
    });
  };

  if (loading) return <Text>Loading...</Text>;

  if (fetchError) {
    return (
      <>
        <Text variant="h1">Prospect Feedback</Text>
        <Card>
          <Text className="text-red-600">{fetchError}</Text>
        </Card>
      </>
    );
  }

  return (
    <>
      <Text variant="h1">Prospect Feedback</Text>

      {forms.length === 0 && showForm && (
        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField label={withRequirement("Prospect Name", true)}>
                <Input
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  disabled
                />
              </FormField>

              <FormField label={withRequirement("Phone Number", true)}>
                <Input
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  disabled
                />
              </FormField>

              <FormField label={withRequirement("Email", true)}>
                <Input
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled
                />
              </FormField>

              <FormField label={withRequirement("Orbiter Name", true)}>
                <Input
                  name="mentorName"
                  value={formData.mentorName}
                  onChange={handleChange}
                  disabled
                />
              </FormField>
            </div>

            <FormField label={withRequirement("Understanding of UJustBe", true)}>
              <Select
                value={formData.understandingLevel}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, understandingLevel: value }))
                }
                options={understandingOptions}
              />
            </FormField>

            <FormField label={withRequirement("Self Growth Clarity", true)}>
              <Select
                value={formData.selfGrowthUnderstanding}
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    selfGrowthUnderstanding: value,
                  }))
                }
                options={selfGrowthOptions}
              />
            </FormField>

            <FormField label={withRequirement("Interest in Joining", true)}>
              <Select
                value={formData.joinInterest}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, joinInterest: value }))
                }
                options={joinInterestOptions}
              />
            </FormField>

            <FormField label={withRequirement("Interest Areas")}>
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
            </FormField>

            <FormField label={withRequirement("Preferred Communication")}>
              <div className="flex gap-4">
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
            </FormField>

            <FormField label={withRequirement("Comments")}>
              <textarea
                className="w-full rounded-lg border p-3"
                name="additionalComments"
                value={formData.additionalComments}
                onChange={handleChange}
              />
            </FormField>

            <div className="flex justify-end pt-4">
              <Button type="submit">Submit Feedback</Button>
            </div>
          </form>
        </Card>
      )}

      {forms.map((form) => (
        <Card key={form.id} className="mb-6">
          <form onSubmit={editMode ? handleUpdate : undefined}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField label={withRequirement("Prospect Name", true)}>
                <Input
                  value={editMode ? formData.fullName : form.fullName}
                  name="fullName"
                  onChange={handleChange}
                  disabled
                />
              </FormField>

              <FormField label={withRequirement("Phone", true)}>
                <Input
                  value={editMode ? formData.phoneNumber : form.phoneNumber}
                  name="phoneNumber"
                  onChange={handleChange}
                  disabled
                />
              </FormField>

              <FormField label={withRequirement("Email", true)}>
                <Input
                  value={editMode ? formData.email : form.email}
                  name="email"
                  onChange={handleChange}
                  disabled
                />
              </FormField>

              <FormField label={withRequirement("Orbiter Name", true)}>
                <Input
                  value={editMode ? formData.mentorName : form.mentorName}
                  name="mentorName"
                  onChange={handleChange}
                  disabled
                />
              </FormField>

              <FormField label={withRequirement("Understanding", true)}>
                {editMode ? (
                  <Select
                    value={formData.understandingLevel}
                    onChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        understandingLevel: value,
                      }))
                    }
                    options={understandingOptions}
                  />
                ) : (
                  <Input value={form.understandingLevel || ""} disabled />
                )}
              </FormField>

              <FormField label={withRequirement("Self Growth", true)}>
                {editMode ? (
                  <Select
                    value={formData.selfGrowthUnderstanding}
                    onChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        selfGrowthUnderstanding: value,
                      }))
                    }
                    options={selfGrowthOptions}
                  />
                ) : (
                  <Input value={form.selfGrowthUnderstanding || ""} disabled />
                )}
              </FormField>

              <FormField label={withRequirement("Join Interest", true)}>
                {editMode ? (
                  <Select
                    value={formData.joinInterest}
                    onChange={(value) =>
                      setFormData((prev) => ({ ...prev, joinInterest: value }))
                    }
                    options={joinInterestOptions}
                  />
                ) : (
                  <Input value={form.joinInterest || ""} disabled />
                )}
              </FormField>
            </div>

            <FormField label={withRequirement("Interest Areas")}>
              {editMode ? (
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
              ) : (
                <Input value={(form.interestAreas || []).join(", ")} disabled />
              )}
            </FormField>

            <FormField label={withRequirement("Preferred Communication")}>
              {editMode ? (
                <div className="flex gap-4">
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
              ) : (
                <Input
                  value={(form.communicationOptions || []).join(", ")}
                  disabled
                />
              )}
            </FormField>

            <FormField label={withRequirement("Comments")}>
              <textarea
                className="w-full rounded-lg border p-3"
                value={editMode ? formData.additionalComments : form.additionalComments}
                name="additionalComments"
                onChange={handleChange}
                disabled={!editMode}
              />
            </FormField>

            <div className="mt-4 flex gap-3">
              {!editMode && (
                <Button type="button" onClick={() => startEdit(form)}>
                  Edit
                </Button>
              )}

              {editMode && <Button type="submit">Update</Button>}
            </div>
          </form>
        </Card>
      ))}
    </>
  );
};

export default ProspectFeedback;
