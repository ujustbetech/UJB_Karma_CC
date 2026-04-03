"use client";

import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/firebaseClient";
import { COLLECTIONS } from "@/lib/utility_collection";

import Card from "@/components/ui/Card";
import Text from "@/components/ui/Text";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Select from "@/components/ui/Select";
import DateInput from "@/components/ui/DateInput";
import FormField from "@/components/ui/FormField";
import { useToast } from "@/components/ui/ToastProvider";

export default function EditMeetingPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const toast = useToast();

  const meetingId = params?.eventId;
  const conclaveId = searchParams.get("conclaveId");

  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    meetingName: "",
    datetime: "",
    agenda: "",
    mode: "online",
    link: "",
    venue: "",
  });

  /* ================= FETCH ================= */

  useEffect(() => {
    if (!meetingId || !conclaveId) return;

    const fetchMeeting = async () => {
      try {
        const ref = doc(
          db,
          COLLECTIONS.conclaves,
          conclaveId,
          "meetings",
          meetingId
        );

        const snap = await getDoc(ref);

        if (snap.exists()) {
          const data = snap.data();

          setForm({
            meetingName: data.meetingName || "",
            datetime: data.datetime?.seconds
              ? new Date(
                  data.datetime.seconds * 1000
                ).toISOString().slice(0, 16)
              : "",
            agenda: data.agenda || "",
            mode: data.mode || "online",
            link: data.link || "",
            venue: data.venue || "",
          });
        } else {
          toast.error("Meeting not found");
        }
      } catch (err) {
        toast.error("Failed to load meeting");
      } finally {
        setLoading(false);
      }
    };

    fetchMeeting();
  }, [meetingId, conclaveId]);

  /* ================= HANDLERS ================= */

  const handleChange = (name, value) => {
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    try {
      const ref = doc(
        db,
        COLLECTIONS.conclaves,
        conclaveId,
        "meetings",
        meetingId
      );

      await updateDoc(ref, {
        meetingName: form.meetingName,
        datetime: Timestamp.fromDate(new Date(form.datetime)),
        agenda: form.agenda,
        mode: form.mode,
        link: form.mode === "online" ? form.link : "",
        venue: form.mode === "offline" ? form.venue : "",
      });

      toast.success("Meeting updated successfully");
      router.back();
    } catch (err) {
      toast.error("Update failed");
    }
  };

  if (loading) {
    return <Card>Loading...</Card>;
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <Card>
        <Text variant="h1">Edit Meeting</Text>
        <Text variant="muted">Conclave ID: {conclaveId}</Text>
      </Card>

      {/* Form */}
      <Card>
        <form onSubmit={handleUpdate} className="space-y-6">

          <FormField label="Meeting Name" required>
            <Input
              value={form.meetingName}
              onChange={(e) =>
                handleChange("meetingName", e.target.value)
              }
            />
          </FormField>

          <FormField label="Date & Time" required>
            <DateInput
              type="datetime-local"
              value={form.datetime}
              onChange={(v) =>
                handleChange("datetime", v)
              }
            />
          </FormField>

          <FormField label="Agenda" required>
            <Textarea
              value={form.agenda}
              onChange={(e) =>
                handleChange("agenda", e.target.value)
              }
            />
          </FormField>

          <FormField label="Mode" required>
            <Select
              options={[
                { label: "Online", value: "online" },
                { label: "Offline", value: "offline" },
              ]}
              value={form.mode}
              onChange={(v) => handleChange("mode", v)}
            />
          </FormField>

          {form.mode === "online" && (
            <FormField label="Meeting Link" required>
              <Input
                value={form.link}
                onChange={(e) =>
                  handleChange("link", e.target.value)
                }
              />
            </FormField>
          )}

          {form.mode === "offline" && (
            <FormField label="Venue" required>
              <Input
                value={form.venue}
                onChange={(e) =>
                  handleChange("venue", e.target.value)
                }
              />
            </FormField>
          )}

          <div className="flex justify-end">
            <Button type="submit">
              Update Meeting
            </Button>
          </div>

        </form>
      </Card>

    </div>
  );
}

