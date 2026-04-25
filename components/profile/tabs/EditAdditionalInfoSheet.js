"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db } from "@/lib/firebase/firebaseClient";
import { COLLECTIONS } from "@/lib/utility_collection";

export default function EditAdditionalInfoSheet({ open, setOpen, user, setUser = null, ujbCode }) {
  const [form, setForm] = useState({});
  const [certificateFiles, setCertificateFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setForm({
      Aspirations: user?.Aspirations || "",
      ImmediateDesire: user?.ImmediateDesire || "",
      Mastery: normalize(user?.Mastery),
      ExclusiveKnowledge: normalize(user?.ExclusiveKnowledge),
      Hobbies: normalize(user?.Hobbies),
      InterestArea: normalize(user?.InterestArea),
      achievementCertificates: Array.isArray(user?.achievementCertificates)
        ? user.achievementCertificates
        : [],
    });
  }, [user]);

  const handleSave = async () => {
    try {
      const userDocId = user?.__docId;
      if (!userDocId) throw new Error("User profile document not found");
      setLoading(true);

      let nextCertificates = [...(form.achievementCertificates || [])];
      if (certificateFiles.length > 0) {
        const storage = getStorage();
        for (const file of certificateFiles) {
          const storageRef = ref(storage, `userProfile/${ujbCode}/achievements/${Date.now()}-${file.name}`);
          await uploadBytes(storageRef, file);
          const url = await getDownloadURL(storageRef);
          nextCertificates.push({ fileName: file.name, url });
        }
      }

      const payload = { ...form, achievementCertificates: nextCertificates };
      await updateDoc(doc(db, COLLECTIONS.userDetail, userDocId), payload);
      setUser?.((prev) => ({ ...prev, ...payload }));
      setOpen(false);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return <BottomSheet title="Edit Additional Info" open={open} setOpen={setOpen} loading={loading} onSave={handleSave}>
    <TextAreaField label="Aspirations" value={form.Aspirations} onChange={(v) => setForm((p) => ({ ...p, Aspirations: v }))} />
    <TextAreaField label="Immediate Desire" value={form.ImmediateDesire} onChange={(v) => setForm((p) => ({ ...p, ImmediateDesire: v }))} />
    <TagField label="Mastery" items={form.Mastery || []} onChange={(v) => setForm((p) => ({ ...p, Mastery: v }))} />
    <TagField label="Exclusive Knowledge" items={form.ExclusiveKnowledge || []} onChange={(v) => setForm((p) => ({ ...p, ExclusiveKnowledge: v }))} />
    <TagField label="Hobbies" items={form.Hobbies || []} onChange={(v) => setForm((p) => ({ ...p, Hobbies: v }))} />
    <TagField label="Interest Areas" items={form.InterestArea || []} onChange={(v) => setForm((p) => ({ ...p, InterestArea: v }))} />
    <div><label className="text-sm text-gray-500">Upload Certificates / Awards</label><input type="file" multiple accept=".pdf,image/*" onChange={(e) => setCertificateFiles(Array.from(e.target.files || []))} className="w-full mt-2 border border-gray-300 rounded-xl px-3 py-2 text-sm" /></div>
  </BottomSheet>;
}

function normalize(value) { return Array.isArray(value) ? value : typeof value === "string" && value ? value.split(",").map((item) => item.trim()).filter(Boolean) : []; }
function BottomSheet({ title, open, setOpen, children, onSave, loading }) { return <><div className={`fixed inset-0 bg-black/40 z-90 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`} onClick={() => setOpen(false)} /><div className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-99 max-h-[90vh] flex flex-col transition-transform duration-300 ease-out ${open ? "translate-y-0" : "translate-y-full"}`}><div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mt-3 mb-4" /><div className="flex justify-between items-center px-6 mb-4"><h3 className="font-semibold text-lg">{title}</h3><button onClick={() => setOpen(false)}><X size={20} /></button></div><div className="overflow-y-auto px-6 pb-28 space-y-5">{children}</div><div className="p-6 border-t bg-white"><button onClick={onSave} disabled={loading} className="w-full bg-orange-500 text-white py-3 rounded-xl font-medium">{loading ? "Saving..." : "Save Changes"}</button></div></div></>; }
function TextAreaField({ label, value, onChange }) { return <div><label className="text-sm text-gray-500">{label}</label><textarea rows={3} value={value || ""} onChange={(e) => onChange(e.target.value)} className="w-full mt-2 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" /></div>; }
function TagField({ label, items, onChange }) { const [value, setValue] = useState(""); return <div><label className="text-sm text-gray-500">{label}</label><div className="flex gap-2 mt-2"><input value={value} onChange={(e) => setValue(e.target.value)} className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm" /><button type="button" onClick={() => { const next = value.trim(); if (!next || items.includes(next)) return; onChange([...(items || []), next]); setValue(""); }} className="bg-orange-500 text-white px-4 rounded-xl text-sm">Add</button></div><div className="flex flex-wrap gap-2 mt-3">{(items || []).map((item) => <span key={item} onClick={() => onChange((items || []).filter((entry) => entry !== item))} className="px-3 py-1 text-xs rounded-full cursor-pointer bg-orange-100 text-orange-600">{item} ×</span>)}</div></div>; }
