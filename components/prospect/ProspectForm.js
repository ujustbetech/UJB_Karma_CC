"use client";

import React, { useState } from "react";
import {
  User,
  Phone,
  Mail,
  Briefcase,
  Heart,
  CalendarDays,
} from "lucide-react";
import {
  PROSPECT_OCCUPATION_OPTIONS,
} from "@/lib/prospectFormOptions";

const INDIAN_MOBILE_REGEX = /^[6-9]\d{9}$/;
const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

function getAdultDobMax() {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 18);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

function parseLocalDate(value) {
  if (!value) return null;
  const [year, month, day] = String(value).split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function isAdultDob(value) {
  const selectedDate = parseLocalDate(value);
  const maxDobDate = parseLocalDate(getAdultDobMax());
  if (!selectedDate || !maxDobDate) return false;
  return selectedDate <= maxDobDate;
}

export default function ProspectForm({
  formData,
  onChange,
  onSubmit,
  submitting,
  submitError,
}) {
  const [errors, setErrors] = useState({});
  const inputBase =
    "w-full rounded-lg border px-10 py-2.5 text-sm outline-none transition";

  const validate = () => {
    const newErrors = {};

    if (!formData.prospectName.trim()) {
      newErrors.prospectName = "Prospect name is required";
    }

    if (!formData.prospectPhone.trim()) {
      newErrors.prospectPhone = "Phone number is required";
    } else if (!INDIAN_MOBILE_REGEX.test(formData.prospectPhone)) {
      newErrors.prospectPhone = "Enter a valid 10-digit Indian mobile number";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!EMAIL_REGEX.test(formData.email.trim())) {
      newErrors.email = "Enter a valid email address";
    }

    if (!formData.dob) {
      newErrors.dob = "DOB is required";
    } else if (!isAdultDob(formData.dob)) {
      newErrors.dob = "Prospect must be at least 18 years old";
    }

    if (!formData.occupation) {
      newErrors.occupation = "Please select occupation";
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-400 mb-3">
          Prospect Information
        </p>

        <div className="space-y-5">
          <div className="relative">
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Prospect Name
            </label>
            <User className="absolute left-3 top-9 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Enter prospect name *"
              value={formData.prospectName}
              onChange={(e) => onChange("prospectName", e.target.value.replace(/\d/g, ""))}
              className={`${inputBase} ${errors.prospectName
                  ? "border-red-400"
                  : "border-slate-300 focus:ring-orange-200 focus:border-orange-500"
                }`}
            />
            {errors.prospectName && <p className="text-xs text-red-500 mt-1">{errors.prospectName}</p>}
          </div>

          <div className="relative">
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Prospect Phone
            </label>
            <Phone className="absolute left-3 top-9 h-4 w-4 text-slate-400" />
            <input
              type="text"
              maxLength={10}
              placeholder="Enter 10-digit phone *"
              value={formData.prospectPhone}
              onChange={(e) => onChange("prospectPhone", e.target.value.replace(/\D/g, "").slice(0, 10))}
              className={`${inputBase} ${errors.prospectPhone
                  ? "border-red-400"
                  : "border-slate-300 focus:ring-orange-200 focus:border-orange-500"
                }`}
            />
            {errors.prospectPhone && <p className="text-xs text-red-500 mt-1">{errors.prospectPhone}</p>}
          </div>

          <div className="relative">
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Email Address
            </label>
            <Mail className="absolute left-3 top-9 h-4 w-4 text-slate-400" />
            <input
              type="email"
              placeholder="Enter email address *"
              value={formData.email}
              onChange={(e) => onChange("email", e.target.value.trimStart())}
              className={`${inputBase} ${errors.email
                  ? "border-red-400"
                  : "border-slate-300 focus:ring-orange-200 focus:border-orange-500"
                }`}
            />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
          </div>

          <div className="relative">
            <label className="mb-1 block text-xs font-medium text-slate-600">
              DOB
            </label>
            <CalendarDays className="absolute left-3 top-9 h-4 w-4 text-slate-400" />
            <input
              type="date"
              max={getAdultDobMax()}
              value={formData.dob}
              onChange={(e) => onChange("dob", e.target.value)}
              className={`${inputBase} ${errors.dob
                  ? "border-red-400"
                  : "border-slate-300 focus:ring-orange-200 focus:border-orange-500"
                }`}
            />
            {errors.dob && <p className="text-xs text-red-500 mt-1">{errors.dob}</p>}
          </div>

          <div className="relative">
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Occupation
            </label>
            <Briefcase className="absolute left-3 top-9 h-4 w-4 text-slate-400" />
            <select
              value={formData.occupation}
              onChange={(e) => onChange("occupation", e.target.value)}
              className={`${inputBase} ${errors.occupation
                  ? "border-red-400"
                  : "border-slate-300 focus:ring-orange-200 focus:border-orange-500"
                }`}
            >
              {PROSPECT_OCCUPATION_OPTIONS.map((option) => (
                <option key={option.value || "blank"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.occupation && <p className="text-xs text-red-500 mt-1">{errors.occupation}</p>}
          </div>

          <div className="relative">
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Hobbies
            </label>
            <Heart className="absolute left-3 top-9 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Enter hobbies"
              value={formData.hobbies}
              onChange={(e) => onChange("hobbies", e.target.value.replace(/\d/g, ""))}
              className="w-full rounded-lg border border-slate-300 px-10 py-2.5 text-sm outline-none focus:ring-orange-200 focus:border-orange-500"
            />
          </div>
        </div>
      </div>

      {submitError ? <p className="text-xs text-red-500">{submitError}</p> : null}

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl shadow transition"
      >
        {submitting ? "Enrolling..." : "Enroll Prospect"}
      </button>
    </form>
  );
}
