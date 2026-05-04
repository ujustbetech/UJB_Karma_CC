"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  db,
} from "@/services/adminConclaveFirebaseService";
import { COLLECTIONS } from "@/lib/utility_collection";

import Card from "@/components/ui/Card";
import Text from "@/components/ui/Text";
import Button from "@/components/ui/Button";
import ActionButton from "@/components/ui/ActionButton";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Select from "@/components/ui/Select";
import FormField from "@/components/ui/FormField";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { useToast } from "@/components/ui/ToastProvider";
import { Network, Trash2 } from "lucide-react";

const STATUS_OPTIONS = [
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
].map((status) => ({ label: status, value: status }));

const ReferralSection = forwardRef(function ReferralSection(
  { conclaveId, meetingId, data = {}, fetchData },
  ref
) {
  const toast = useToast();
  const [sections, setSections] = useState([]);
  const [users, setUsers] = useState([]);
  const [filteredMap, setFilteredMap] = useState({});
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [removeIndex, setRemoveIndex] = useState(null);

  const firstErrorRef = useRef(null);

  useEffect(() => {
    const migrated = (data?.referralSections || []).map((section) => ({
      ...section,
      referralFromSearch: "",
      referralToSearch: "",
      status: section.status || "Pending",
    }));

    setSections(migrated);
    setDirty(false);
  }, [data]);

  useEffect(() => {
    const fetchUsers = async () => {
      const snap = await getDocs(collection(db, COLLECTIONS.userDetail));
      const list = snap.docs.map((item) => ({
        id: item.id,
        name: item.data().Name || "",
        phone: item.data().MobileNo || "",
      }));
      setUsers(list);
    };

    fetchUsers();
  }, []);

  const clearError = (key) => {
    setErrors((previous) => ({ ...previous, [key]: "" }));
  };

  const handleSearch = (index, field, value) => {
    const searchField = `${field}Search`;
    const updated = [...sections];
    updated[index][searchField] = value;
    setSections(updated);
    setDirty(true);
    clearError(`${field}-${index}`);

    const filtered = users.filter((user) =>
      user.name.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredMap((previous) => ({
      ...previous,
      [`${index}-${field}`]: filtered,
    }));
  };

  const selectUser = (index, field, name) => {
    const updated = [...sections];
    updated[index][field] = name;
    updated[index][`${field}Search`] = "";
    setSections(updated);
    setFilteredMap((previous) => ({ ...previous, [`${index}-${field}`]: [] }));
    setDirty(true);
    clearError(`${field}-${index}`);
  };

  const updateField = (index, field, value) => {
    const updated = [...sections];
    updated[index][field] = value;
    setSections(updated);
    setDirty(true);
    clearError(`${field}-${index}`);
  };

  const addRow = () => {
    setSections((previous) => [
      ...previous,
      {
        referralFrom: "",
        referralFromSearch: "",
        referralTo: "",
        referralToSearch: "",
        referralDesc: "",
        status: "Pending",
      },
    ]);
    setDirty(true);
  };

  const confirmRemove = () => {
    setSections((previous) => previous.filter((_, index) => index !== removeIndex));
    setDirty(true);
    setConfirmOpen(false);
    setRemoveIndex(null);
  };

  const validate = () => {
    const nextErrors = {};

    sections.forEach((section, index) => {
      if (!section.referralFrom) nextErrors[`referralFrom-${index}`] = "Required";
      if (!section.referralTo) nextErrors[`referralTo-${index}`] = "Required";
      if (!section.referralDesc?.trim()) nextErrors[`referralDesc-${index}`] = "Required";
    });

    setErrors(nextErrors);
    return nextErrors;
  };

  const handleSave = async () => {
    if (!conclaveId || !meetingId) return false;

    const validationErrors = validate();
    if (Object.keys(validationErrors).length) {
      firstErrorRef.current?.focus();
      toast.error("Please complete all required fields");
      return false;
    }

    try {
      setSaving(true);

      await updateDoc(doc(db, COLLECTIONS.conclaves, conclaveId, "meetings", meetingId), {
        referralSections: sections.map((section) => ({
          referralFrom: section.referralFrom,
          referralTo: section.referralTo,
          referralDesc: section.referralDesc,
          status: section.status || "Pending",
        })),
      });

      setDirty(false);
      await fetchData?.();
      toast.success("Referrals updated");
      return true;
    } catch (error) {
      console.error(error);
      toast.error("Failed to update referrals");
      return false;
    } finally {
      setSaving(false);
    }
  };

  useImperativeHandle(ref, () => ({
    isDirty: () => dirty,
    save: handleSave,
  }));

  return (
    <Card className="space-y-6 border-none p-6 shadow-none">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Network className="h-5 w-5 text-blue-600" />
          <Text as="h2" variant="h2">Referrals</Text>
          <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-700">
            {sections.length}
          </span>
        </div>

        <Button variant="outline" onClick={addRow}>
          + Add Referral
        </Button>
      </div>

      <div className="space-y-4">
        {sections.map((section, index) => (
          <Card
            key={index}
            className="space-y-4 border border-slate-200 bg-slate-50/40 p-5"
          >
            <div className="flex items-center justify-between">
              <Text as="h3" className="font-semibold">
                Referral Entry {index + 1}
              </Text>

              <div className="flex items-center gap-2">
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700">
                  {section.status || "Pending"}
                </span>
                <ActionButton
                  icon={Trash2}
                  variant="ghostDanger"
                  label="Remove"
                  onClick={() => {
                    setRemoveIndex(index);
                    setConfirmOpen(true);
                  }}
                />
              </div>
            </div>

            <FormField label="Referral From" required error={errors[`referralFrom-${index}`]}>
              <div className="relative">
                <Input
                  ref={index === 0 ? firstErrorRef : null}
                  value={section.referralFromSearch || section.referralFrom}
                  onChange={(event) =>
                    handleSearch(index, "referralFrom", event.target.value)
                  }
                  error={!!errors[`referralFrom-${index}`]}
                />

                {filteredMap[`${index}-referralFrom`]?.length > 0 && (
                  <div className="absolute z-30 mt-2 max-h-56 w-full overflow-y-auto rounded-xl border bg-white shadow-lg">
                    {filteredMap[`${index}-referralFrom`].map((user) => (
                      <div
                        key={user.id}
                        onClick={() => selectUser(index, "referralFrom", user.name)}
                        className="cursor-pointer px-4 py-2.5 hover:bg-blue-50"
                      >
                        <div className="text-sm font-medium">{user.name}</div>
                        <div className="text-xs text-gray-500">{user.phone}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </FormField>

            <FormField label="Referral To" required error={errors[`referralTo-${index}`]}>
              <div className="relative">
                <Input
                  value={section.referralToSearch || section.referralTo}
                  onChange={(event) =>
                    handleSearch(index, "referralTo", event.target.value)
                  }
                  error={!!errors[`referralTo-${index}`]}
                />

                {filteredMap[`${index}-referralTo`]?.length > 0 && (
                  <div className="absolute z-30 mt-2 max-h-56 w-full overflow-y-auto rounded-xl border bg-white shadow-lg">
                    {filteredMap[`${index}-referralTo`].map((user) => (
                      <div
                        key={user.id}
                        onClick={() => selectUser(index, "referralTo", user.name)}
                        className="cursor-pointer px-4 py-2.5 hover:bg-blue-50"
                      >
                        <div className="text-sm font-medium">{user.name}</div>
                        <div className="text-xs text-gray-500">{user.phone}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </FormField>

            <FormField label="Description" required error={errors[`referralDesc-${index}`]}>
              <Textarea
                value={section.referralDesc || ""}
                onChange={(event) => updateField(index, "referralDesc", event.target.value)}
                error={!!errors[`referralDesc-${index}`]}
              />
            </FormField>

            <FormField label="Status" required>
              <Select
                options={STATUS_OPTIONS}
                value={section.status || "Pending"}
                onChange={(value) => updateField(index, "status", value)}
              />
            </FormField>
          </Card>
        ))}
      </div>

      <div className="flex justify-end border-t pt-4">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>

      <ConfirmModal
        open={confirmOpen}
        title="Delete this referral?"
        description="This action cannot be undone."
        onConfirm={confirmRemove}
        onClose={() => setConfirmOpen(false)}
      />
    </Card>
  );
});

export default ReferralSection;
