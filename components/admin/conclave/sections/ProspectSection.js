"use client";

import { useState, useEffect } from "react";
import { doc, getDocs, updateDoc, collection, db } from "@/services/adminConclaveFirebaseService";
import { COLLECTIONS } from "@/lib/utility_collection";

import Card from "@/components/ui/Card";
import Text from "@/components/ui/Text";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import FormField from "@/components/ui/FormField";
import { useToast } from "@/components/ui/ToastProvider";

export default function ProspectSection({
  conclaveId,
  meetingId,
  data = {},
  fetchData,
}) {
  const toast = useToast();

  const [prospectSections, setProspectSections] = useState(
    data.prospectSections || []
  );
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
    const updated = [...prospectSections];
    updated[index][field] = value;
    setProspectSections(updated);
  };

  const addSection = () => {
    setProspectSections((prev) => [
      ...prev,
      {
        prospect: "",
        prospectName: "",
        prospectDescription: "",
      },
    ]);
  };

  const removeSection = (index) => {
    setProspectSections((prev) =>
      prev.filter((_, i) => i !== index)
    );
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

      await updateDoc(docRef, {
        prospectSections,
      });

      toast.success("Prospects saved");
      fetchData?.();
    } catch (error) {
      console.error(error);
      toast.error("Failed to save prospects");
    }

    setLoading(false);
  };

  /* ================= UI ================= */

  return (
    <div className="space-y-6">

      <Card>
        <Text variant="h2">Prospect Section</Text>
      </Card>

      {prospectSections.map((section, index) => (
        <Card key={index} className="space-y-6">

          <FormField label="Assigned Orbiter" required>
            <Select
              options={userOptions}
              value={section.prospect}
              onChange={(v) =>
                handleChange(index, "prospect", v)
              }
            />
          </FormField>

          <FormField label="Prospect Name" required>
            <Input
              value={section.prospectName}
              onChange={(e) =>
                handleChange(
                  index,
                  "prospectName",
                  e.target.value
                )
              }
            />
          </FormField>

          <FormField label="Detailed Information" required>
            <Textarea
              value={section.prospectDescription}
              onChange={(e) =>
                handleChange(
                  index,
                  "prospectDescription",
                  e.target.value
                )
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
          + Add Prospect
        </Button>

        <Button onClick={handleSave}>
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </div>

    </div>
  );
}



