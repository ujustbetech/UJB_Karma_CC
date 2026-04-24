"use client";

import { useState, useEffect } from "react";

import Text from "@/components/ui/Text";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import DateInput from "@/components/ui/DateInput";
import Select from "@/components/ui/Select";
import FormField from "@/components/ui/FormField";
import {
  PROSPECT_OCCASION_OPTIONS,
  PROSPECT_OCCUPATION_OPTIONS,
} from "@/lib/prospectFormOptions";

import Swal from "sweetalert2";
import emailjs from "@emailjs/browser";
import { sendWhatsAppTemplateRequest } from "@/utils/whatsappClient";

const INDIA_DIAL_CODE = "+91";
const INDIAN_MOBILE_REGEX = /^[6-9]\d{9}$/;
const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const LETTERS_ONLY_REGEX = /^[A-Za-z\s.'-]+$/;
const SOURCE_OPTIONS = [
  { label: "Select a source", value: "" },
  { label: "Social Media", value: "Social Media" },
  { label: "Website", value: "Website" },
  { label: "Orbiter", value: "Orbiter" },
];
const SOURCE_DETAIL_OPTIONS = {
  Orbiter: PROSPECT_OCCASION_OPTIONS,
  Website: [
    { label: "Select an option", value: "" },
    { label: "UJustBe", value: "UJustBe" },
  ],
  "Social Media": [
    { label: "Select an option", value: "" },
    { label: "Instagram", value: "Instagram" },
    { label: "Facebook", value: "Facebook" },
    { label: "YouTube", value: "YouTube" },
  ],
};

function getAdultDobMax() {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 18);

  return (
    date.getFullYear() +
    "-" +
    String(date.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(date.getDate()).padStart(2, "0")
  );
}

function parseLocalDate(value) {
  if (!value) return null;

  const [year, month, day] = String(value).split("-").map(Number);

  if (!year || !month || !day) {
    return null;
  }

  return new Date(year, month - 1, day);
}

function isAdultDob(value) {
  const selectedDate = parseLocalDate(value);
  const maxDobDate = parseLocalDate(getAdultDobMax());

  if (!selectedDate || !maxDobDate) return false;

  return selectedDate <= maxDobDate;
}

export default function Register() {
  const adultDobMax = getAdultDobMax();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [orbiteremail, setOrbiterEmail] = useState("");
  const [prospectName, setProspectName] = useState("");
  const [prospectPhone, setProspectPhone] = useState("");
  const [occupation, setOccupation] = useState("");
  const [hobbies, setHobbies] = useState("");
  const [email, setEmail] = useState("");
  const [date, setDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [source, setSource] = useState("");
  const [type, setType] = useState("");
  const [errors, setErrors] = useState({});

  const [userList, setUserList] = useState([]);
  const [userSearch, setUserSearch] = useState("");
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedOrbiter, setSelectedOrbiter] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch("/api/admin/orbiters", {
          credentials: "include",
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(data.message || "Failed to fetch orbiters");
        }

        setUserList(Array.isArray(data.orbiters) ? data.orbiters : []);
      } catch (error) {
        console.error("Orbiter fetch failed:", error);
        Swal.fire(
          "Error",
          "Unable to load orbiters for this admin page",
          "error"
        );
      }
    };

    fetchUsers();
  }, []);

  const handleSearchUser = (e) => {
    const value = e.target.value.toLowerCase();

    setUserSearch(value);

    const filtered = userList.filter((u) =>
      u.name.toLowerCase().includes(value)
    );

    setFilteredUsers(filtered);
  };

  const handleSelectUser = (user) => {
    setSelectedOrbiter(user);
    setName(user.name);
    setPhone(user.phone);
    setOrbiterEmail(user.email);
    setErrors((prev) => ({ ...prev, selectedOrbiter: "" }));
    setUserSearch("");
    setFilteredUsers([]);
  };

  const sendAssessmentEmail = async (
    orbiterName,
    orbiterEmail,
    prospectNameValue,
    formLink
  ) => {
    const body = `
Dear ${orbiterName},

Please fill the Prospect Assessment Form for ${prospectNameValue}.

Assessment Form:
${formLink}

Regards,
UJustBe Team
`;

    const templateParams = {
      prospect_name: prospectNameValue,
      to_email: orbiterEmail,
      body,
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
      console.error("Email error:", error);
    }
  };

  const sendAssesmentMessage = async (
    orbiterName,
    prospectNameValue,
    phoneValue,
    formLink
  ) => {
    try {
      await sendWhatsAppTemplateRequest({
        phone: phoneValue,
        templateName: "mentorbiter_assesment_form",
        parameters: [orbiterName, prospectNameValue, formLink],
      });
    } catch (error) {
      console.error("WhatsApp error:", error);
    }
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!selectedOrbiter) {
      nextErrors.selectedOrbiter = "Please select a MentOrbiter";
    }

    if (!prospectName.trim()) {
      nextErrors.prospectName = "Prospect name is required";
    } else if (!LETTERS_ONLY_REGEX.test(prospectName.trim())) {
      nextErrors.prospectName = "Prospect name cannot contain numbers";
    }

    if (!prospectPhone.trim()) {
      nextErrors.prospectPhone = "Phone number is required";
    } else if (!INDIAN_MOBILE_REGEX.test(prospectPhone)) {
      nextErrors.prospectPhone = "Enter a valid 10-digit Indian mobile number";
    }

    if (!email.trim()) {
      nextErrors.email = "Email is required";
    } else if (!EMAIL_REGEX.test(email.trim())) {
      nextErrors.email = "Enter a valid email address";
    }

    if (!date) {
      nextErrors.date = "DOB is required";
    } else if (!isAdultDob(date)) {
      nextErrors.date = "Prospect must be at least 18 years old";
    }

    if (!occupation) {
      nextErrors.occupation = "Occupation is required";
    }

    if (hobbies.trim() && !LETTERS_ONLY_REGEX.test(hobbies.trim())) {
      nextErrors.hobbies = "Hobbies cannot contain numbers";
    }

    if (!source) {
      nextErrors.source = "Source is required";
    }

    if (!type) {
      nextErrors.type = "Source detail is required";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (submitting) return;

    if (!validateForm()) {
      Swal.fire("Error", "Please fix the form errors", "error");
      return;
    }

    setSubmitting(true);

    try {
      const trimmedName = prospectName.trim();
      const trimmedEmail = email.trim();
      const trimmedHobbies = hobbies.trim();
      const formattedProspectPhone = `${INDIA_DIAL_CODE}${prospectPhone}`;

      const data = {
        userType: "prospect",
        prospectName: trimmedName,
        prospectPhone: formattedProspectPhone,
        occupation,
        hobbies: trimmedHobbies,
        email: trimmedEmail,
        dob: date,
        orbiterName: name,
        orbiterContact: phone,
        orbiterEmail: orbiteremail,
        source,
        type,
      };

      const res = await fetch("/api/admin/prospects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
      });
      const responseData = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(responseData.message || "Failed to create prospect");
      }

      const docId = responseData.id;

      const baseUrl = window.location.origin;
      const formLink = `${baseUrl}/user/prospects/${docId}`;

      await sendAssessmentEmail(name, orbiteremail, trimmedName, formLink);
      await sendAssesmentMessage(name, trimmedName, phone, formLink);

      Swal.fire("Success", "Prospect Registered Successfully", "success");

      setProspectName("");
      setProspectPhone("");
      setEmail("");
      setOccupation("");
      setHobbies("");
      setSource("");
      setType("");
      setDate("");
      setErrors({});
      setName("");
      setPhone("");
      setOrbiterEmail("");
      setSelectedOrbiter(null);
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Something went wrong", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDobChange = (e) => {
    const nextDate = e.target.value;

    if (!nextDate) {
      setErrors((prev) => ({ ...prev, date: "" }));
      setDate("");
      return;
    }

    if (!isAdultDob(nextDate)) {
      setErrors((prev) => ({
        ...prev,
        date: "Prospect must be at least 18 years old",
      }));
      setDate("");
      return;
    }

    setErrors((prev) => ({ ...prev, date: "" }));
    setDate(nextDate);
  };

  return (
    <>
    

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Text variant="h3">MentOrbiter</Text>

          <FormField
            label="Search MentOrbiter"
            required
            error={errors.selectedOrbiter}
          >
            <div className="relative">
              <Input
                placeholder="Search MentOrbiter"
                value={userSearch}
                onChange={(e) => {
                  setErrors((prev) => ({ ...prev, selectedOrbiter: "" }));
                  handleSearchUser(e);
                }}
              />

              {filteredUsers.length > 0 && (
                <div className="absolute z-10 bg-white border rounded w-full max-h-48 overflow-auto">
                  {filteredUsers.map((u) => (
                    <div
                      key={u.ujbCode}
                      className="px-3 py-2 hover:bg-slate-100 cursor-pointer"
                      onClick={() => handleSelectUser(u)}
                    >
                      {u.name} - {u.phone}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </FormField>

          {selectedOrbiter && (
            <div className="grid md:grid-cols-3 gap-4">
              <FormField label="MentOrbiter Name">
                <Input value={name} disabled />
              </FormField>

              <FormField label="MentOrbiter Phone">
                <Input value={phone} disabled />
              </FormField>

              <FormField label="MentOrbiter Email">
                <Input value={orbiteremail} disabled />
              </FormField>
            </div>
          )}

          <Text variant="h3">Prospect Details</Text>

          <div className="grid md:grid-cols-2 gap-4">
            <FormField
              label="Prospect Name"
              required
              error={errors.prospectName}
            >
                <Input
                  value={prospectName}
                  onChange={(e) => {
                  const nextValue = e.target.value.replace(/\d/g, "");
                  setErrors((prev) => ({ ...prev, prospectName: "" }));
                  setProspectName(nextValue);
                }}
              />
            </FormField>

            <FormField
              label="Prospect Phone"
              required
              error={errors.prospectPhone}
            >
              <div className="flex items-center rounded-md border border-slate-300 bg-white overflow-hidden">
                <span className="px-3 py-2 text-slate-500 border-r border-slate-300">
                  {INDIA_DIAL_CODE}
                </span>
                <Input
                  value={prospectPhone}
                  inputMode="numeric"
                  maxLength={10}
                  className="border-0 rounded-none"
                  placeholder="10-digit mobile number"
                  onChange={(e) => {
                    const digitsOnly = e.target.value
                      .replace(/\D/g, "")
                      .slice(0, 10);

                    setErrors((prev) => ({ ...prev, prospectPhone: "" }));
                    setProspectPhone(digitsOnly);
                  }}
                />
              </div>
            </FormField>

            <FormField label="Email" required error={errors.email}>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => {
                  setErrors((prev) => ({ ...prev, email: "" }));
                  setEmail(e.target.value.trimStart());
                }}
              />
            </FormField>

            <FormField label="DOB" required error={errors.date}>
                <DateInput
                  type="date"
                  value={date}
                  max={adultDobMax}
                  onChange={handleDobChange}
                />
            </FormField>

            <FormField label="Occupation" required error={errors.occupation}>
              <Select
                value={occupation}
                onChange={(v) => {
                  setErrors((prev) => ({ ...prev, occupation: "" }));
                  setOccupation(v);
                }}
                options={PROSPECT_OCCUPATION_OPTIONS}
              />
            </FormField>

            <FormField label="Hobbies" error={errors.hobbies}>
                <Input
                  value={hobbies}
                  onChange={(e) => {
                  const nextValue = e.target.value.replace(/\d/g, "");
                  setErrors((prev) => ({ ...prev, hobbies: "" }));
                  setHobbies(nextValue);
                }}
              />
            </FormField>
          </div>

          <FormField label="Source" required error={errors.source}>
            <Select
              value={source}
              onChange={(v) => {
                setErrors((prev) => ({ ...prev, source: "", type: "" }));
                setSource(v);
                setType("");
              }}
              options={SOURCE_OPTIONS}
            />
          </FormField>

          <FormField
            label={
              source === "Orbiter"
                ? "Orbiter Source"
                : source === "Website"
                ? "Website Source"
                : source === "Social Media"
                ? "Social Media Source"
                : "Source Detail"
            }
            required
            error={errors.type}
          >
            <Select
              value={type}
              onChange={(v) => {
                setErrors((prev) => ({ ...prev, type: "" }));
                setType(v);
              }}
              options={
                SOURCE_DETAIL_OPTIONS[source] || [
                  { label: "Select a source first", value: "" },
                ]
              }
            />
          </FormField>

          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              disabled={submitting}
              className={submitting ? "opacity-50 cursor-not-allowed" : ""}
            >
              {submitting ? "Registering..." : "Register Prospect"}
            </Button>
          </div>
        </form>
      </Card>
    </>
  );
}
