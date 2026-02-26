"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
import {
    ref,
    uploadBytes,
    getDownloadURL,
} from "firebase/storage";
import { db, storage } from "@/firebaseConfig";
import { COLLECTIONS } from "@/lib/utility_collection";


export default function EditBusinessSheet({
    open,
    setOpen,
    user,
    setUser = null,
    ujbCode // ✅ from parent
}) {
    const [form, setForm] = useState({
        AreaOfServices: [],
        BusinessSocialMediaPages: [],
    });
    const [loading, setLoading] = useState(false);
    const [newArea, setNewArea] = useState("");
    const [uploadingLogo, setUploadingLogo] = useState(false);

    useEffect(() => {
        if (!user) return;

        setForm({
            BusinessLogo: user.BusinessLogo || "",
            BusinessName: user.BusinessName || "",
            BusinessStage: user.BusinessStage || "",
            BusinessDetails: user.BusinessDetails || "",
            EstablishedAt: user.EstablishedAt || "",
            TagLine: user.TagLine || "",
            USP: user.USP || "",
            ClienteleBase: user.ClienteleBase || "",
            BusinessHistory: user.BusinessHistory || "",
            NoteworthyAchievements:
                user.NoteworthyAchievements || "",
            Category: user.Category || "",
            Category1: user.Category1 || "",
            Category2: user.Category2 || "",
            keyCategory: user.keyCategory || "",
            Website: user.Website || "",
            BusinessEmailID: user.BusinessEmailID || "",
            Location: user.Location || "",
            Locality: user.Locality || "",
            City: user.City || "",
            State: user.State || "",
            Pincode: user.Pincode || "",
            AreaOfServices: Array.isArray(user.AreaOfServices)
                ? user.AreaOfServices
                : [],
            BusinessSocialMediaPages: Array.isArray(
                user.BusinessSocialMediaPages
            )
                ? user.BusinessSocialMediaPages
                : [],
        });
    }, [user]);

    // if (!open) return null;

    const handleChange = (key, value) =>
        setForm((prev) => ({ ...prev, [key]: value }));

    /* -------------------- Logo Upload -------------------- */

    const handleLogoUpload = async (e) => {
        try {
            const file = e.target.files?.[0];
            if (!file || !ujbCode) return;

            setUploadingLogo(true);

            const fileRef = ref(
                storage,
                `businessLogos/${ujbCode}/${Date.now()}-${file.name}`
            );

            await uploadBytes(fileRef, file);
            const downloadURL = await getDownloadURL(fileRef);

            const freshURL = downloadURL + "?t=" + Date.now();

            setForm((prev) => ({
                ...prev,
                BusinessLogo: freshURL,
            }));

            if (typeof setUser === "function") {
                setUser((prev) => ({
                    ...prev,
                    BusinessLogo: freshURL,
                }));
            }

        } catch (err) {
            console.error("Upload failed:", err);
        } finally {
            setUploadingLogo(false);
        }
    };

    /* -------------------- Area Of Services -------------------- */

    const addArea = () => {
        const trimmed = newArea.trim();
        if (!trimmed || form.AreaOfServices.includes(trimmed))
            return;

        handleChange("AreaOfServices", [
            ...form.AreaOfServices,
            trimmed,
        ]);
        setNewArea("");
    };

    const removeArea = (area) => {
        handleChange(
            "AreaOfServices",
            form.AreaOfServices.filter((a) => a !== area)
        );
    };

    /* -------------------- Social Media -------------------- */

    const addSocial = () => {
        handleChange("BusinessSocialMediaPages", [
            ...form.BusinessSocialMediaPages,
            { platform: "", url: "" },
        ]);
    };

    const updateSocial = (index, key, value) => {
        const updated = [...form.BusinessSocialMediaPages];
        updated[index][key] = value;
        handleChange("BusinessSocialMediaPages", updated);
    };

    const removeSocial = (index) => {
        handleChange(
            "BusinessSocialMediaPages",
            form.BusinessSocialMediaPages.filter(
                (_, i) => i !== index
            )
        );
    };

    /* -------------------- Save -------------------- */

    const handleSave = async () => {
        try {
            setLoading(true);
            // const ujbCode = localStorage.getItem("mmUJBCode");

            await updateDoc(
                doc(db, COLLECTIONS.userDetail, ujbCode),
                form
            );

            if (typeof setUser === "function") {
                setUser((prev) => ({ ...prev, ...form }));
            }

            setOpen(false);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    /* ===================================================== */

    return (
        <>
            {/* Overlay */}
            <div
                className={`fixed inset-0 bg-black/40 z-90
    transition-opacity duration-300
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
                        Edit Business Information
                    </h3>
                    <button onClick={() => setOpen(false)}>
                        <X size={20} />
                    </button>
                </div>

                <div className="overflow-y-auto px-6 pb-28 space-y-8">

                    {/* ================= IDENTITY ================= */}
                    <SectionTitle title="Identity" />

                    <label className="text-sm text-gray-500">
                        Business Logo
                    </label>

                    <div className="flex items-center gap-4 mt-2">
                        <div className="relative">
                            {form.BusinessLogo ? (
                                <img
                                    src={form.BusinessLogo}
                                    alt="Business Logo"
                                    className="w-20 h-20 rounded-xl object-cover border"
                                />
                            ) : (
                                <div className="w-20 h-20 rounded-xl border flex items-center justify-center text-xs text-gray-400">
                                    No Logo
                                </div>
                            )}

                            {uploadingLogo && (
                                <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center text-white text-xs">
                                    Uploading...
                                </div>
                            )}
                        </div>

                        <label className="bg-orange-500 text-white px-4 py-2 rounded-xl text-sm cursor-pointer active:scale-95 transition">
                            {form.BusinessLogo ? "Replace" : "Upload"}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleLogoUpload}
                                className="hidden"
                            />
                        </label>
                    </div>

                    <Input label="Business Name" value={form.BusinessName} onChange={(v) => handleChange("BusinessName", v)} />
                    <Input label="Stage" value={form.BusinessStage} onChange={(v) => handleChange("BusinessStage", v)} />
                    <Input label="Business Type" value={form.BusinessDetails} onChange={(v) => handleChange("BusinessDetails", v)} />
                    <Input label="Established At" value={form.EstablishedAt} onChange={(v) => handleChange("EstablishedAt", v)} />

                    {/* ================= BRAND ================= */}
                    <SectionTitle title="Brand" />

                    <Textarea label="Tagline" value={form.TagLine} onChange={(v) => handleChange("TagLine", v)} />
                    <Textarea label="USP" value={form.USP} onChange={(v) => handleChange("USP", v)} />
                    <Textarea label="Clientele Base" value={form.ClienteleBase} onChange={(v) => handleChange("ClienteleBase", v)} />
                    <Textarea label="Business History" value={form.BusinessHistory} onChange={(v) => handleChange("BusinessHistory", v)} />
                    <Textarea label="Achievements" value={form.NoteworthyAchievements} onChange={(v) => handleChange("NoteworthyAchievements", v)} />

                    {/* ================= CATEGORIES ================= */}
                    <SectionTitle title="Categories" />

                    <Input label="Primary Category" value={form.Category} onChange={(v) => handleChange("Category", v)} />
                    <Input label="Category 1" value={form.Category1} onChange={(v) => handleChange("Category1", v)} />
                    <Input label="Category 2" value={form.Category2} onChange={(v) => handleChange("Category2", v)} />
                    <Input label="Key Category" value={form.keyCategory} onChange={(v) => handleChange("keyCategory", v)} />

                    {/* ================= MARKET ================= */}
                    <SectionTitle title="Market Presence" />

                    <Input label="Website" value={form.Website} onChange={(v) => handleChange("Website", v)} />
                    <Input label="Business Email" value={form.BusinessEmailID} onChange={(v) => handleChange("BusinessEmailID", v)} />

                    {/* Areas */}
                    <label className="text-sm text-gray-500">
                        Areas of Services
                    </label>
                    <div className="flex gap-2 mt-2">
                        <input
                            value={newArea}
                            onChange={(e) => setNewArea(e.target.value)}
                            className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500"
                        />
                        <button
                            onClick={addArea}
                            className="bg-orange-500 text-white px-4 rounded-xl text-sm"
                        >
                            Add
                        </button>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-3">
                        {(form.AreaOfServices ?? []).map((area) => (
                            <span
                                key={area}
                                onClick={() => removeArea(area)}
                                className="px-3 py-1 text-xs bg-orange-100 text-orange-600 rounded-full cursor-pointer"
                            >
                                {area} ✕
                            </span>
                        ))}
                    </div>

                    {/* Social Media */}
                    <label className="text-sm text-gray-500 mt-4 block">
                        Social Media
                    </label>

                    <div className="space-y-3 mt-2">
                        {(form.BusinessSocialMediaPages ?? []).map((item, index) => (
                            <div key={index} className="flex gap-2">
                                <input
                                    placeholder="Platform"
                                    value={item.platform}
                                    onChange={(e) => updateSocial(index, "platform", e.target.value)}
                                    className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm"
                                />
                                <input
                                    placeholder="URL"
                                    value={item.url}
                                    onChange={(e) => updateSocial(index, "url", e.target.value)}
                                    className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm"
                                />
                                <button
                                    onClick={() => removeSocial(index)}
                                    className="text-red-500 text-xs"
                                >
                                    Remove
                                </button>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={addSocial}
                        className="mt-3 bg-orange-500 text-white px-4 py-2 rounded-xl text-sm"
                    >
                        + Add Social Link
                    </button>

                    {/* ================= LOCATION ================= */}
                    <SectionTitle title="Location" />

                    <Textarea label="Full Address" value={form.Location} onChange={(v) => handleChange("Location", v)} />

                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Locality" value={form.Locality} onChange={(v) => handleChange("Locality", v)} />
                        <Input label="City" value={form.City} onChange={(v) => handleChange("City", v)} />
                        <Input label="State" value={form.State} onChange={(v) => handleChange("State", v)} />
                        <Input label="Pincode" value={form.Pincode} onChange={(v) => handleChange("Pincode", v)} />
                    </div>

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

/* ===================== REUSABLE ===================== */

function SectionTitle({ title }) {
    return (
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            {title}
        </h4>
    );
}

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