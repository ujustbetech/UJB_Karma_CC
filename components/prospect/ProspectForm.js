"use client";

import React, { useState } from "react";
import { User, Phone, Mail, Briefcase, Heart, Users } from "lucide-react";

export default function ProspectForm({
  formData,
  onChange,
  onSubmit,
  submitting,
}) {
  const [errors, setErrors] = useState({});

  const validate = () => {
    let newErrors = {};

    if (!formData.prospectName.trim()) {
      newErrors.prospectName = "Prospect name is required";
    }

    if (!formData.prospectPhone.trim()) {
      newErrors.prospectPhone = "Phone number is required";
    } else if (!/^[0-9]{10}$/.test(formData.prospectPhone)) {
      newErrors.prospectPhone = "Phone number must be 10 digits";
    }

    if (
      formData.prospectEmail &&
      !/^\S+@\S+\.\S+$/.test(formData.prospectEmail)
    ) {
      newErrors.prospectEmail = "Invalid email address";
    }

    if (!formData.occupation) {
      newErrors.occupation = "Please select occupation";
    }

    if (!formData.source) {
      newErrors.source = "Please select source";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit();
    }
  };

  const inputBase =
    "w-full rounded-lg border px-10 py-2.5 text-sm outline-none transition";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* BASIC INFO */}
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-400 mb-3">
          Basic Information
        </p>

        <div className="space-y-5">

          {/* Name */}
          <div className="relative">
            <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Prospect Name *"
              value={formData.prospectName}
              onChange={(e) =>
                onChange("prospectName", e.target.value)
              }
              className={`${inputBase} ${
                errors.prospectName
                  ? "border-red-400"
                  : "border-slate-300 focus:ring-orange-200 focus:border-orange-500"
              }`}
            />
            {errors.prospectName && (
              <p className="text-xs text-red-500 mt-1">
                {errors.prospectName}
              </p>
            )}
          </div>

          {/* Phone */}
          <div className="relative">
            <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              maxLength={10}
              placeholder="Phone Number *"
              value={formData.prospectPhone}
              onChange={(e) =>
                onChange(
                  "prospectPhone",
                  e.target.value.replace(/\D/g, "")
                )
              }
              className={`${inputBase} ${
                errors.prospectPhone
                  ? "border-red-400"
                  : "border-slate-300 focus:ring-orange-200 focus:border-orange-500"
              }`}
            />
            {errors.prospectPhone && (
              <p className="text-xs text-red-500 mt-1">
                {errors.prospectPhone}
              </p>
            )}
          </div>

          {/* Email */}
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              type="email"
              placeholder="Email Address"
              value={formData.prospectEmail}
              onChange={(e) =>
                onChange("prospectEmail", e.target.value)
              }
              className={`${inputBase} ${
                errors.prospectEmail
                  ? "border-red-400"
                  : "border-slate-300 focus:ring-orange-200 focus:border-orange-500"
              }`}
            />
            {errors.prospectEmail && (
              <p className="text-xs text-red-500 mt-1">
                {errors.prospectEmail}
              </p>
            )}
          </div>

        </div>
      </div>

      {/* ADDITIONAL INFO */}
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-400 mb-3">
          Additional Details
        </p>

        <div className="space-y-5">

          {/* Occupation */}
          <div className="relative">
            <Briefcase className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <select
              value={formData.occupation}
              onChange={(e) =>
                onChange("occupation", e.target.value)
              }
              className={`${inputBase} ${
                errors.occupation
                  ? "border-red-400"
                  : "border-slate-300 focus:ring-orange-200 focus:border-orange-500"
              }`}
            >
              <option value="">Select Occupation *</option>
              <option>Service</option>
              <option>Student</option>
              <option>Retired</option>
              <option>Business</option>
              <option>Professional</option>
              <option>Housewife</option>
              <option>Other</option>
            </select>
            {errors.occupation && (
              <p className="text-xs text-red-500 mt-1">
                {errors.occupation}
              </p>
            )}
          </div>

          {/* Source */}
          <div className="relative">
            <Users className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <select
              value={formData.source}
              onChange={(e) =>
                onChange("source", e.target.value)
              }
              className={`${inputBase} ${
                errors.source
                  ? "border-red-400"
                  : "border-slate-300 focus:ring-orange-200 focus:border-orange-500"
              }`}
            >
              <option value="">Select Source *</option>
              <option value="close_connect">Close Connect</option>
              <option value="colleague">Colleague</option>
              <option value="relative">Relative</option>
              <option value="other">Other</option>
            </select>
            {errors.source && (
              <p className="text-xs text-red-500 mt-1">
                {errors.source}
              </p>
            )}
          </div>

          {/* Hobbies */}
          <div className="relative">
            <Heart className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Hobbies"
              value={formData.hobbies}
              onChange={(e) =>
                onChange("hobbies", e.target.value)
              }
              className="w-full rounded-lg border border-slate-300 px-10 py-2.5 text-sm outline-none focus:ring-orange-200 focus:border-orange-500"
            />
          </div>

        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-orange-500 hover:bg-orange-600
                   disabled:opacity-50 text-white font-semibold
                   py-3 rounded-xl shadow transition"
      >
        {submitting ? "Adding..." : "Add Prospect"}
      </button>
    </form>
  );
}