"use client";

import { useState, useEffect } from "react";
import { doc, getDocs, updateDoc, collection, db } from "@/services/adminConclaveFirebaseService";
import { COLLECTIONS } from "@/lib/utility_collection";

import Card from "@/components/ui/Card";
import Text from "@/components/ui/Text";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import FormField from "@/components/ui/FormField";
import { useToast } from "@/components/ui/ToastProvider";

export default function RequirementSection({
  conclaveId,
  meetingId,
  data = {},
  fetchData,
}) {
  const toast = useToast();

  const [requirementSections, setRequirementSections] = useState(
    data.requirementSections || []
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
    const updated = [...requirementSections];
    updated[index][field] = value;
    setRequirementSections(updated);
  };

  const addSection = () => {
    setRequirementSections((prev) => [
      ...prev,
      {
        reqfrom: "",
        reqDescription: "",
      },
    ]);
  };

  const removeSection = (index) => {
    setRequirementSections((prev) =>
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
        requirementSections,
      });

      toast.success("Requirements saved");
      fetchData?.();
    } catch (error) {
      console.error(error);
      toast.error("Failed to save requirements");
    }

    setLoading(false);
  };

  /* ================= UI ================= */

  return (
    <div className="space-y-6">

      <Card>
        <Text variant="h2">Requirement Section</Text>
      </Card>

      {requirementSections.map((section, index) => (
        <Card key={index} className="space-y-6">

          <FormField label="Requested By" required>
            <Select
              options={userOptions}
              value={section.reqfrom}
              onChange={(v) =>
                handleChange(index, "reqfrom", v)
              }
            />
          </FormField>

          <FormField label="Requirement Description" required>
            <Textarea
              value={section.reqDescription}
              onChange={(e) =>
                handleChange(
                  index,
                  "reqDescription",
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
          + Add Requirement
        </Button>

        <Button onClick={handleSave}>
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </div>

    </div>
  );
}



