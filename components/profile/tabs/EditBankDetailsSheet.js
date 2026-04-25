"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db } from "@/lib/firebase/firebaseClient";
import { COLLECTIONS } from "@/lib/utility_collection";
import { encryptData } from "@/utils/encryption";

export default function EditBankDetailsSheet({
  open,
  setOpen,
  user,
  setUser = null,
  ujbCode,
}) {
  const [form, setForm] = useState({});
  const [proofFile, setProofFile] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setForm({
      accountHolderName: user?.bankDetails?.accountHolderName || "",
      bankName: user?.bankDetails?.bankName || "",
      accountNumber: user?.bankDetails?.accountNumber || "",
      ifscCode: user?.bankDetails?.ifscCode || "",
      proofType: user?.bankDetails?.proofType || "",
    });
  }, [user]);

  const handleSave = async () => {
    try {
      const userDocId = user?.__docId;
      if (!userDocId) throw new Error("User profile document not found");

      setLoading(true);

      const nextBankDetails = {
        accountHolderName: encryptData(form.accountHolderName || ""),
        bankName: encryptData(form.bankName || ""),
        accountNumber: encryptData(form.accountNumber || ""),
        ifscCode: encryptData(form.ifscCode || ""),
        proofType: form.proofType || "",
        proofFile: user?.bankDetails?.proofFile || null,
      };

      if (proofFile) {
        const storage = getStorage();
        const storageRef = ref(
          storage,
          `userProfile/${ujbCode}/bank/${Date.now()}-${proofFile.name}`
        );

        await uploadBytes(storageRef, proofFile);
        const url = await getDownloadURL(storageRef);

        nextBankDetails.proofFile = {
          url,
          fileName: proofFile.name,
        };
      }

      await updateDoc(doc(db, COLLECTIONS.userDetail, userDocId), {
        bankDetails: nextBankDetails,
      });

      if (typeof setUser === "function") {
        setUser((prev) => ({
          ...prev,
          bankDetails: {
            ...nextBankDetails,
            accountHolderName: form.accountHolderName || "",
            bankName: form.bankName || "",
            accountNumber: form.accountNumber || "",
            ifscCode: form.ifscCode || "",
          },
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
          <h3 className="font-semibold text-lg">Edit Bank Details</h3>
          <button onClick={() => setOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto px-6 pb-28 space-y-5">
          <InputField label="Account Holder Name" value={form.accountHolderName} onChange={(v) => setForm((p) => ({ ...p, accountHolderName: v }))} />
          <InputField label="Bank Name" value={form.bankName} onChange={(v) => setForm((p) => ({ ...p, bankName: v }))} />
          <InputField label="Account Number" value={form.accountNumber} onChange={(v) => setForm((p) => ({ ...p, accountNumber: v }))} />
          <InputField label="IFSC Code" value={form.ifscCode} onChange={(v) => setForm((p) => ({ ...p, ifscCode: v.toUpperCase() }))} />
          <SelectField
            label="Bank Proof Type"
            value={form.proofType}
            options={["cheque", "passbook", "statement"]}
            onChange={(v) => setForm((p) => ({ ...p, proofType: v }))}
          />
          <div>
            <label className="text-sm text-gray-500">Upload Bank Proof</label>
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => setProofFile(e.target.files?.[0] || null)}
              className="w-full mt-2 border border-gray-300 rounded-xl px-3 py-2 text-sm"
            />
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

function SelectField({ label, value, onChange, options }) {
  return (
    <div>
      <label className="text-sm text-gray-500">{label}</label>
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full mt-2 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
      >
        <option value="">Select</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}
