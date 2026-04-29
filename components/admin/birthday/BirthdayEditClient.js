"use client";

import { useEffect, useState } from "react";
import {
  fetchBirthdayEntry,
  updateBirthdayEntry,
} from "@/services/adminBirthdayService";
import { uploadBirthdayImage } from "@/services/birthdayImageUploadService";

import Card from "@/components/ui/Card";
import Text from "@/components/ui/Text";
import Button from "@/components/ui/Button";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { useToast } from "@/components/ui/ToastProvider";
import FormField from "@/components/ui/FormField";
import DateInput from "@/components/ui/DateInput";
import Input from "@/components/ui/Input";

export default function BirthdayEditClient({ id }) {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [data, setData] = useState(null);
  const [dob, setDob] = useState("");
  const [image, setImage] = useState(null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const entry = await fetchBirthdayEntry(id);
        if (!entry) {
          toast.error("Birthday record not found");
          return;
        }

        if (!isMounted) return;

        setData(entry);
        setDob(entry.dob || "");
      } catch {
        toast.error("Failed to load Birthday Canva");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [id, toast]);

  const validate = () => {
    const nextErrors = {};
    if (!dob) nextErrors.dob = "Date of birth is required";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const uploadImage = async () => {
    if (!image) return data.imageUrl || "";
    return uploadBirthdayImage(id, image);
  };

  const handleSave = async () => {
    if (!validate()) return;

    setSaving(true);
    try {
      const imageUrl = await uploadImage();
      await updateBirthdayEntry(id, {
        ...data,
        dob,
        imageUrl,
      });
      toast.success("Birthday Canva updated");
    } catch {
      toast.error("Failed to update Birthday Canva");
    } finally {
      setSaving(false);
      setShowConfirm(false);
    }
  };

  if (loading) {
    return <Text variant="muted">Loading...</Text>;
  }

  if (!data) {
    return null;
  }

  return (
    <>
      <Text variant="h1">Edit Birthday Canva</Text>

      <Card className="space-y-6">
        <div className="rounded-xl bg-slate-50 p-4">
          <Text variant="h3">{data.name}</Text>
          <Text variant="muted">Phone: {data.phone}</Text>
          <Text variant="muted">Mentor: {data.mentorName || "-"}</Text>
        </div>

        <FormField label="Date of Birth" required error={errors.dob}>
          <DateInput
            value={dob}
            onChange={(e) => {
              setDob(e.target.value);
              setErrors((prev) => ({ ...prev, dob: null }));
            }}
          />
        </FormField>

        <FormField label="Replace Image">
          <Input
            type="file"
            accept="image/*"
            onChange={(e) => setImage(e.target.files?.[0] || null)}
          />
        </FormField>

        {(image || data.imageUrl) && (
          <div>
            <Text variant="muted">Preview</Text>
            <img
              src={image ? URL.createObjectURL(image) : data.imageUrl}
              className="mt-2 h-32 w-32 rounded-xl object-cover"
              alt="Preview"
            />
          </div>
        )}

        <Button loading={saving} disabled={saving} onClick={() => setShowConfirm(true)}>
          Save Changes
        </Button>
      </Card>

      <ConfirmModal
        open={showConfirm}
        title="Update Birthday Canva"
        description={`Save changes for ${data.name}?`}
        confirmText="Update"
        loading={saving}
        onConfirm={handleSave}
        onClose={() => setShowConfirm(false)}
      />
    </>
  );
}


