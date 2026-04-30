"use client";

import {
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
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
import Tooltip from "@/components/ui/Tooltip";
import ConfirmModal from "@/components/ui/ConfirmModal";
import FormField from "@/components/ui/FormField";
import RichEditor from "@/components/ui/RichEditor";
import { useToast } from "@/components/ui/ToastProvider";
import { Trash2, ClipboardList, Pencil } from "lucide-react";

const REQUIREMENT_STAGES = ["New", "Connected", "Referral Passed", "Not Fulfilled"];

const STAGE_COLORS = {
  New: "bg-gray-100 text-gray-700",
  Connected: "bg-blue-100 text-blue-700",
  "Referral Passed": "bg-green-100 text-green-700",
  "Not Fulfilled": "bg-red-100 text-red-700",
};

const RequirementSection = forwardRef(function RequirementSection(
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
    const migrated = (data?.requirementSections || []).map((section) => ({
      ...section,
      stage: section.stage || "New",
      reqSearch: "",
    }));

    setSections(migrated);
    setFilteredMap({});
    setErrors({});
    setDirty(false);
  }, [data?.requirementSections]);

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
    updated[index].reqSearch = value;
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
    updated[index].reqfrom = name;
    updated[index].reqSearch = "";
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
        reqfrom: "",
        reqSearch: "",
        reqDescription: "",
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
      if (!section.reqfrom) nextErrors[`user-${index}`] = "Required";
      const plainText = String(section.reqDescription || "").replace(/<[^>]*>/g, "").trim();
      if (!plainText) nextErrors[`reqDescription-${index}`] = "Required";
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
      const cleanedSections = sections.map((section) => ({
        reqfrom: section.reqfrom,
        reqDescription: section.reqDescription,
        stage: section.stage || "New",
      }));

      await updateDoc(doc(db, COLLECTIONS.conclaves, conclaveId, "meetings", meetingId), {
        requirementSections: cleanedSections,
      });

      setSections(
        cleanedSections.map((section) => ({
          ...section,
          reqSearch: "",
        }))
      );
      setDirty(false);
      await fetchData?.();
      toast.success("Requirements saved");
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

  const summary = REQUIREMENT_STAGES.reduce((accumulator, stage) => {
    accumulator[stage] = sections.filter((section) => section.stage === stage).length;
    return accumulator;
  }, {});

  return (
    <Card className="space-y-6 border-none p-6 shadow-none">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ClipboardList className="h-5 w-5 text-blue-600" />
          <Text as="h2" variant="h2">Requirements</Text>
          <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-700">
            {sections.length}
          </span>
        </div>

        <Button variant="outline" onClick={addRow}>
          + Add Entry
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {REQUIREMENT_STAGES.map((stage) => (
          <div key={stage} className={`rounded-full px-3 py-1 text-xs ${STAGE_COLORS[stage]}`}>
            {stage}: {summary[stage]}
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
                  Requirement Entry #{index + 1}
                </Text>

                <Text className="text-sm text-slate-600">
                  {section.reqDescription
                    ? section.reqDescription.replace(/<[^>]+>/g, '').slice(0, 80) + '...'
                    : 'No description added yet'}
                </Text>

                <Text className="text-xs text-slate-500">
                  {section.reqfrom || 'Requester not selected'}
                </Text>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2 py-1 text-xs ${STAGE_COLORS[section.stage || 'New']}`}>
                  {section.stage || 'New'}
                </span>

                <Button
                  type="button"
                  variant={editingIndex === index ? 'secondary' : 'outline'}
                  onClick={() =>
                    setEditingIndex(editingIndex === index ? null : index)
                  }
                >
                  <span className="flex items-center gap-2">
                    <Pencil className="h-4 w-4" />
                    {editingIndex === index ? 'Close' : 'Edit'}
                  </span>
                </Button>

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

            {/* 🔥 EDIT MODE FORM */}
            {editingIndex === index && (
              <div className="space-y-4 border-t pt-4 mt-2">

                {/* Requested By */}
                <FormField label="Requested By" required error={errors[`user-${index}`]}>
                  <div className="relative">
                    <Input
                      ref={index === 0 ? firstErrorRef : null}
                      value={section.reqSearch || section.reqfrom}
                      onChange={(e) => handleSearch(index, e.target.value)}
                      error={!!errors[`user-${index}`]}
                      placeholder="Search member name"
                    />

                    {filteredMap[index]?.length > 0 && (
                      <div className="absolute z-30 w-full mt-2 bg-white border rounded-xl shadow-lg max-h-56 overflow-y-auto">
                        {filteredMap[index].map((user) => (
                          <div
                            key={user.id}
                            onClick={() => selectUser(index, user.name)}
                            className="px-4 py-2.5 cursor-pointer hover:bg-blue-50"
                          >
                            <div className="text-sm font-medium">{user.name}</div>
                            <div className="text-xs text-gray-500">{user.phone}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </FormField>

                {/* Description */}
                <FormField
                  label="Description"
                  required
                  error={errors[`reqDescription-${index}`]}
                >
                  <RichEditor
                    value={section.reqDescription || ""}
                    onChange={(val) => updateField(index, "reqDescription", val)}
                  />
                </FormField>

                {/* Stage */}
                <FormField label="Requirement Outcome">
                  <div className="flex flex-wrap gap-2">
                    {REQUIREMENT_STAGES.map((stage) => (
                      <button
                        key={stage}
                        type="button"
                        onClick={() => updateField(index, "stage", stage)}
                        className={`px-3 py-1.5 rounded-full text-sm border ${section.stage === stage
                            ? STAGE_COLORS[stage]
                            : "bg-white border-gray-300"
                          }`}
                      >
                        {stage}
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
        title="Delete this requirement?"
        description="This action cannot be undone."
        onConfirm={confirmRemove}
        onClose={() => setConfirmOpen(false)}
      />
    </Card>
  );
});

export default RequirementSection;
