"use client";

import React, { useState } from "react";
import {
  User,
  Phone,
  Mail,
  ShieldCheck,
  ChevronDown,
} from "lucide-react";

const InfoItem = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3 bg-slate-50 border border-slate-200 rounded-xl p-4">
    <div className="bg-white border border-slate-200 rounded-lg p-2">
      <Icon className="h-4 w-4 text-orange-500" />
    </div>
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm font-semibold text-slate-800 break-all">
        {value || "-"}
      </p>
    </div>
  </div>
);

export default function MentorInfo({ mentor }) {
  const [open, setOpen] = useState(false); // collapsed by default

  if (!mentor) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">

      {/* Header */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition"
      >
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-5 w-5 text-orange-500" />

          <div className="text-left">
            <p className="text-sm font-semibold text-slate-800">
              Mentor Information
            </p>

            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-slate-500">
                {mentor?.Name}
              </span>

              {mentor?.id && (
                <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-medium">
                  {mentor.id}
                </span>
              )}
            </div>
          </div>
        </div>

        <ChevronDown
          className={`h-5 w-5 text-slate-500 transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Collapsible Content */}
      <div
        className={`transition-all duration-300 ease-in-out ${
          open ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        } overflow-hidden px-5 pb-5`}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <InfoItem
            icon={User}
            label="Mentor Name"
            value={mentor?.Name}
          />
          <InfoItem
            icon={Phone}
            label="Phone Number"
            value={mentor?.MobileNo}
          />
          <InfoItem
            icon={Mail}
            label="Email Address"
            value={mentor?.Email}
          />
        </div>
      </div>
    </div>
  );
}