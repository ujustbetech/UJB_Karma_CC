"use client";

import { useEffect, useState } from "react";
import { updateAdminConclaveMeeting } from "@/services/adminConclaveService";

import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Select from "@/components/ui/Select";
import DateInput from "@/components/ui/DateInput";
import FormField from "@/components/ui/FormField";
import { useToast } from "@/components/ui/ToastProvider";

function toDatetimeLocal(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}

export default function MeetingDetailsSection({
  conclaveId,
  meetingId,
  data = {},
  fetchData,
}) {
  const toast = useToast();
  const meetingData = data || {};
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    meetingName: "",
    datetime: "",
    agenda: "",
    mode: "online",
    link: "",
    venue: "",
  });

  useEffect(() => {
    setForm({
      meetingName: meetingData.meetingName || "",
      datetime: toDatetimeLocal(meetingData.datetime),
      agenda: meetingData.agenda || "",
      mode: meetingData.mode || "online",
      link: meetingData.link || "",
      venue: meetingData.venue || "",
    });
  }, [meetingData]);

  const handleChange = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const nextErrors = {};

    if (!form.meetingName.trim()) nextErrors.meetingName = "Meeting name is required";
    if (!form.datetime) nextErrors.datetime = "Date and time are required";
    if (!form.agenda.trim()) nextErrors.agenda = "Agenda is required";
    if (form.mode === "online" && !form.link.trim()) nextErrors.link = "Meeting link is required";
    if (form.mode === "offline" && !form.venue.trim()) nextErrors.venue = "Venue is required";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleUpdate = async (event) => {
    event.preventDefault();
    if (!validate()) {
      toast.error("Please complete the required fields");
      return;
    }
    setSaving(true);

    try {
      await updateAdminConclaveMeeting(conclaveId, meetingId, {
        meetingName: form.meetingName,
        datetime: form.datetime,
        agenda: form.agenda,
        mode: form.mode,
        link: form.mode === "online" ? form.link : "",
        venue: form.mode === "offline" ? form.venue : "",
      });

      toast.success("Meeting updated successfully");
      await fetchData?.();
    } catch (error) {
      console.error(error);
      toast.error("Update failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <form onSubmit={handleUpdate} className="space-y-6">
          <FormField label="Meeting Name" required error={errors.meetingName}>
            <Input
              value={form.meetingName}
              onChange={(e) => handleChange("meetingName", e.target.value)}
              error={!!errors.meetingName}
            />
          </FormField>

          <FormField label="Date & Time" required error={errors.datetime}>
            <DateInput
              type="datetime-local"
              value={form.datetime}
              onChange={(event) => handleChange("datetime", event?.target?.value || "")}
              error={!!errors.datetime}
            />
          </FormField>

          <FormField label="Agenda" required error={errors.agenda}>
            <Textarea
              value={form.agenda}
              onChange={(e) => handleChange("agenda", e.target.value)}
              error={!!errors.agenda}
            />
          </FormField>

          <FormField label="Mode" required>
            <Select
              options={[
                { label: "Online", value: "online" },
                { label: "Offline", value: "offline" },
              ]}
              value={form.mode}
              onChange={(value) => handleChange("mode", value)}
            />
          </FormField>

          {form.mode === "online" && (
            <FormField label="Meeting Link" required error={errors.link}>
              <Input
                value={form.link}
                onChange={(e) => handleChange("link", e.target.value)}
                error={!!errors.link}
              />
            </FormField>
          )}

          {form.mode === "offline" && (
            <FormField label="Venue" required error={errors.venue}>
              <Input
                value={form.venue}
                onChange={(e) => handleChange("venue", e.target.value)}
                error={!!errors.venue}
              />
            </FormField>
          )}

          <div className="flex justify-end">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}


