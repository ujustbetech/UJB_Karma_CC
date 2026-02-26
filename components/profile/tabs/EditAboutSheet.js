"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/firebaseConfig";
import { COLLECTIONS } from "@/lib/utility_collection";

export default function EditAboutSheet({
    open,
    setOpen,
    user,
    setUser = null,
    ujbCode // ✅ from parent
}) {
    const [maritalStatus, setMaritalStatus] = useState("");
    const [languages, setLanguages] = useState([]);
    const [skills, setSkills] = useState([]);
    const [fitness, setFitness] = useState("");
    const [smoking, setSmoking] = useState("");
    const [alcohol, setAlcohol] = useState("");
    const [newSkill, setNewSkill] = useState("");
    const [newLanguage, setNewLanguage] = useState("");
    const [loading, setLoading] = useState(false);

    const [hobbies, setHobbies] = useState([]);
    const [newHobby, setNewHobby] = useState("");
    // Add below existing states
    const [interests, setInterests] = useState([]);

    const [currentHealth, setCurrentHealth] = useState("");
    const [bloodGroup, setBloodGroup] = useState("");
    const [aspirations, setAspirations] = useState("");
    const [socialContribution, setSocialContribution] = useState("");

    useEffect(() => {
        if (user) {
            setMaritalStatus(user.MaritalStatus || "");
            setLanguages(Array.isArray(user.LanguagesKnown) ? user.LanguagesKnown : []);
            setSkills(Array.isArray(user.Skills) ? user.Skills : []);
            setFitness(user.FitnessLevel || "");
            setSmoking(user.SmokingHabit || "");
            setAlcohol(user.AlcoholConsumption || "");

            // Missing fields
            setHobbies(Array.isArray(user.Hobbies) ? user.Hobbies : []);
            setCurrentHealth(user.CurrentHealthCondition || "");
            setBloodGroup(user.BloodGroup || "");
            setAspirations(user.Aspirations === "—" ? "" : user.Aspirations || "");
            setHobbies(Array.isArray(user.Hobbies) ? user.Hobbies : []);
            setInterests(Array.isArray(user.InterestArea) ? user.InterestArea : []);
            setSocialContribution(
                user.SpecialSocialContribution === "—"
                    ? ""
                    : user.SpecialSocialContribution || ""
            );
        }
    }, [user]);

    const maritalOptions = ["Single", "Married"];
    const fitnessOptions = ["Active", "Moderate", "Inactive"];
    const smokingOptions = ["Non-Smoker", "Occasional", "Regular"];
    const alcoholOptions = ["Non-Drinker", "Occasional", "Regular"];

    const addItem = (value, list, setter, inputSetter) => {
        const trimmed = value.trim();
        if (!trimmed || list.includes(trimmed)) return;
        setter([...list, trimmed]);
        inputSetter("");
    };

    const handleSave = async () => {
        try {
            if (!ujbCode) return;

            setLoading(true);

            const updatedData = {
                MaritalStatus: maritalStatus,
                LanguagesKnown: languages,
                Skills: skills,
                FitnessLevel: fitness,
                SmokingHabit: smoking,
                AlcoholConsumption: alcohol,

                Hobbies: hobbies,
                CurrentHealthCondition: currentHealth,
                BloodGroup: bloodGroup,
                Aspirations: aspirations,
                SpecialSocialContribution: socialContribution,
                InterestArea: interests,
            };

            await updateDoc(
                doc(db, COLLECTIONS.userDetail, ujbCode), // ✅ use prop
                updatedData
            );

            if (typeof setUser === "function") {
                setUser((prev) => ({
                    ...prev,
                    ...updatedData,
                }));
            }

            setOpen(false);

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Overlay */}
            <div
                className={`fixed inset-0 bg-black/40 z-90 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0 pointer-events-none"
                    }`}
                onClick={() => setOpen(false)}
            />

            {/* Bottom Sheet */}
            <div
                className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-99
        max-h-[90vh] flex flex-col
        transition-transform duration-300 ease-out
        ${open ? "translate-y-0" : "translate-y-full"}`}
            >
                {/* Drag Handle */}
                <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mt-3 mb-4" />

                {/* Header */}
                <div className="flex justify-between items-center px-6 mb-4">
                    <h3 className="font-semibold text-lg">
                        Edit About Info
                    </h3>
                    <button onClick={() => setOpen(false)}>
                        <X size={20} />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="overflow-y-auto px-6 pb-28 space-y-5">

                    {/* Marital */}
                    <FieldLabel text="Marital Status" />
                    <SelectInput
                        value={maritalStatus}
                        onChange={setMaritalStatus}
                        options={maritalOptions}
                    />

                    {/* Languages */}
                    <FieldLabel text="Languages" />
                    <TagInput
                        value={newLanguage}
                        setValue={setNewLanguage}
                        placeholder="Add language"
                        onAdd={() =>
                            addItem(newLanguage, languages, setLanguages, setNewLanguage)
                        }
                    />
                    <TagList
                        items={languages}
                        onRemove={(item) =>
                            setLanguages(languages.filter((l) => l !== item))
                        }
                        style="orange"
                    />

                    {/* Skills */}
                    <FieldLabel text="Skills" />
                    <TagInput
                        value={newSkill}
                        setValue={setNewSkill}
                        placeholder="Add skill"
                        onAdd={() =>
                            addItem(newSkill, skills, setSkills, setNewSkill)
                        }
                    />
                    <TagList
                        items={skills}
                        onRemove={(item) =>
                            setSkills(skills.filter((s) => s !== item))
                        }
                        style="gray"
                    />

                    {/* Fitness */}
                    <FieldLabel text="Fitness Level" />
                    <SelectInput
                        value={fitness}
                        onChange={setFitness}
                        options={fitnessOptions}
                    />

                    <TextBox
                        label="Current Health Condition"
                        value={currentHealth}
                        onChange={setCurrentHealth}
                    />

                    <TextBox
                        label="Blood Group"
                        value={bloodGroup}
                        onChange={setBloodGroup}
                    />

                    <TextAreaBox
                        label="Aspirations"
                        value={aspirations}
                        onChange={setAspirations}
                    />

                    <TextAreaBox
                        label="Social Contribution"
                        value={socialContribution}
                        onChange={setSocialContribution}
                    />

                    {/* Smoking */}
                    <FieldLabel text="Smoking Habit" />
                    <SelectInput
                        value={smoking}
                        onChange={setSmoking}
                        options={smokingOptions}
                    />

                    {/* Alcohol */}
                    <FieldLabel text="Alcohol Consumption" />
                    <SelectInput
                        value={alcohol}
                        onChange={setAlcohol}
                        options={alcoholOptions}
                    />

                    <TagField
                        label="Hobbies"
                        items={hobbies}
                        setItems={setHobbies}
                        placeholder="Add hobby"
                        style="orange"
                    />

                    <TagField
                        label="Interest Area"
                        items={interests}
                        setItems={setInterests}
                        placeholder="Add interest"
                        style="gray"
                    />
                </div>

                {/* Sticky Footer */}
                <div className="p-6 border-t bg-white">
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="w-full bg-orange-500 text-white py-3 rounded-xl font-medium active:scale-95 transition disabled:opacity-60"
                    >
                        {loading ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </div>
        </>
    );
}

/* ---------------- Components ---------------- */

function FieldLabel({ text }) {
    return (
        <label className="text-sm text-gray-500">
            {text}
        </label>
    );
}

function SelectInput({ value, onChange, options }) {
    return (
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full mt-2 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
            <option value="">Select</option>
            {options.map((opt) => (
                <option key={opt} value={opt}>
                    {opt}
                </option>
            ))}
        </select>
    );
}

function TagInput({ value, setValue, placeholder, onAdd }) {
    return (
        <div className="flex mt-2 gap-2">
            <input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={placeholder}
                className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <button
                type="button"
                onClick={onAdd}
                className="bg-orange-500 text-white px-4 rounded-xl text-sm active:scale-95 transition"
            >
                Add
            </button>
        </div>
    );
}

function TagList({ items, onRemove, style }) {
    const base =
        style === "orange"
            ? "bg-orange-100 text-orange-600"
            : "bg-gray-200 text-gray-700";

    return (
        <div className="flex flex-wrap gap-2 mt-3">
            {items.map((item) => (
                <span
                    key={item}
                    onClick={() => onRemove(item)}
                    className={`px-3 py-1 text-xs rounded-full cursor-pointer ${base}`}
                >
                    {item} ✕
                </span>
            ))}
        </div>
    );
}

function TagField({
    label,
    items,
    setItems,
    placeholder = "Add item",
    style = "orange",
}) {
    const [input, setInput] = useState("");

    const addItem = () => {
        const trimmed = input.trim();
        if (!trimmed || items.includes(trimmed)) return;
        setItems([...items, trimmed]);
        setInput("");
    };

    const removeItem = (item) => {
        setItems(items.filter((i) => i !== item));
    };

    const base =
        style === "orange"
            ? "bg-orange-100 text-orange-600"
            : "bg-gray-200 text-gray-700";

    return (
        <div className="mt-6">
            <label className="text-sm text-gray-500">
                {label}
            </label>

            <div className="flex mt-2 gap-2">
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={placeholder}
                    className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <button
                    type="button"
                    onClick={addItem}
                    className="bg-orange-500 text-white px-4 rounded-xl text-sm active:scale-95 transition"
                >
                    Add
                </button>
            </div>

            <div className="flex flex-wrap gap-2 mt-3">
                {items.map((item) => (
                    <span
                        key={item}
                        onClick={() => removeItem(item)}
                        className={`px-3 py-1 text-xs rounded-full cursor-pointer ${base}`}
                    >
                        {item} ✕
                    </span>
                ))}
            </div>
        </div>
    );
}

function TextBox({
    label,
    value,
    onChange,
    placeholder = "",
    type = "text",
    className = "",
}) {
    return (
        <div className="mt-2">
            {label && (
                <label className="text-sm text-gray-500">
                    {label}
                </label>
            )}

            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className={`w-full mt-2 border border-gray-300 rounded-xl px-3 py-2 text-sm 
        focus:outline-none focus:ring-2 focus:ring-orange-500 
        ${className}`}
            />
        </div>
    );
}


function TextAreaBox({
    label,
    value,
    onChange,
    placeholder = "",
    rows = 3,
    className = "",
}) {
    return (
        <div className="mt-2">
            {label && (
                <label className="text-sm text-gray-500">
                    {label}
                </label>
            )}

            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                rows={rows}
                className={`w-full mt-2 border border-gray-300 rounded-xl px-3 py-2 text-sm 
        focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none
        ${className}`}
            />
        </div>
    );
}