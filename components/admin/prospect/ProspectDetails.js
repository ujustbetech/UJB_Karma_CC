"use client";

import React, { useEffect, useState } from "react";

import Swal from "sweetalert2";

import Text from "@/components/ui/Text";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import DateInput from "@/components/ui/DateInput";
import FormField from "@/components/ui/FormField";
import {
  formatDate as formatDisplayDate,
  formatDateTime,
  normalizeDateForStorage,
} from "@/lib/utils/dateFormat";

const withRequirement = (label, required = false) => (
  <>
    {label}
    {required ? <span className="text-red-600"> *</span> : null}
  </>
);

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

const ProspectFormDetails = ({ id }) => {
  const [forms, setForms] = useState([]);
  const [originalForms, setOriginalForms] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    const fetchForms = async () => {
      try {
        const res = await fetch(
          `/api/admin/prospects?id=${id}&section=prospectform`,
          {
            credentials: "include",
          }
        );
        const responseData = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(responseData.message || "Failed to fetch prospect forms");
        }

        const prospectData = responseData.prospect || {};
        const fetchedForms = Array.isArray(responseData.forms)
          ? responseData.forms
          : [];
        setAuditLogs(Array.isArray(responseData.auditLogs) ? responseData.auditLogs : []);

        const defaultMentor = {
          mentorName: prospectData.orbiterName || "",
          mentorPhone: prospectData.orbiterContact || "",
          mentorEmail: prospectData.orbiterEmail || "",
        };

        const defaultProspect = {
          fullName: prospectData.prospectName || "",
          email: prospectData.email || "",
          phoneNumber: prospectData.prospectPhone || "",
        };

        if (fetchedForms.length === 0) {
          const defaultForm = [
            {
              id: null,
              ...defaultMentor,
              ...defaultProspect,
              assessmentDate: "",
              country: "",
              city: "",
              profession: prospectData.occupation || "",
              companyName: "",
              industry: "",
              socialProfile: "",
              howFound: "",
              howFoundOther: "",
              interestLevel: "",
              interestAreas: [],
              interestOther: "",
              contributionWays: [],
              contributionOther: "",
              informedStatus: "",
              alignmentLevel: "",
              recommendation: "",
              additionalComments: "",
            },
          ];

          setForms(defaultForm);
          setOriginalForms(defaultForm);
          setEditMode(true);
        } else {
          setForms(fetchedForms);
          setOriginalForms(fetchedForms);
          setEditMode(false);
        }
      } catch (error) {
        Swal.fire("Error", "Unable to load assessment form", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchForms();
  }, [id]);

  const handleChange = (index, field, value) => {
    const updated = [...forms];
    updated[index][field] = value;
    setForms(updated);
  };

  const handleCheckboxChange = (index, field, value, checked) => {
    const updated = [...forms];
    const currentValues = Array.isArray(updated[index][field])
      ? updated[index][field]
      : [];

    updated[index][field] = checked
      ? [...currentValues, value]
      : currentValues.filter((item) => item !== value);

    setForms(updated);
  };

  const handleCancel = () => {
    setForms(originalForms);
    setEditMode(false);
  };

  const handleSave = async () => {
    try {
      const sanitizedForms = forms.map((form) => {
        const nextForm = { ...form };

        if (!nextForm.id) {
          delete nextForm.id;
        }

        return nextForm;
      });

      const res = await fetch(
        `/api/admin/prospects?id=${id}&section=prospectform`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ forms: sanitizedForms }),
        }
      );
      const responseData = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(responseData.message || "Failed to save assessment form");
      }

      Swal.fire("Success", "Saved Successfully", "success");

      setOriginalForms(forms.map((form) => ({ ...form })));
      setAuditLogs(Array.isArray(responseData.auditLogs) ? responseData.auditLogs : auditLogs);
      setEditMode(false);
    } catch (err) {
      Swal.fire("Error", "Failed to save", "error");
    }
  };

  const formatFormDate = (value) => {
    return normalizeDateForStorage(value);
  };

  if (loading) return <Text>Loading...</Text>;

  return (
    <>
      <Text variant="h1">Prospects Assessment Form</Text>

      {forms.map((form, index) => (
        <Card key={form.id || index} className="mb-6">
          
          {/* BASIC DETAILS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
              { label: "Assessment Date", key: "assessmentDate", frozen: true, required: true },
              { label: "Prospect Name", key: "fullName", frozen: true, required: true },
              { label: "Phone", key: "phoneNumber", frozen: true, required: true },
              { label: "Email", key: "email", frozen: true, required: true },
              { label: "Country", key: "country", required: true },
              { label: "City", key: "city", required: true },
              { label: "Profession", key: "profession", required: true },
              { label: "Company", key: "companyName" },
              { label: "Industry", key: "industry" },
              { label: "Social Profile", key: "socialProfile" },
            ].map(({ label, key, frozen, required }) => (
              <FormField key={key} label={withRequirement(label, required)}>
                {key === "assessmentDate" ? (
                  <DateInput
                    type="date"
                    value={formatFormDate(form[key])}
                    disabled={frozen || !editMode}
                    onChange={(e) =>
                      handleChange(index, key, e.target.value)
                    }
                  />
                ) : (
                  <Input
                    value={form[key] || ""}
                    disabled={frozen || !editMode}
                    onChange={(e) =>
                      handleChange(index, key, e.target.value)
                    }
                  />
                )}
              </FormField>
            ))}
          </div>

          {/* SELECTS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6">

            <FormField label={withRequirement("How Found", true)}>
              <Select
                value={form.howFound || ""}
                disabled={!editMode}
                onChange={(v) => handleChange(index, "howFound", v)}
                options={[
                  { label: "Referral", value: "Referral" },
                  { label: "Networking Event", value: "Networking Event" },
                  { label: "Social Media", value: "Social Media" },
                  { label: "Other", value: "Other" },
                ]}
              />
            </FormField>

            <FormField label={withRequirement("Interest Level", true)}>
              <Select
                value={form.interestLevel || ""}
                disabled={!editMode}
                onChange={(v) => handleChange(index, "interestLevel", v)}
                options={[
                  { label: "Actively involved", value: "Actively involved" },
                  { label: "Some interest", value: "Some interest" },
                  { label: "Unfamiliar but open", value: "Unfamiliar but open" },
                ]}
              />
            </FormField>

            <FormField label={withRequirement("Informed Status", true)}>
              <Select
                value={form.informedStatus || ""}
                disabled={!editMode}
                onChange={(v) => handleChange(index, "informedStatus", v)}
                options={[
                  { label: "Fully aware", value: "Fully aware" },
                  { label: "Partially aware", value: "Partially aware" },
                  { label: "Not informed", value: "Not informed" },
                ]}
              />
            </FormField>

            <FormField label={withRequirement("Alignment Level", true)}>
              <Select
                value={form.alignmentLevel || ""}
                disabled={!editMode}
                onChange={(v) => handleChange(index, "alignmentLevel", v)}
                options={[
                  { label: "Not aligned", value: "Not aligned" },
                  { label: "Slightly aligned", value: "Slightly aligned" },
                  { label: "Neutral", value: "Neutral" },
                  { label: "Mostly aligned", value: "Mostly aligned" },
                  { label: "Fully aligned", value: "Fully aligned" },
                ]}
              />
            </FormField>

            <FormField label={withRequirement("Recommendation", true)}>
              <Select
                value={form.recommendation || ""}
                disabled={!editMode}
                onChange={(v) => handleChange(index, "recommendation", v)}
                options={[
                  { label: "Strongly recommended", value: "Strongly recommended" },
                  { label: "Needs alignment", value: "Needs alignment" },
                  { label: "Not recommended", value: "Not recommended" },
                ]}
              />
            </FormField>

          </div>

          {/* ARRAYS */}
          <FormField label={withRequirement("Interest Areas", true)} className="pt-6">
            {editMode ? (
              <div className="space-y-2 rounded-lg border border-slate-200 p-3">
                {interestOptions.map((option) => (
                  <label key={option} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      value={option}
                      checked={(form.interestAreas || []).includes(option)}
                      onChange={(e) =>
                        handleCheckboxChange(
                          index,
                          "interestAreas",
                          option,
                          e.target.checked
                        )
                      }
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            ) : (
              <Input value={(form.interestAreas || []).join(", ")} disabled />
            )}
          </FormField>

          <FormField label={withRequirement("Contribution Ways", true)}>
            {editMode ? (
              <div className="space-y-2 rounded-lg border border-slate-200 p-3">
                {contributionOptions.map((option) => (
                  <label key={option} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      value={option}
                      checked={(form.contributionWays || []).includes(option)}
                      onChange={(e) =>
                        handleCheckboxChange(
                          index,
                          "contributionWays",
                          option,
                          e.target.checked
                        )
                      }
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            ) : (
              <Input value={(form.contributionWays || []).join(", ")} disabled />
            )}
          </FormField>

          {/* OTHER FIELDS */}
          {form.howFoundOther && (
            <FormField label={withRequirement("How Found Other", true)}>
              <Input
                value={form.howFoundOther}
                disabled={!editMode}
                onChange={(e) =>
                  handleChange(index, "howFoundOther", e.target.value)
                }
              />
            </FormField>
          )}

          {(form.interestOther || editMode) &&
            (form.interestAreas || []).includes("Others (please specify)") && (
            <FormField label={withRequirement("Interest Other", true)}>
              <Input
                value={form.interestOther || ""}
                disabled={!editMode}
                onChange={(e) =>
                  handleChange(index, "interestOther", e.target.value)
                }
              />
            </FormField>
          )}

          {(form.contributionOther || editMode) &&
            (form.contributionWays || []).includes("Other (please specify)") && (
            <FormField label={withRequirement("Contribution Other", true)}>
              <Input
                value={form.contributionOther || ""}
                disabled={!editMode}
                onChange={(e) =>
                  handleChange(index, "contributionOther", e.target.value)
                }
              />
            </FormField>
          )}

          {/* COMMENTS */}
          <FormField label={withRequirement("Additional Comments")}>
            <Input
              value={form.additionalComments || ""}
              disabled={!editMode}
              onChange={(e) =>
                handleChange(index, "additionalComments", e.target.value)
              }
            />
          </FormField>
        </Card>
      ))}

      <div className="flex justify-end gap-2">
        {!editMode ? (
          <Button onClick={() => setEditMode(true)}>Edit</Button>
        ) : (
          <>
            <Button variant="secondary" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </>
        )}
      </div>

      <Card className="mt-6">
        <Text variant="h2">Audit Log</Text>
        <div className="mt-4 space-y-3">
          {auditLogs.length === 0 ? (
            <Text variant="muted">No audit activity recorded yet.</Text>
          ) : (
            [...auditLogs].reverse().map((log) => (
              <div
                key={log.id}
                className="rounded-lg border border-slate-200 bg-slate-50 p-4"
              >
                <Text as="div" variant="h3">
                  {log.formName} - {log.actionType}
                </Text>
                <Text as="div" variant="muted" className="mt-1">
                  {log.performedBy} ({log.userRole}) {log.userIdentity ? `- ${log.userIdentity}` : ""}
                </Text>
                <Text as="div" variant="muted">
                  {formatDateTime(log.timestamp, "")}
                </Text>
                {Array.isArray(log.changedFields) && log.changedFields.length > 0 ? (
                  <div className="mt-2 space-y-1">
                    {log.changedFields.map((fieldChange, changeIndex) => (
                      <Text key={`${log.id}-${fieldChange.field}-${changeIndex}`} as="div" variant="muted">
                          {fieldChange.field}: {formatDisplayDate(fieldChange.before, fieldChange.before || "empty") || fieldChange.before || "empty"} {"->"} {formatDisplayDate(fieldChange.after, fieldChange.after || "empty") || fieldChange.after || "empty"}
                      </Text>
                    ))}
                  </div>
                ) : null}
              </div>
            ))
          )}
        </div>
      </Card>
    </>
  );
};

export default ProspectFormDetails;
