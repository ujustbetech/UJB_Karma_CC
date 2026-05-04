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
import ConfirmModal from "@/components/ui/ConfirmModal";
import FormField from "@/components/ui/FormField";
import Textarea from "@/components/ui/Textarea";
import { useToast } from "@/components/ui/ToastProvider";
import { Trash2, UserPlus, Pencil } from "lucide-react";

const PROSPECT_STAGES = [
  { label: "New", color: "bg-gray-100 text-gray-700" },
  { label: "Connected", color: "bg-blue-100 text-blue-700" },
  { label: "Eligible", color: "bg-purple-100 text-purple-700" },
  { label: "Enrolled", color: "bg-green-100 text-green-700" },
];

const ProspectSection = forwardRef(function ProspectSection(
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
  const [editingIndex, setEditingIndex] = useState(null);

  const firstErrorRef = useRef(null);

  useEffect(() => {
    const migrated = (data?.prospectSections || []).map((section) => ({
      ...section,
      stage: section.stage || "New",
      prospectSearch: "",
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

  const handleSearch = (index, value) => {
    const updated = [...sections];
    updated[index].prospectSearch = value;
    setSections(updated);
    setDirty(true);
    clearError(`user-${index}`);

    const filtered = users.filter((user) =>
      user.name.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredMap((previous) => ({ ...previous, [index]: filtered }));
  };

  const selectUser = (index, name) => {
    const updated = [...sections];
    updated[index].prospect = name;
    updated[index].prospectSearch = "";
    setSections(updated);
    setFilteredMap((previous) => ({ ...previous, [index]: [] }));
    setDirty(true);
    clearError(`user-${index}`);
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
        prospect: "",
        prospectSearch: "",
        prospectName: "",
        prospectDescription: "",
        stage: "New",
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
      if (!section.prospect) nextErrors[`user-${index}`] = "Required";
      if (!section.prospectName?.trim()) nextErrors[`prospectName-${index}`] = "Required";
      if (!section.prospectDescription?.trim()) {
        nextErrors[`prospectDescription-${index}`] = "Required";
      }
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
        prospectSections: sections.map((section) => ({
          prospect: section.prospect,
          prospectName: section.prospectName,
          prospectDescription: section.prospectDescription,
          stage: section.stage || "New",
        })),
      });

      setDirty(false);
      await fetchData?.();
      toast.success("Prospects saved");
      return true;
    } catch (error) {
      console.error(error);
      toast.error("Save failed");
      return false;
    } finally {
      setSaving(false);
    }
  };

  useImperativeHandle(ref, () => ({
    isDirty: () => dirty,
    save: handleSave,
  }));

  const summary = PROSPECT_STAGES.reduce((accumulator, stage) => {
    accumulator[stage.label] = sections.filter((section) => section.stage === stage.label).length;
    return accumulator;
  }, {});

  return (
    <Card className="space-y-6 border-none p-6 shadow-none">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <UserPlus className="h-5 w-5 text-blue-600" />
          <Text as="h2" variant="h2">Prospects</Text>
          <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-700">
            {sections.length}
          </span>
        </div>

        <Button variant="outline" onClick={addRow}>
          + Add Entry
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {PROSPECT_STAGES.map((stage) => (
          <div key={stage.label} className={`rounded-full px-3 py-1 text-xs ${stage.color}`}>
            {stage.label}: {summary[stage.label]}
          </div>
        ))}
      </div>

      <div className="space-y-4">
        {sections.map((section, index) => (
          <Card
            key={index}
            className="p-5 space-y-4 border border-slate-200 bg-slate-50/40"
          >
            {/* HEADER */}
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="space-y-1">
                <Text className="font-semibold">
                  Prospect Entry #{index + 1}
                </Text>

                <Text className="text-sm text-slate-600">
                  {section.prospectDescription
                    ? section.prospectDescription.slice(0, 80) + "..."
                    : "No details added yet"}
                </Text>

                <Text className="text-xs text-slate-500">
                  {section.prospectName || "No prospect name"}
                </Text>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Stage badge */}
                <span
                  className={`rounded-full px-2 py-1 text-xs ${PROSPECT_STAGES.find((s) => s.label === section.stage)?.color ||
                    PROSPECT_STAGES[0].color
                    }`}
                >
                  {section.stage || "New"}
                </span>

                {/* Edit */}
                <Button
                  type="button"
                  variant={editingIndex === index ? "secondary" : "outline"}
                  onClick={() =>
                    setEditingIndex(editingIndex === index ? null : index)
                  }
                >
                  <span className="flex items-center gap-2">
                    <Pencil className="h-4 w-4" />
                    {editingIndex === index ? "Close" : "Edit"}
                  </span>
                </Button>

                {/* Delete */}
                <Button
                  type="button"
                  variant="ghostDanger"
                  onClick={() => {
                    setRemoveIndex(index);
                    setConfirmOpen(true);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* 🔥 EDIT MODE */}
            {editingIndex === index && (
              <div className="space-y-4 border-t pt-4 mt-2">

                {/* Orbiter */}
                <FormField label="Orbiter" required error={errors[`user-${index}`]}>
                  <div className="relative">
                    <Input
                      ref={index === 0 ? firstErrorRef : null}
                      value={section.prospectSearch || section.prospect}
                      onChange={(e) => handleSearch(index, e.target.value)}
                      error={!!errors[`user-${index}`]}
                      placeholder="Search member name"
                    />

                    {filteredMap[index]?.length > 0 && (
                      <div className="absolute z-30 mt-2 w-full max-h-56 overflow-y-auto rounded-xl border bg-white shadow-lg">
                        {filteredMap[index].map((user) => (
                          <div
                            key={user.id}
                            onClick={() => selectUser(index, user.name)}
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

                {/* Prospect Name */}
                <FormField
                  label="Prospect Name"
                  required
                  error={errors[`prospectName-${index}`]}
                >
                  <Input
                    value={section.prospectName || ""}
                    onChange={(e) =>
                      updateField(index, "prospectName", e.target.value)
                    }
                    error={!!errors[`prospectName-${index}`]}
                  />
                </FormField>

                {/* Details */}
                <FormField
                  label="Details"
                  required
                  error={errors[`prospectDescription-${index}`]}
                >
                  <Textarea
                    value={section.prospectDescription || ""}
                    onChange={(e) =>
                      updateField(index, "prospectDescription", e.target.value)
                    }
                    error={!!errors[`prospectDescription-${index}`]}
                  />
                </FormField>

                {/* Stage */}
                <FormField label="Prospect Stage">
                  <div className="flex flex-wrap gap-2">
                    {PROSPECT_STAGES.map((stage) => (
                      <button
                        key={stage.label}
                        type="button"
                        onClick={() => updateField(index, "stage", stage.label)}
                        className={`px-3 py-1.5 rounded-full text-sm border ${section.stage === stage.label
                            ? stage.color
                            : "bg-white border-gray-300"
                          }`}
                      >
                        {stage.label}
                      </button>
                    ))}
                  </div>
                </FormField>
              </div>
            )}
          </Card>
        ))}
      </div>

      <div className="flex justify-end border-t pt-4">
        <Button variant="primary" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>

      <ConfirmModal
        open={confirmOpen}
        title="Delete this prospect?"
        description="This action cannot be undone."
        onConfirm={confirmRemove}
        onClose={() => setConfirmOpen(false)}
      />
    </Card>
  );
});

export default ProspectSection;
