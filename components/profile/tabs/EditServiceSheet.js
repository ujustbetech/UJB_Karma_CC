"use client";

import { useState, useEffect } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/firebaseConfig";
import { COLLECTIONS } from "@/lib/utility_collection";

export default function EditServiceSheet({
    open,
    setOpen,
    user,
    setUser,
    ujbCode // ✅ from parent
}) {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(false);

    /* -------------------- Load Existing -------------------- */

    useEffect(() => {
        if (!user) return;

        const rawServices = Array.isArray(user?.services)
            ? user.services
            : [];

        const normalized = rawServices.map((service) => ({
            ...service,
            keywords: Array.isArray(service.keywords)
                ? service.keywords
                : typeof service.keywords === "string"
                    ? service.keywords.split(",").map(k => k.trim())
                    : [],
        }));

        setServices(normalized);
    }, [user]);

    /* -------------------- Add Service -------------------- */

    const addService = () => {
        setServices([
            ...services,
            {
                name: "",
                description: "",
                keywords: [],
                imageURL: "",
                agreedValue: {
                    mode: "single",
                    single: {
                        type: "percentage",
                        value: "",
                    },
                },
            },
        ]);
    };

    /* -------------------- Update Service -------------------- */

    const updateService = (index, key, value) => {
        const updated = [...services];
        updated[index][key] = value;
        setServices(updated);
    };

    const updateCommission = (index, key, value) => {
        const updated = [...services];
        updated[index].agreedValue.single[key] = value;
        setServices(updated);
    };

    const removeService = (index) => {
        setServices(services.filter((_, i) => i !== index));
    };

    /* -------------------- Keyword Handling -------------------- */

    const addKeyword = (index, keyword) => {
        const trimmed = keyword.trim();
        if (!trimmed) return;

        const updated = [...services];
        const existing = updated[index].keywords || [];

        if (!existing.includes(trimmed)) {
            updated[index].keywords = [...existing, trimmed];
            setServices(updated);
        }
    };

    const removeKeyword = (index, keyword) => {
        const updated = [...services];
        updated[index].keywords = updated[index].keywords.filter(
            (k) => k !== keyword
        );
        setServices(updated);
    };

    /* -------------------- Image Upload -------------------- */

    const uploadImage = async (e, index) => {
        try {
            const file = e.target.files?.[0];
            if (!file) return;

            // const ujbCode = localStorage.getItem("mmUJBCode");
            const storageRef = ref(
                storage,
                `serviceImages/${ujbCode}/${Date.now()}-${file.name}`
            );

            await uploadBytes(storageRef, file);
            const url = await getDownloadURL(storageRef);

            const updated = [...services];
            updated[index].imageURL = url + "?t=" + Date.now();
            setServices(updated);
        } catch (err) {
            console.error("Image upload failed:", err);
        }
    };

    /* -------------------- Save -------------------- */

    const handleSave = async () => {
        try {
            setLoading(true);
            // const ujbCode = localStorage.getItem("mmUJBCode");

            await updateDoc(
                doc(db, COLLECTIONS.userDetail, ujbCode),
                { services }
            );

            if (typeof setUser === "function") {
                setUser((prev) => ({ ...prev, services }));
            }

            setOpen(false);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    /* -------------------- Animation Safe -------------------- */

    // if (!open) return null;

    return (
        <>
            {/* Overlay */}
            <div
                className={`fixed inset-0 bg-black/40 z-90
    transition-opacity duration-300 backdrop-blur-xs
    ${open ? "opacity-100" : "opacity-0 pointer-events-none"}
  `}
                onClick={() => setOpen(false)}
            />

            {/* Bottom Sheet */}
            <div
                className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-99
    max-h-[90vh] flex flex-col
    transform transition-transform duration-300 ease-out
    ${open ? "translate-y-0" : "translate-y-full"}
  `}
            >
                <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mt-3 mb-4" />

                <div className="flex justify-between items-center px-6 mb-4">
                    <h3 className="font-semibold text-lg">
                        Edit Services
                    </h3>
                    <button onClick={() => setOpen(false)}>
                        <X size={20} />
                    </button>
                </div>

                <div className="overflow-y-auto px-6 pb-28 space-y-6">

                    {(services ?? []).map((service, index) => (
                        <div key={index} className="border rounded-xl  border-slate-300 p-4 space-y-4">

                            {/* Name */}
                            <Input
                                label="Service Name"
                                value={service.name}
                                onChange={(v) => updateService(index, "name", v)}
                            />

                            {/* Description */}
                            <Textarea
                                label="Description"
                                value={service.description}
                                onChange={(v) => updateService(index, "description", v)}
                            />

                            {/* Commission */}
                            <div className="grid grid-cols-2 gap-4">
                                <Select
                                    label="Type"
                                    value={service.agreedValue?.single?.type}
                                    options={["percentage", "fixed"]}
                                    onChange={(v) => updateCommission(index, "type", v)}
                                />

                                <Input
                                    label="Value"
                                    value={service.agreedValue?.single?.value}
                                    onChange={(v) => updateCommission(index, "value", v)}
                                />
                            </div>

                            {/* Image */}
                            <div>
                                <label className="text-sm text-gray-500">
                                    Service Image
                                </label>

                                {service.imageURL && (
                                    <img
                                        src={service.imageURL}
                                        className="w-full h-32 object-cover rounded-lg mt-2"
                                    />
                                )}

                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => uploadImage(e, index)}
                                    className="mt-2 text-sm"
                                />
                            </div>

                            {/* Keywords */}
                            <KeywordInput
                                keywords={service.keywords || []}
                                onAdd={(k) => addKeyword(index, k)}
                                onRemove={(k) => removeKeyword(index, k)}
                            />

                            <button
                                onClick={() => removeService(index)}
                                className="text-red-500 text-sm flex items-center gap-1"
                            >
                                <Trash2 size={14} /> Remove Service
                            </button>
                        </div>
                    ))}

                    <button
                        onClick={addService}
                        className="w-full bg-orange-100 text-orange-600 py-3 rounded-xl text-sm flex items-center justify-center gap-2"
                    >
                        <Plus size={16} /> Add Service
                    </button>

                </div>

                <div className="p-6 border-t bg-white">
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="w-full bg-orange-500 text-white py-3 rounded-xl font-medium"
                    >
                        {loading ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </div>
        </>
    );
}

/* -------------------- Reusable -------------------- */

function Input({ label, value, onChange }) {
    return (
        <div>
            <label className="text-sm text-gray-500">{label}</label>
            <input
                value={value || ""}
                onChange={(e) => onChange(e.target.value)}
                className="w-full mt-2 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500"
            />
        </div>
    );
}

function Textarea({ label, value, onChange }) {
    return (
        <div>
            <label className="text-sm text-gray-500">{label}</label>
            <textarea
                rows={3}
                value={value || ""}
                onChange={(e) => onChange(e.target.value)}
                className="w-full mt-2 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500"
            />
        </div>
    );
}

function Select({ label, value, options, onChange }) {
    return (
        <div>
            <label className="text-sm text-gray-500">{label}</label>
            <select
                value={value || ""}
                onChange={(e) => onChange(e.target.value)}
                className="w-full mt-2 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500"
            >
                {options.map((opt) => (
                    <option key={opt} value={opt}>
                        {opt}
                    </option>
                ))}
            </select>
        </div>
    );
}

function KeywordInput({ keywords, onAdd, onRemove }) {
    const [value, setValue] = useState("");

    return (
        <div>
            <label className="text-sm text-gray-500">
                Keywords
            </label>

            <div className="flex gap-2 mt-2">
                <input
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm"
                />
                <button
                    onClick={() => {
                        onAdd(value);
                        setValue("");
                    }}
                    className="bg-orange-500 text-white px-4 rounded-xl text-sm"
                >
                    Add
                </button>
            </div>

            <div className="flex flex-wrap gap-2 mt-3">
                {(Array.isArray(keywords) ? keywords : []).map((k) => (
                    <span
                        key={k}
                        onClick={() => onRemove(k)}
                        className="px-3 py-1 text-xs bg-gray-200 rounded-full cursor-pointer"
                    >
                        {k} ✕
                    </span>
                ))}
            </div>
        </div>
    );
}