"use client";

import { useState, useEffect } from "react";

import Text from "@/components/ui/Text";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import DateInput from "@/components/ui/DateInput";
import Select from "@/components/ui/Select";
import FormField from "@/components/ui/FormField";
import { useToast } from "@/components/ui/ToastProvider";
import {
  PROSPECT_OCCASION_OPTIONS,
  PROSPECT_OCCUPATION_OPTIONS,
} from "@/lib/prospectFormOptions";

const INDIA_DIAL_CODE = "+91";
const INDIAN_MOBILE_REGEX = /^(?:\+91)?[6-9]\d{9}$/;
const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

const getAdultDobMax = () => {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 18);
  return date.toISOString().split("T")[0];
};

const normalizeIndianPhone = (value) => {
  const digits = String(value || "").replace(/\D/g, "");

  if (digits.length === 12 && digits.startsWith("91")) {
    return `+${digits}`;
  }

  if (digits.length === 10) {
    return `${INDIA_DIAL_CODE}${digits}`;
  }

  return String(value || "").trim();
};

export default function EditProspect({ id, data }) {
  const toast = useToast();

  const [userSearch, setUserSearch] = useState("");
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [userList, setUserList] = useState([]);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    orbiterName: data?.orbiterName || "",
    orbiterContact: data?.orbiterContact || "",
    orbiterEmail: data?.orbiterEmail || "",
    type: data?.type || "",
    prospectName: data?.prospectName || "",
    prospectPhone: data?.prospectPhone || "",
    occupation: data?.occupation || "",
    hobbies: data?.hobbies || "",
    email: data?.email || "",
    dob: data?.dob || "",
  });

  useEffect(() => {
    let isMounted = true;

    const fetchUsers = async () => {
      try {
        const res = await fetch("/api/admin/orbiters", {
          credentials: "include",
        });
        const responseData = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(responseData.message || "Failed to fetch orbiters");
        }

        const list = Array.isArray(responseData.orbiters)
          ? responseData.orbiters.map((user) => ({
              id: user.ujbCode,
              name: user.name,
              phone: user.phone,
              email: user.email,
            }))
          : [];

        if (isMounted) {
          setUserList(list);
        }
      } catch (error) {
        console.error(error);
        if (isMounted) {
          toast.error("Unable to load orbiters");
        }
      }
    };

    fetchUsers();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSearchUser = (value) => {
    setUserSearch(value);

    const filtered = userList.filter((user) =>
      user.name?.toLowerCase().includes(value.toLowerCase())
    );

    setFilteredUsers(filtered);
  };

  const handleSelectUser = (user) => {
    setForm((prev) => ({
      ...prev,
      orbiterName: user.name,
      orbiterContact: user.phone,
      orbiterEmail: user.email,
    }));
    setErrors((prev) => ({
      ...prev,
      orbiterName: "",
      orbiterContact: "",
      orbiterEmail: "",
    }));

    setUserSearch("");
    setFilteredUsers([]);
  };

  const handleFieldChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validateForm = () => {
    const nextErrors = {};
    const normalizedProspectPhone = normalizeIndianPhone(form.prospectPhone);
    const normalizedOrbiterPhone = normalizeIndianPhone(form.orbiterContact);
    const dobValue = String(form.dob || "").trim();
    const dobDate = dobValue ? new Date(`${dobValue}T00:00:00`) : null;
    const maxAdultDob = new Date(`${getAdultDobMax()}T23:59:59`);

    if (!String(form.orbiterName || "").trim()) {
      nextErrors.orbiterName = "Orbiter name is required.";
    }

    if (!INDIAN_MOBILE_REGEX.test(normalizedOrbiterPhone)) {
      nextErrors.orbiterContact = `Orbiter phone must be a valid ${INDIA_DIAL_CODE} Indian mobile number.`;
    }

    if (form.orbiterEmail && !EMAIL_REGEX.test(String(form.orbiterEmail).trim())) {
      nextErrors.orbiterEmail = "Enter a valid orbiter email address.";
    }

    if (!String(form.type || "").trim()) {
      nextErrors.type = "Occasion for intimation is required.";
    }

    if (!String(form.prospectName || "").trim()) {
      nextErrors.prospectName = "Prospect name is required.";
    }

    if (!INDIAN_MOBILE_REGEX.test(normalizedProspectPhone)) {
      nextErrors.prospectPhone = `Prospect phone must be a valid ${INDIA_DIAL_CODE} Indian mobile number.`;
    }

    if (!String(form.occupation || "").trim()) {
      nextErrors.occupation = "Occupation is required.";
    }

    if (!EMAIL_REGEX.test(String(form.email || "").trim())) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (!dobValue) {
      nextErrors.dob = "DOB is required.";
    } else if (Number.isNaN(dobDate?.getTime()) || dobDate > maxAdultDob) {
      nextErrors.dob = "Prospect must be at least 18 years old.";
    }

    return {
      nextErrors,
      normalizedProspectPhone,
      normalizedOrbiterPhone,
    };
  };

  const handleSubmit = async () => {
    const { nextErrors, normalizedProspectPhone, normalizedOrbiterPhone } =
      validateForm();

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      toast.error("Please correct the highlighted fields");
      return;
    }

    try {
      const res = await fetch(`/api/admin/prospects?id=${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          userType: data?.userType || "prospect",
          ...form,
          orbiterContact: normalizedOrbiterPhone,
          prospectPhone: normalizedProspectPhone,
          prospectName: String(form.prospectName || "").trim(),
          occupation: String(form.occupation || "").trim(),
          hobbies: String(form.hobbies || "").trim(),
          email: String(form.email || "").trim(),
          orbiterEmail: String(form.orbiterEmail || "").trim(),
          dob: String(form.dob || "").trim(),
        }),
      });
      const responseData = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(responseData.message || "Error updating prospect");
      }

      toast.success("Prospect updated successfully");
    } catch (error) {
      console.error(error);
      toast.error("Error updating prospect");
    }
  };

  return (
    <>
      <Text variant="h1">Edit Prospect</Text>

      <Card>
        <form className="space-y-6">
          <Text variant="h3">Orbiter Details</Text>

          <FormField label="Search Orbiter">
            <div className="relative">
              <Input
                placeholder="Search orbiter"
                value={userSearch}
                onChange={(e) => handleSearchUser(e.target.value)}
              />

              {filteredUsers.length > 0 && (
                <div className="absolute z-10 w-full bg-white border rounded mt-1 max-h-48 overflow-auto">
                  {filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => handleSelectUser(user)}
                      className="px-3 py-2 hover:bg-slate-100 cursor-pointer"
                    >
                      {user.name} - {user.phone}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </FormField>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField label="Orbiter Name" error={errors.orbiterName}>
              <Input value={form.orbiterName} disabled />
            </FormField>

            <FormField label="Orbiter Phone" error={errors.orbiterContact}>
              <Input value={form.orbiterContact} disabled />
            </FormField>

            <FormField label="Orbiter Email" error={errors.orbiterEmail}>
              <Input value={form.orbiterEmail} disabled />
            </FormField>
          </div>

          <Text variant="h3">Prospect Information</Text>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Prospect Name" required error={errors.prospectName}>
              <Input
                value={form.prospectName}
                onChange={(e) => handleFieldChange("prospectName", e.target.value)}
              />
            </FormField>

            <FormField label="Prospect Phone" required error={errors.prospectPhone}>
              <Input
                value={form.prospectPhone}
                onChange={(e) => handleFieldChange("prospectPhone", e.target.value)}
              />
            </FormField>

            <FormField label="Email" required error={errors.email}>
              <Input
                value={form.email}
                onChange={(e) => handleFieldChange("email", e.target.value)}
              />
            </FormField>

            <FormField label="DOB" required error={errors.dob}>
                <DateInput
                  type="date"
                  value={form.dob}
                  max={getAdultDobMax()}
                  onChange={(e) => handleFieldChange("dob", e.target.value)}
                />
            </FormField>

            <FormField label="Occupation" required error={errors.occupation}>
              <Select
                value={form.occupation}
                onChange={(value) => handleFieldChange("occupation", value)}
                options={PROSPECT_OCCUPATION_OPTIONS}
              />
            </FormField>

            <FormField label="Hobbies" error={errors.hobbies}>
                <Input
                  value={form.hobbies}
                  onChange={(e) => handleFieldChange("hobbies", e.target.value)}
              />
            </FormField>
          </div>

          <FormField label="Occasion for Intimation" required error={errors.type}>
            <Select
              value={form.type}
              onChange={(v) => handleFieldChange("type", v)}
              options={PROSPECT_OCCASION_OPTIONS}
            />
          </FormField>

          <div className="flex justify-end pt-4">
            <Button onClick={handleSubmit}>Update Prospect</Button>
          </div>
        </form>
      </Card>
    </>
  );
}
