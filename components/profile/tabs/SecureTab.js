"use client";

import { useState } from "react";
import {
  ShieldCheck,
  Building2,
  Landmark,
  Pencil,
  Lock,
} from "lucide-react";
// import EditKYCSheet from "./EditKYCSheet";

export default function SecureTab({ user = {}, setUser }) {
  const [open, setOpen] = useState(false);

  const personal = user?.personalKYC || {};
  const business = user?.businessKYC || {};

  /* ------------------ Progress Calculation ------------------ */

  const documents = [
    personal?.panCard,
    personal?.aadhaarFront,
    personal?.aadhaarBack,
    business?.gst,
    business?.shopAct,
    business?.businessPan,
  ];

  const uploadedCount = documents.filter(Boolean).length;
  const totalDocs = documents.length;
  const completion = totalDocs
    ? Math.round((uploadedCount / totalDocs) * 100)
    : 0;

  return (
    <>
      <div className="space-y-8">

        {/* ================= KYC PROGRESS ================= */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-orange-500" />
              <h3 className="font-semibold text-gray-800">
                KYC Completion
              </h3>
            </div>

            <button onClick={() => setOpen(true)}>
              <Pencil
                size={16}
                className="text-gray-500 hover:text-orange-500 transition"
              />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className="bg-orange-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${completion}%` }}
            />
          </div>

          <p className="text-xs text-gray-500">
            {uploadedCount} of {totalDocs} documents uploaded
          </p>

        </section>

        {/* ================= PERSONAL KYC ================= */}
        <Section
          title="Personal KYC"
          icon={<ShieldCheck size={18} className="text-orange-500" />}
          items={[
            { label: "PAN Card", file: personal?.panCard },
            { label: "Aadhaar Front", file: personal?.aadhaarFront },
            { label: "Aadhaar Back", file: personal?.aadhaarBack },
          ]}
        />

        {/* ================= BUSINESS KYC ================= */}
        <Section
          title="Business KYC"
          icon={<Building2 size={18} className="text-orange-500" />}
          items={[
            { label: "GST Certificate", file: business?.gst },
            { label: "Shop Act", file: business?.shopAct },
            { label: "Business PAN", file: business?.businessPan },
          ]}
        />

        {/* ================= BANK ================= */}
        <section className="space-y-4">
          <SectionHeader
            title="Bank Details"
            icon={<Landmark size={18} className="text-orange-500" />}
          />

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <SecureRow label="Account Holder" />
            <SecureRow label="Account Number" masked />
            <SecureRow label="IFSC Code" />
          </div>
        </section>

      </div>

      {/* Edit Bottom Sheet */}
      {/* <EditKYCSheet
        open={open}
        setOpen={setOpen}
        user={user}
        setUser={setUser}
      /> */}
    </>
  );
}

/* ========================================================= */
/* ================= REUSABLE COMPONENTS =================== */
/* ========================================================= */

function Section({ title, icon, items }) {
  return (
    <section className="space-y-4 ">

      <SectionHeader title={title} icon={icon} />

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm ">
        {items.map((item, i) => (
          <KYCRow key={i} {...item} />
        ))}
      </div>

    </section>
  );
}

/* ---------------- Section Header ---------------- */

function SectionHeader({ title, icon }) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <h3 className="font-semibold text-gray-200 text-lg">
        {title}
      </h3>
    </div>
  );
}

/* ---------------- KYC Row ---------------- */

function KYCRow({ label, file }) {
  const status = file
    ? file?.verified
      ? "verified"
      : "pending"
    : "missing";

  return (
    <div className="px-5 py-4 space-y-3 border-b border-gray-200 last:border-b-0">

      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">{label}</p>
        <StatusBadge status={status} />
      </div>

      {file?.url && (
        <div className="flex items-center gap-3">

          {/* Thumbnail */}
          <img
            src={file.url}
            alt={label}
            className="w-14 h-14 object-cover rounded-lg border"
          />

          {/* View Link */}
          <a
            href={file.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-orange-500 hover:underline"
          >
            View Document
          </a>

        </div>
      )}

    </div>
  );
}

/* ---------------- Status Badge ---------------- */

function StatusBadge({ status }) {
  const styles = {
    verified: "bg-green-100 text-green-600",
    pending: "bg-amber-100 text-amber-600",
    missing: "bg-red-100 text-red-600",
  };

  const labels = {
    verified: "Verified",
    pending: "Pending",
    missing: "Missing",
  };

  return (
    <span
      className={`px-3 py-1 text-xs rounded-full font-medium ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

/* ---------------- Bank Row ---------------- */

function SecureRow({ label, masked }) {
  return (
    <div className="flex justify-between items-center px-5 py-4 border-b border-gray-200 last:border-b-0">
      <p className="text-sm text-gray-500">{label}</p>
      <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
        <Lock size={14} className="text-gray-400" />
        {masked ? "****" : "Encrypted"}
      </div>
    </div>
  );
}

