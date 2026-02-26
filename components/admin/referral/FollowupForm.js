"use client";

import React from "react";
import { ClipboardList } from "lucide-react";

import Card from "@/components/ui/Card";
import Text from "@/components/ui/Text";
import Button from "@/components/ui/Button";
import FormField from "@/components/ui/FormField";
import Select from "@/components/ui/Select";
import DateInput from "@/components/ui/DateInput";
import Textarea from "@/components/ui/Textarea";

export default function FollowupForm({
  form,
  setForm,
  isEditing,
  onSave,
  onCancel,
  errors = {},
}) {
  const handleChange = (field, value) => {
    const finalValue =
      value?.target?.value !== undefined
        ? value.target.value
        : value;

    setForm((prev) => ({
      ...prev,
      [field]: finalValue,
    }));
  };

  return (
    <>
      {/* HEADER — same style as Referral Info */}
      <div className="flex items-center gap-2">
        <ClipboardList size={18} />
        <Text as="h3" variant="h3">
          Follow Up Info
        </Text>
      </div>

      <div className="space-y-4 mt-4">
        <FormField
          label="Priority"
          error={errors.priority}
          required
        >
          <Select
            value={form.priority || ""}
            onChange={(value) => handleChange("priority", value)}
            error={!!errors.priority}
            options={[
              { label: "High", value: "High" },
              { label: "Medium", value: "Medium" },
              { label: "Low", value: "Low" },
            ]}
          />
        </FormField>

        <FormField
          label="Next Date"
          error={errors.date}
          required
        >
          <DateInput
            value={form.date || ""}
            onChange={(value) => handleChange("date", value)}
            error={!!errors.date}
          />
        </FormField>

        <FormField
          label="Description"
          error={errors.description}
          required
        >
          <Textarea
            value={form.description || ""}
            onChange={(value) =>
              handleChange("description", value)
            }
            error={!!errors.description}
          />
        </FormField>

        <FormField
          label="Status"
          error={errors.status}
          required
        >
          <Select
            value={form.status || ""}
            onChange={(value) => handleChange("status", value)}
            error={!!errors.status}
            options={[
              { label: "Pending", value: "Pending" },
              { label: "Completed", value: "Completed" },
            ]}
          />
        </FormField>

        <div className="flex items-center justify-end gap-2 p-5 border-t border-slate-200">
          <Button
            variant="secondary"
            type="button"
            onClick={onCancel}
          >
            Cancel
          </Button>

          <Button
            variant="primary"
            type="button"
            onClick={onSave}
          >
            {isEditing ? "Update Follow Up" : "Save Follow Up"}
          </Button>
        </div>
      </div>
    </>
  );
}
