"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { updateUserProfile } from "@/services/profileService";

const SOCIAL_PLATFORM_OPTIONS = [
  "Facebook",
  "Instagram",
  "LinkedIn",
  "YouTube",
  "Twitter",
  "Pinterest",
  "Other",
];

export default function EditPersonalInfoSheet({
  open,
  setOpen,
  user,
  setUser = null,
}) {
  const [form, setForm] = useState({
    BusinessSocialMediaPages: [],
  });
  const [residentStatus, setResidentStatus] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;

    setResidentStatus(user.residentStatus || "");
    setForm({
      Name: user.Name || "",
      Category: user.Category || "",
      Email: user.Email || "",
      MobileNo: user.MobileNo || user.Mobile || "",
      IDType: user.IDType || "",
      IDNumber: user.IDNumber || "",
      Pincode: user.Pincode || "",
      City: user.City || "",
      State: user.State || "",
      Location: user.Location || "",
      BusinessSocialMediaPages: Array.isArray(user.BusinessSocialMediaPages)
        ? user.BusinessSocialMediaPages
        : [],
    });
  }, [user]);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleResidentChange = (value) => {
    setResidentStatus(value);
  };

  const addSocial = () => {
    setForm((prev) => ({
      ...prev,
      BusinessSocialMediaPages: [
        ...(prev.BusinessSocialMediaPages || []),
        { platform: "", url: "", customPlatform: "" },
      ],
    }));
  };

  const updateSocial = (index, key, value) => {
    const next = [...(form.BusinessSocialMediaPages || [])];
    next[index] = { ...next[index], [key]: value };
    setForm((prev) => ({ ...prev, BusinessSocialMediaPages: next }));
  };

  const removeSocial = (index) => {
    setForm((prev) => ({
      ...prev,
      BusinessSocialMediaPages: (prev.BusinessSocialMediaPages || []).filter(
        (_, i) => i !== index
      ),
    }));
  };

  const handleSave = async () => {
    try {
      const userDocId = user?.__docId;
      if (!userDocId) throw new Error("User profile document not found");

      setLoading(true);

      const payload = {
        ...form,
        residentStatus,
        taxSlab:
          residentStatus === "Resident"
            ? "5%"
            : residentStatus === "Non-Resident"
            ? "20%"
            : "",
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
          <h3 className="font-semibold text-lg">Edit Personal Info</h3>
          <button onClick={() => setOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto px-6 pb-28 space-y-5">
          <InputField label="Name" value={form.Name} onChange={(v) => handleChange("Name", v)} />
          <SelectField
            label="Category"
            value={form.Category}
            options={["Orbiter", "CosmOrbiter"]}
            onChange={(v) => handleChange("Category", v)}
          />
          <InputField label="Email" value={form.Email} onChange={(v) => handleChange("Email", v)} />
          <InputField label="Mobile" value={form.MobileNo} onChange={(v) => handleChange("MobileNo", v)} />
          <SelectField
            label="Resident Status"
            value={residentStatus}
            options={["Resident", "Non-Resident"]}
            onChange={handleResidentChange}
          />
          <InputField
            label="Applicable Tax Slab"
            value={
              residentStatus === "Resident"
                ? "5%"
                : residentStatus === "Non-Resident"
                ? "20%"
                : ""
            }
            disabled
            onChange={() => {}}
          />
          <SelectField
            label="ID Type"
            value={form.IDType}
            options={["Aadhaar", "PAN", "Passport", "Driving License"]}
            onChange={(v) => handleChange("IDType", v)}
          />
          <InputField label="ID Number" value={form.IDNumber} onChange={(v) => handleChange("IDNumber", v)} />
          <InputField label="Pincode" value={form.Pincode} onChange={(v) => handleChange("Pincode", v)} />
          <InputField label="City" value={form.City} onChange={(v) => handleChange("City", v)} />
          <InputField label="State" value={form.State} onChange={(v) => handleChange("State", v)} />
          <TextAreaField label="Location" value={form.Location} onChange={(v) => handleChange("Location", v)} />

          <div>
            <label className="text-sm text-gray-500">Social Media</label>
            <div className="space-y-3 mt-2">
              {(form.BusinessSocialMediaPages || []).map((item, index) => (
                <div key={`social-${index}`} className="space-y-2 border border-gray-200 rounded-xl p-3">
                  <SelectField
                    label="Platform"
                    value={item.platform || ""}
                    options={SOCIAL_PLATFORM_OPTIONS}
                    onChange={(v) => updateSocial(index, "platform", v)}
                  />
                  {item.platform === "Other" && (
                    <InputField
                      label="Custom Platform"
                      value={item.customPlatform || ""}
                      onChange={(v) => updateSocial(index, "customPlatform", v)}
                    />
                  )}
                  <InputField
                    label="URL"
                    value={item.url || ""}
                    onChange={(v) => updateSocial(index, "url", v)}
                  />
                  <button
                    type="button"
                    onClick={() => removeSocial(index)}
                    className="text-red-500 text-xs"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addSocial}
              className="mt-3 bg-orange-100 text-orange-600 px-4 py-2 rounded-xl text-sm"
            >
              + Add Social Link
            </button>
          </div>
        </div>

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

function InputField({ label, value, onChange, disabled = false }) {
  return (
    <div>
      <label className="text-sm text-gray-500">{label}</label>
      <input
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full mt-2 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-50"
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

function TextAreaField({ label, value, onChange }) {
  return (
    <div>
      <label className="text-sm text-gray-500">{label}</label>
      <textarea
        rows={3}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full mt-2 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
      />
    </div>
  );
}

