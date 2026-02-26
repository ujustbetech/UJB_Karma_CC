"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addDoc, collection, Timestamp } from "firebase/firestore";
import { db } from "@/firebaseConfig";
import { COLLECTIONS } from "@/lib/utility_collection";

import { CalendarPlus } from "lucide-react";

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
    const e = {};
    if (!eventName) e.eventName = "Event name is required";
    if (!eventTime) e.eventTime = "Date & time is required";
    return e;
  };

  const handleCreate = async (e) => {
    e.preventDefault();

    const v = validate();
    setErrors(v);
    if (Object.keys(v).length) return;

    setLoading(true);

    try {
      const docRef = await addDoc(
        collection(db, COLLECTIONS.monthlyMeeting),
        {
          Eventname: eventName,
          time: Timestamp.fromDate(new Date(eventTime)),
          zoomLink: zoomLink || "",
          agenda: [],

          topicSections: [],
          facilitatorSections: [],
          referralSections: [],
          sections: [],
          e2aSections: [],
          prospectSections: [],
          knowledgeSections: [],
          requirementSections: [],
          documentUploads: [],
          imageUploads: [],
          invitedUsers: [],

          createdAt: new Date(),
        }
      );

      toast.success("Event created successfully");
      router.push(`/admin/event/edit/${docRef.id}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to create event");
    }

    setLoading(false);
  };

  return (
    <div className="space-y-6">

      {/* Form */}
      <Card className="p-6 space-y-6">

        <div className="pb-3 border-b">
          <Text as="h2">Basic Information</Text>
        </div>

        <form onSubmit={handleCreate} className="space-y-5">

          <FormField label="Event Name" required error={errors.eventName}>
            <Input
              value={eventName}
              onChange={(e) => {
                setEventName(e.target.value);
                setErrors((p) => ({ ...p, eventName: "" }));
              }}
              placeholder="Eg: UJB Monthly Meeting – Feb 2026"
              autoFocus
            />
          </FormField>

          <FormField label="Date & Time" required error={errors.eventTime}>
            <DateInput
              type="datetime-local"
              value={eventTime}
              onChange={(e) => {
                setEventTime(e.target.value);
                setErrors((p) => ({ ...p, eventTime: "" }));
              }}
            />
          </FormField>

          <FormField label="Zoom Link (Optional)">
            <Input
              value={zoomLink}
              onChange={(e) => setZoomLink(e.target.value)}
              placeholder="Paste Zoom meeting link"
            />
          </FormField>

          <div className="flex justify-end pt-4 border-t">
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? "Creating..." : "Create Event"}
            </Button>
          </div>

        </form>
      </Card>
    </div>
  );
}
