"use client";

import { useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Text from "@/components/ui/Text";
import Input from "@/components/ui/Input";
import {
  FormField,
  PasswordInput,
  Checkbox,
  RadioGroup,
  Select,
  DateInput,
  NumberInput,
  RangeInput,
  TagsInput,
} from "@/components/ui/form";
import { useToast } from "@/components/ui/ToastProvider";

export default function CreateUserPage() {
  const toast = useToast();

  /* ================================
     Form State
  ================================ */
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
    gender: "male",
    dob: "",
    experience: "",
    accessLevel: 30,
    skills: [],
    active: true,
  });

  const [errors, setErrors] = useState({});

  /* ================================
     Helpers
  ================================ */
  const update = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: null }));
  };

  const validate = () => {
    const e = {};

    if (!form.name.trim()) {
      e.name = "Name is required";
    }

    if (!form.email.trim()) {
      e.email = "Email is required";
    } else if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      e.email = "Invalid email address";
    }

    if (!form.password) {
      e.password = "Password is required";
    } else if (form.password.length < 6) {
      e.password = "Minimum 6 characters";
    }

    if (!form.role) {
      e.role = "Please select a role";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ================================
     Submit
  ================================ */
  const submit = () => {
    if (!validate()) {
      toast.error("Please fix validation errors");
      return;
    }

    console.log("FORM DATA →", form);
    toast.success("User created successfully");
  };

  return (
    <div className="max-w-3xl space-y-6">
      {/* Page Title */}
      <Text as="h1" variant="h1">
        Create User
      </Text>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Full Name */}
          <FormField
            label="Full Name"
            required
            error={errors.name}
          >
            <Input
              value={form.name}
              error={!!errors.name}
              onChange={(e) =>
                update("name", e.target.value)
              }
            />
          </FormField>

          {/* Email */}
          <FormField
            label="Email"
            required
            error={errors.email}
          >
            <Input
              value={form.email}
              error={!!errors.email}
              onChange={(e) =>
                update("email", e.target.value)
              }
            />
          </FormField>

          {/* Password */}
          <FormField
            label="Password"
            required
            error={errors.password}
          >
            <PasswordInput
              value={form.password}
              error={!!errors.password}
              onChange={(e) =>
                update("password", e.target.value)
              }
            />
          </FormField>

          {/* Role */}
          <FormField
            label="Role"
            required
            error={errors.role}
          >
            <Select
              value={form.role}
              error={!!errors.role}
              onChange={(v) =>
                update("role", v)
              }
              options={[
                { label: "Select role", value: "" },
                { label: "User", value: "user" },
                { label: "Admin", value: "admin" },
              ]}
            />
          </FormField>

          {/* Gender */}
          <FormField label="Gender">
            <RadioGroup
              value={form.gender}
              onChange={(v) =>
                update("gender", v)
              }
              options={[
                { label: "Male", value: "male" },
                { label: "Female", value: "female" },
              ]}
            />
          </FormField>

          {/* Date of Birth */}
          <FormField label="Date of Birth">
            <DateInput
              value={form.dob}
              error={!!errors.dob}
              onChange={(e) =>
                update("dob", e.target.value)
              }
            />
          </FormField>

          {/* Experience */}
          <FormField label="Experience (years)">
            <NumberInput
              value={form.experience}
              error={!!errors.experience}
              onChange={(e) =>
                update("experience", e.target.value)
              }
            />
          </FormField>

          {/* Access Level */}
          <FormField label="Access Level">
            <RangeInput
              min={0}
              max={100}
              value={form.accessLevel}
              onChange={(v) =>
                update("accessLevel", v)
              }
            />
          </FormField>

          {/* Skills / Tags */}
          <FormField
            label="Skills / Tags"
            error={errors.skills}
          >
            <TagsInput
              value={form.skills}
              error={!!errors.skills}
              onChange={(v) =>
                update("skills", v)
              }
            />
          </FormField>

          {/* Active */}
          <FormField>
            <Checkbox
              label="Active user"
              checked={form.active}
              onChange={(v) =>
                update("active", v)
              }
            />
          </FormField>
        </div>

        {/* Footer */}
        <div className="mt-8 flex justify-end gap-3">
          <Button variant="secondary">
            Cancel
          </Button>
          <Button onClick={submit}>
            Create User
          </Button>
        </div>
      </Card>
    </div>
  );
}
