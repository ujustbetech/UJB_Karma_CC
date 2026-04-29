"use client";

import { useState, useEffect } from "react";
import { doc, getDocs, updateDoc, collection, db } from "@/services/adminConclaveFirebaseService";
import { COLLECTIONS } from "@/lib/utility_collection";

import Card from "@/components/ui/Card";
import Text from "@/components/ui/Text";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import DateInput from "@/components/ui/DateInput";
import FormField from "@/components/ui/FormField";
import { useToast } from "@/components/ui/ToastProvider";

export default function ParticipantSection({
  conclaveId,
  meetingId,
  data = {},
  fetchData,
}) {
  const toast = useToast();

  const [sections, setSections] = useState(data.sections || []);
  const [userOptions, setUserOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  /* ================= FETCH USERS ================= */
  useEffect(() => {
    const fetchUsers = async () => {
      const snapshot = await getDocs(
        collection(db, COLLECTIONS.userDetail)
      );

      const options = snapshot.docs.map((doc) => ({
        label: doc.data()["Name"] || "",
        value: doc.data()["Name"] || "",
      }));

      setUserOptions(options);
    };

    fetchUsers();
  }, []);

  /* ================= HANDLERS ================= */

  const handleChange = (index, field, value) => {
    const updated = [...sections];
    updated[index][field] = value;
    setSections(updated);
  };

  const addSection = () => {
    setSections((prev) => [
      ...prev,
      {
        selectedParticipant1: "",
        selectedParticipant2: "",
        interactionDate: "",
      },
    ]);
  };

  const removeSection = (index) => {
    setSections((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!conclaveId || !meetingId) {
      toast.error("Missing meeting info");
      return;
    }

    setLoading(true);

    try {
      const docRef = doc(
        db,
        COLLECTIONS.conclaves,
        conclaveId,
        "meetings",
        meetingId
      );

      await updateDoc(docRef, { sections });

      toast.success("Participants saved");
      fetchData?.();
    } catch (error) {
      console.error(error);
      toast.error("Failed to save");
    }

    setLoading(false);
  };

  /* ================= UI ================= */

  return (
    <div className="space-y-6">

      <Card>
        <Text variant="h2">121 Interaction</Text>
      </Card>

      {sections.map((section, index) => (
        <Card key={index} className="space-y-6">

          <FormField label="Proposed By" required>
            <Select
              options={userOptions}
              value={section.selectedParticipant1}
              onChange={(v) =>
                handleChange(index, "selectedParticipant1", v)
              }
            />
          </FormField>

          <FormField label="Proposed With" required>
            <Select
              options={userOptions}
              value={section.selectedParticipant2}
              onChange={(v) =>
                handleChange(index, "selectedParticipant2", v)
              }
            />
          </FormField>

          <FormField label="Interaction Date" required>
            <DateInput
              type="datetime-local"
              value={section.interactionDate}
              onChange={(v) =>
                handleChange(index, "interactionDate", v)
              }
            />
          </FormField>

          <div className="flex justify-end">
            <Button
              variant="danger"
              onClick={() => removeSection(index)}
            >
              Remove
            </Button>
          </div>

        </Card>
      ))}

      <div className="flex justify-between">
        <Button variant="secondary" onClick={addSection}>
          + Add Interaction
        </Button>

        <Button onClick={handleSave}>
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}



