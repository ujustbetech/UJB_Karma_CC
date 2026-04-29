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
  const [saving, setSaving] = useState(false);
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
      meetingName: data.meetingName || "",
      datetime: toDatetimeLocal(data.datetime),
      agenda: data.agenda || "",
      mode: data.mode || "online",
      link: data.link || "",
      venue: data.venue || "",
    });
  }, [data]);

  const handleChange = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async (event) => {
    event.preventDefault();
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
          <FormField label="Meeting Name" required>
            <Input
              value={form.meetingName}
              onChange={(e) => handleChange("meetingName", e.target.value)}
            />
          </FormField>

          <FormField label="Date & Time" required>
            <DateInput
              type="datetime-local"
              value={form.datetime}
              onChange={(value) => handleChange("datetime", value)}
            />
          </FormField>

          <FormField label="Agenda" required>
            <Textarea
              value={form.agenda}
              onChange={(e) => handleChange("agenda", e.target.value)}
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
            <FormField label="Meeting Link" required>
              <Input
                value={form.link}
                onChange={(e) => handleChange("link", e.target.value)}
              />
            </FormField>
          )}

          {form.mode === "offline" && (
            <FormField label="Venue" required>
              <Input
                value={form.venue}
                onChange={(e) => handleChange("venue", e.target.value)}
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


