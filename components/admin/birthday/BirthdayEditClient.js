"use client";

import { useEffect, useState } from "react";
import {
    doc,
    getDoc,
    setDoc,
    serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

import { db, storage } from "@/firebaseConfig";
import { COLLECTIONS } from "@/lib/utility_collection";

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

    /* ---------------- STATE ---------------- */

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const [data, setData] = useState(null);
    const [dob, setDob] = useState("");
    const [image, setImage] = useState(null);

    const [errors, setErrors] = useState({});

    /* ---------------- LOAD DATA ---------------- */

    useEffect(() => {
        let isMounted = true;

        async function load() {
            try {
                const snap = await getDoc(
                    doc(db, COLLECTIONS.birthdayCanva, id)
                );

                if (!snap.exists()) {
                    toast.error("Birthday record not found");
                    return;
                }

                if (!isMounted) return;

                const d = snap.data();
                setData(d);
                setDob(d.dob || "");
            } catch (err) {
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
    }, [id]); // ✅ ALWAYS exactly one dependency



    /* ---------------- VALIDATION ---------------- */

    const validate = () => {
        const e = {};
        if (!dob) e.dob = "Date of birth is required";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    /* ---------------- IMAGE UPLOAD ---------------- */

    const uploadImage = async () => {
        if (!image) return data.imageUrl || "";

        const imageRef = ref(
            storage,
            `birthdayImages/${id}/${Date.now()}`
        );

        await uploadBytes(imageRef, image);
        return await getDownloadURL(imageRef);
    };

    /* ---------------- SAVE ---------------- */

    const handleSave = async () => {
        if (!validate()) return;

        setSaving(true);
        try {
            const imageUrl = await uploadImage();

            await setDoc(
                doc(db, COLLECTIONS.birthdayCanva, id),
                {
                    ...data,
                    dob,
                    dobTimestamp: new Date(dob),
                    imageUrl,
                    updatedAt: serverTimestamp(),
                },
                { merge: true }
            );

            toast.success("Birthday Canva updated");
        } catch {
            toast.error("Failed to update Birthday Canva");
        } finally {
            setSaving(false);
            setShowConfirm(false);
        }
    };

    /* ---------------- UI ---------------- */

    if (loading) {
        return <Text variant="muted">Loading…</Text>;
    }

    if (!data) {
        return null;
    }

    return (
        <>
            <Text variant="h1">Edit Birthday Canva</Text>

            <Card className="space-y-6">
                {/* USER INFO (READ-ONLY) */}
                <div className="rounded-xl bg-slate-50 p-4">
                    <Text variant="h3">{data.name}</Text>
                    <Text variant="muted">Phone: {data.phone}</Text>
                    <Text variant="muted">
                        Mentor: {data.mentorName || "—"}
                    </Text>
                </div>

                {/* DOB */}
                <FormField label="Date of Birth" required error={errors.dob}>
                    <DateInput
                        value={dob}
                        onChange={(e) => {
                            setDob(e.target.value);
                            setErrors((p) => ({ ...p, dob: null }));
                        }}
                    />
                </FormField>

                {/* IMAGE */}
                <FormField label="Replace Image">
                    <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                            setImage(e.target.files?.[0] || null)
                        }
                    />
                </FormField>

                {/* PREVIEW */}
                {(image || data.imageUrl) && (
                    <div>
                        <Text variant="muted">Preview</Text>
                        <img
                            src={
                                image
                                    ? URL.createObjectURL(image)
                                    : data.imageUrl
                            }
                            className="mt-2 h-32 w-32 rounded-xl object-cover"
                            alt="Preview"
                        />
                    </div>
                )}

                {/* ACTION */}
                <Button
                    loading={saving}
                    disabled={saving}
                    onClick={() => setShowConfirm(true)}
                >
                    Save Changes
                </Button>
            </Card>

            {/* CONFIRM */}
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
