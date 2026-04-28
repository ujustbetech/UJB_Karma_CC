"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { updateUserProfile } from "@/services/profileService";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

const BUSINESS_DOCS = [
  { key: "gst", label: "GST Certificate" },
  { key: "shopAct", label: "Shop Act / License" },
  { key: "businessPan", label: "Business PAN Card" },
  { key: "cheque", label: "Cancelled Cheque" },
  { key: "addressProof", label: "Business Address Proof" },
];

export default function EditBusinessKycSheet({
  open,
  setOpen,
  user,
  setUser = null,
  ujbCode,
}) {
  const [files, setFiles] = useState({});
  const [preview, setPreview] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setPreview(user?.businessKYC || {});
  }, [user]);

  const handleSave = async () => {
    try {
      const userDocId = user?.__docId;
      if (!userDocId) throw new Error("User profile document not found");

      setLoading(true);

      const storage = getStorage();
      const nextBusinessKyc = { ...(user.businessKYC || {}) };

      for (const field of BUSINESS_DOCS) {
        const file = files[field.key];

        if (!file) continue;

        const storageRef = ref(
          storage,
          `userProfile/${ujbCode}/businessKYC/${field.key}-${Date.now()}-${file.name}`
        );

        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);

        nextBusinessKyc[field.key] = {
          url,
          fileName: file.name,
        };
      }

      await updateUserProfile({
        businessKYC: nextBusinessKyc,
      });

      if (typeof setUser === "function") {
        setUser((prev) => ({
          ...prev,
          businessKYC: nextBusinessKyc,
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
          <h3 className="font-semibold text-lg">Edit Business KYC</h3>
          <button onClick={() => setOpen(false)}>
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto px-6 pb-28 space-y-5">
          {BUSINESS_DOCS.map((field) => (
            <div key={field.key}>
              <label className="text-sm text-gray-500">{field.label}</label>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) =>
                  setFiles((prev) => ({ ...prev, [field.key]: e.target.files?.[0] || null }))
                }
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

