"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createAdminMonthlyMeeting } from "@/services/adminMonthlyMeetingService";

import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Text from "@/components/ui/Text";
import Input from "@/components/ui/Input";
import DateInput from "@/components/ui/DateInput";
import FormField from "@/components/ui/FormField";
import { useToast } from "@/components/ui/ToastProvider";

export default function AddEventPage() {
  const router = useRouter();
  const toast = useToast();

  const [eventName, setEventName] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [zoomLink, setZoomLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const nextErrors = {};

    if (!eventName.trim()) nextErrors.eventName = "Event name is required";
    if (!eventTime) nextErrors.eventTime = "Date & time is required";
    if (zoomLink && !/^https?:\/\//i.test(zoomLink.trim())) {
      nextErrors.zoomLink = "Enter a valid meeting URL";
    }

    return nextErrors;
  };

  const handleCreate = async (event) => {
    event.preventDefault();

    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length) {
      return;
    }

    setLoading(true);

    try {
      const id = await createAdminMonthlyMeeting({
        eventName: eventName.trim(),
        eventTime,
        zoomLink: zoomLink.trim(),
      });

      toast.success("Event created successfully");
      router.push(`/admin/monthlymeeting/${id}`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to create event");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="space-y-6 p-6">
        <div className="border-b pb-3">
          <Text as="h2">Basic Information</Text>
        </div>

        <form onSubmit={handleCreate} className="space-y-5">
          <FormField label="Event Name" required error={errors.eventName}>
            <Input
              value={eventName}
              onChange={(event) => {
                setEventName(event.target.value);
                setErrors((previous) => ({ ...previous, eventName: "" }));
              }}
              placeholder="Eg: UJB Monthly Meeting - Feb 2026"
              autoFocus
              error={!!errors.eventName}
            />
          </FormField>

          <FormField label="Date & Time" required error={errors.eventTime}>
            <DateInput
              type="datetime-local"
              value={eventTime}
              onChange={(event) => {
                setEventTime(event.target.value);
                setErrors((previous) => ({ ...previous, eventTime: "" }));
              }}
              error={!!errors.eventTime}
            />
          </FormField>

          <FormField label="Zoom Link (Optional)" error={errors.zoomLink}>
            <Input
              value={zoomLink}
              onChange={(event) => {
                setZoomLink(event.target.value);
                setErrors((previous) => ({ ...previous, zoomLink: "" }));
              }}
              placeholder="Paste Zoom meeting link"
              error={!!errors.zoomLink}
            />
          </FormField>

          <div className="flex justify-end border-t pt-4">
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? "Creating..." : "Create Event"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
