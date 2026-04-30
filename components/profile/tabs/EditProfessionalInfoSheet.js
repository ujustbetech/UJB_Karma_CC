"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { updateUserProfile } from "@/services/profileService";

export default function EditProfessionalInfoSheet({ open, setOpen, user, setUser = null }) {
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setForm({
      ProfessionType: user?.ProfessionType || "",
      BusinessHistory: user?.BusinessHistory || "",
      USP: user?.USP || "",
      AreaOfServices: normalize(user?.AreaOfServices),
      ClienteleBase: user?.ClienteleBase || "",
      TagLine: user?.TagLine || "",
      Aspirations: normalize(user?.Aspirations),
      ImmediateDesire: normalize(user?.ImmediateDesire),
      Mastery: normalize(user?.Mastery),
      CompanyName: user?.CompanyName || "",
      JobTitle: user?.JobTitle || "",
      Department: user?.Department || "",
      Industry: user?.Industry || "",
      ExperienceYears: user?.ExperienceYears || "",
      Skills: normalize(user?.Skills),
      Expertise: normalize(user?.Expertise),
      CareerAspirations: normalize(user?.CareerAspirations),
      FreelanceServices: normalize(user?.FreelanceServices),
      Platforms: normalize(user?.Platforms),
      PortfolioURL: user?.PortfolioURL || "",
      FreelanceExperience: user?.FreelanceExperience || "",
      CollegeName: user?.CollegeName || "",
      Course: user?.Course || "",
      Specialization: user?.Specialization || "",
      CareerInterests: normalize(user?.CareerInterests),
      PrimaryRole: user?.PrimaryRole || "",
      FamilyType: user?.FamilyType || "",
      ContributionAreainUJustBe: normalize(user?.ContributionAreainUJustBe),
      PreviousProfession: user?.PreviousProfession || "",
      PreviousIndustry: user?.PreviousIndustry || "",
      LastOrganization: user?.LastOrganization || "",
      TotalExperience: user?.TotalExperience || "",
      MentorshipInterest: user?.MentorshipInterest || "",
      SupportAreas: normalize(user?.SupportAreas),
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

  return <BottomSheet title="Edit Professional Info" open={open} setOpen={setOpen} loading={loading} onSave={handleSave}>
    <InputField label="Profession Type" value={form.ProfessionType} onChange={(v) => setForm((p) => ({ ...p, ProfessionType: v }))} />
    <InputField label="Company / Business Name" value={form.CompanyName || form.BusinessName || ""} onChange={(v) => setForm((p) => ({ ...p, CompanyName: v }))} />
    <InputField label="Job Title / Role" value={form.JobTitle || form.PrimaryRole || form.PreviousProfession || ""} onChange={(v) => setForm((p) => ({ ...p, JobTitle: v }))} />
    <InputField label="Industry" value={form.Industry || form.PreviousIndustry || ""} onChange={(v) => setForm((p) => ({ ...p, Industry: v }))} />
    <InputField label="Experience Years" value={form.ExperienceYears || form.TotalExperience || form.FreelanceExperience || ""} onChange={(v) => setForm((p) => ({ ...p, ExperienceYears: v }))} />
    <TagField label="Skills" items={form.Skills || []} onChange={(v) => setForm((p) => ({ ...p, Skills: v }))} />
    <TagField label="Expertise" items={form.Expertise || []} onChange={(v) => setForm((p) => ({ ...p, Expertise: v }))} />
    <TagField label="Career Aspirations" items={form.CareerAspirations || form.CareerInterests || []} onChange={(v) => setForm((p) => ({ ...p, CareerAspirations: v }))} />
    <TagField label="Support Areas" items={form.SupportAreas || []} onChange={(v) => setForm((p) => ({ ...p, SupportAreas: v }))} />
  </BottomSheet>;
}

function normalize(value) { return Array.isArray(value) ? value : typeof value === "string" && value ? value.split(",").map((item) => item.trim()).filter(Boolean) : []; }
function BottomSheet({ title, open, setOpen, children, onSave, loading }) { return <><div className={`fixed inset-0 bg-black/40 z-90 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`} onClick={() => setOpen(false)} /><div className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-99 max-h-[90vh] flex flex-col transition-transform duration-300 ease-out ${open ? "translate-y-0" : "translate-y-full"}`}><div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mt-3 mb-4" /><div className="flex justify-between items-center px-6 mb-4"><h3 className="font-semibold text-lg">{title}</h3><button onClick={() => setOpen(false)}><X size={20} /></button></div><div className="overflow-y-auto px-6 pb-28 space-y-5">{children}</div><div className="p-6 border-t bg-white"><button onClick={onSave} disabled={loading} className="w-full bg-orange-500 text-white py-3 rounded-xl font-medium">{loading ? "Saving..." : "Save Changes"}</button></div></div></>; }
function InputField({ label, value, onChange }) { return <div><label className="text-sm text-gray-500">{label}</label><input value={value || ""} onChange={(e) => onChange(e.target.value)} className="w-full mt-2 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" /></div>; }
function TagField({ label, items, onChange }) { const [value, setValue] = useState(""); return <div><label className="text-sm text-gray-500">{label}</label><div className="flex gap-2 mt-2"><input value={value} onChange={(e) => setValue(e.target.value)} className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm" /><button type="button" onClick={() => { const next = value.trim(); if (!next || items.includes(next)) return; onChange([...(items || []), next]); setValue(""); }} className="bg-orange-500 text-white px-4 rounded-xl text-sm">Add</button></div><div className="flex flex-wrap gap-2 mt-3">{(items || []).map((item) => <span key={item} onClick={() => onChange((items || []).filter((entry) => entry !== item))} className="px-3 py-1 text-xs rounded-full cursor-pointer bg-orange-100 text-orange-600">{item} ×</span>)}</div></div>; }


