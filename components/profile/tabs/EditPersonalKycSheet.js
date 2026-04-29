"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { updateUserProfile } from "@/services/profileService";
import { getStorage, ref, uploadBytes, getDownloadURL } from "@/services/profileAssetStorageService";

const PERSONAL_KYC_FIELDS = [
  { key: "panCard", label: "Upload PAN Card" },
  { key: "aadhaarFront", label: "Upload Aadhaar Front" },
  { key: "aadhaarBack", label: "Upload Aadhaar Back" },
  { key: "addressProof", label: "Upload Address Proof" },
];

export default function EditPersonalKycSheet({
  open,
  setOpen,
  user,
  setUser = null,
  ujbCode,
}) {
  const [panNumber, setPanNumber] = useState("");
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [files, setFiles] = useState({});
  const [preview, setPreview] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;

    setPanNumber(user.panNumber || user.IDNumber || "");
    setAadhaarNumber(user.aadhaarNumber || "");
    setPreview(user.personalKYC || {});
  }, [user]);

  const handleFileChange = (key, file) => {
    if (!file) return;

    setFiles((prev) => ({ ...prev, [key]: file }));
  };

  const handleSave = async () => {
    try {
      const userDocId = user?.__docId;
      if (!userDocId) throw new Error("User profile document not found");

      setLoading(true);

      const storage = getStorage();
      const nextPersonalKyc = { ...(user.personalKYC || {}) };

      for (const field of PERSONAL_KYC_FIELDS) {
        const file = files[field.key];

        if (!file) continue;

        const storageRef = ref(
          storage,
          `userProfile/${ujbCode}/personalKYC/${field.key}-${Date.now()}-${file.name}`
        );

        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);

        nextPersonalKyc[field.key] = {
          url,
          fileName: file.name,
        };
      }

      const payload = {
        panNumber,
        aadhaarNumber,
        personalKYC: nextPersonalKyc,
      };

      await updateUserProfile(payload);

      if (typeof setUser === "function") {
        setUser((prev) => ({
          ...prev,
          ...payload,
        }));
      }

      setOpen(false);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/40 z-90 transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setOpen(false)}
      />

      <div
        className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-99 max-h-[90vh] flex flex-col transition-transform duration-300 ease-out ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mt-3 mb-4" />
        <div className="flex justify-between items-center px-6 mb-4">
          <h3 className="font-semibold text-lg">Edit Personal KYC</h3>
          <button onClick={() => setOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto px-6 pb-28 space-y-5">
          <InputField label="PAN Number" value={panNumber} onChange={setPanNumber} />
          <InputField label="Aadhaar Number" value={aadhaarNumber} onChange={setAadhaarNumber} />

          {PERSONAL_KYC_FIELDS.map((field) => (
            <div key={field.key}>
              <label className="text-sm text-gray-500">{field.label}</label>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => handleFileChange(field.key, e.target.files?.[0])}
                className="w-full mt-2 border border-gray-300 rounded-xl px-3 py-2 text-sm"
              />
              {preview?.[field.key]?.url && (
                <a
                  href={preview[field.key].url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-sm text-orange-500 hover:underline"
                >
                  View current file
                </a>
              )}
            </div>
          ))}
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

function InputField({ label, value, onChange }) {
  return (
    <div>
      <label className="text-sm text-gray-500">{label}</label>
      <input
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full mt-2 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
      />
    </div>
  );
}



