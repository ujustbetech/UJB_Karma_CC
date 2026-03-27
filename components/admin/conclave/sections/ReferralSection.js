"use client";

import { useState, useEffect } from "react";
import { doc, updateDoc, getDocs, collection } from "firebase/firestore";
import { db } from "@/firebaseConfig";
import { COLLECTIONS } from "@/lib/utility_collection";

import Card from "@/components/ui/Card";
import Text from "@/components/ui/Text";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import FormField from "@/components/ui/FormField";
import { useToast } from "@/components/ui/ToastProvider";

export default function ReferralSection({
  conclaveId,
  meetingId,
  data = {},
  fetchData,
}) {
  const toast = useToast();

  const [referralSections, setReferralSections] = useState(
    data.referralSections || []
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
    const updated = [...referralSections];
    updated[index][field] = value;
    setReferralSections(updated);
  };

  const addSection = () => {
    setReferralSections((prev) => [
      ...prev,
      {
        referralFrom: "",
        referralTo: "",
        referralDesc: "",
        status: "Pending",
      },
    ]);
  };

  const removeSection = (index) => {
    setReferralSections((prev) =>
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
        referralSections,
      });

      toast.success("Referrals updated");
      fetchData?.();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update referrals");
    }

    setLoading(false);
  };

  /* ================= STATUS OPTIONS ================= */

  const statusOptions = [
    "Pending",
    "Rejected",
    "Not Connected",
    "Called but not Answered",
    "Discussion in Progress",
    "Deal Won",
    "Deal Lost",
    "On Hold",
    "Work In Progress",
    "Work Completed",
    "Received Part Payment and Transferred to UJustBe",
    "Received Full and Final Payment",
    "Agreed % Transferred to UJustBe",
  ].map((s) => ({ label: s, value: s }));

  /* ================= UI ================= */

  return (
    <div className="space-y-6">

      <Card>
        <Text variant="h2">Referral Section</Text>
      </Card>

      {referralSections.map((section, index) => (
        <Card key={index} className="space-y-6">

          <FormField label="Referral From" required>
            <Select
              options={userOptions}
              value={section.referralFrom}
              onChange={(v) =>
                handleChange(index, "referralFrom", v)
              }
            />
          </FormField>

          <FormField label="Referral To" required>
            <Select
              options={userOptions}
              value={section.referralTo}
              onChange={(v) =>
                handleChange(index, "referralTo", v)
              }
            />
          </FormField>

          <FormField label="Description" required>
            <Textarea
              value={section.referralDesc}
              onChange={(e) =>
                handleChange(
                  index,
                  "referralDesc",
                  e.target.value
                )
              }
            />
          </FormField>

          <FormField label="Status" required>
            <Select
              options={statusOptions}
              value={section.status}
              onChange={(v) =>
                handleChange(index, "status", v)
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
          + Add Referral
        </Button>

        <Button onClick={handleSave}>
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </div>

    </div>
  );
}
