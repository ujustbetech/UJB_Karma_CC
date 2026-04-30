"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { updateUserProfile } from "@/services/profileService";

export default function EditHealthInfoSheet({ open, setOpen, user, setUser = null }) {
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setForm({
      CurrentHealthCondition: user?.CurrentHealthCondition || "",
      BloodGroup: user?.BloodGroup || "",
      FitnessLevel: user?.FitnessLevel || "",
      SmokingHabit: user?.SmokingHabit || "",
      AlcoholConsumption: user?.AlcoholConsumption || "",
      HealthParameters: normalize(user?.HealthParameters),
      HealthNotes: normalize(user?.HealthNotes),
      FamilyHistorySummary: normalize(user?.FamilyHistorySummary),
    });
  }, [user]);

  const handleSave = async () => {
    try {
      const userDocId = user?.__docId || user?.id || user?.UJBCode || user?.ujbCode;
      if (!userDocId) throw new Error("User profile document not found");
      setLoading(true);
      await updateUserProfile(form);
      setUser?.((prev) => ({ ...prev, ...form }));
      setOpen(false);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return <BottomSheet title="Edit Health Info" open={open} setOpen={setOpen} loading={loading} onSave={handleSave}>
    <SelectField label="Current Health Condition" value={form.CurrentHealthCondition} onChange={(v) => setForm((p) => ({ ...p, CurrentHealthCondition: v }))} options={["Healthy","Minor Issues","Chronic Condition","Under Treatment"]} />
    <SelectField label="Blood Group" value={form.BloodGroup} onChange={(v) => setForm((p) => ({ ...p, BloodGroup: v }))} options={["A+","A-","B+","B-","AB+","AB-","O+","O-"]} />
    <SelectField label="Fitness Level" value={form.FitnessLevel} onChange={(v) => setForm((p) => ({ ...p, FitnessLevel: v }))} options={["Very Active","Active","Moderate","Sedentary"]} />
    <SelectField label="Smoking Habit" value={form.SmokingHabit} onChange={(v) => setForm((p) => ({ ...p, SmokingHabit: v }))} options={["Non-Smoker","Occasional Smoker","Regular Smoker"]} />
    <SelectField label="Alcohol Consumption" value={form.AlcoholConsumption} onChange={(v) => setForm((p) => ({ ...p, AlcoholConsumption: v }))} options={["Non-Drinker","Occasional","Regular"]} />
    <TagField label="Health Parameters" items={form.HealthParameters || []} onChange={(v) => setForm((p) => ({ ...p, HealthParameters: v }))} />
    <TagField label="Lifestyle Notes" items={form.HealthNotes || []} onChange={(v) => setForm((p) => ({ ...p, HealthNotes: v }))} />
    <TagField label="Family Health History" items={form.FamilyHistorySummary || []} onChange={(v) => setForm((p) => ({ ...p, FamilyHistorySummary: v }))} />
  </BottomSheet>;
}

function normalize(value) {
  return Array.isArray(value) ? value : typeof value === "string" && value ? value.split(",").map((item) => item.trim()).filter(Boolean) : [];
}

function BottomSheet({ title, open, setOpen, children, onSave, loading }) {
  return <>
    <div className={`fixed inset-0 bg-black/40 z-90 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`} onClick={() => setOpen(false)} />
    <div className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-99 max-h-[90vh] flex flex-col transition-transform duration-300 ease-out ${open ? "translate-y-0" : "translate-y-full"}`}>
      <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mt-3 mb-4" />
      <div className="flex justify-between items-center px-6 mb-4"><h3 className="font-semibold text-lg">{title}</h3><button onClick={() => setOpen(false)}><X size={20} /></button></div>
      <div className="overflow-y-auto px-6 pb-28 space-y-5">{children}</div>
      <div className="p-6 border-t bg-white"><button onClick={onSave} disabled={loading} className="w-full bg-orange-500 text-white py-3 rounded-xl font-medium">{loading ? "Saving..." : "Save Changes"}</button></div>
    </div>
  </>;
}

function SelectField({ label, value, onChange, options }) {
  return <div><label className="text-sm text-gray-500">{label}</label><select value={value || ""} onChange={(e) => onChange(e.target.value)} className="w-full mt-2 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"><option value="">Select</option>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></div>;
}

function TagField({ label, items, onChange }) {
  const [value, setValue] = useState("");
  return <div><label className="text-sm text-gray-500">{label}</label><div className="flex gap-2 mt-2"><input value={value} onChange={(e) => setValue(e.target.value)} className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm" /><button type="button" onClick={() => { const next = value.trim(); if (!next || items.includes(next)) return; onChange([...(items || []), next]); setValue(""); }} className="bg-orange-500 text-white px-4 rounded-xl text-sm">Add</button></div><div className="flex flex-wrap gap-2 mt-3">{(items || []).map((item) => <span key={item} onClick={() => onChange((items || []).filter((entry) => entry !== item))} className="px-3 py-1 text-xs rounded-full cursor-pointer bg-orange-100 text-orange-600">{item} ×</span>)}</div></div>;
}


