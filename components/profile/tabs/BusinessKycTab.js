"use client";

import { useState } from "react";
import { Building2, Pencil } from "lucide-react";
import EditBusinessKycSheet from "./EditBusinessKycSheet";

const BUSINESS_DOCS = [
  { key: "gst", label: "GST Certificate" },
  { key: "shopAct", label: "Shop Act / License" },
  { key: "businessPan", label: "Business PAN Card" },
  { key: "cheque", label: "Cancelled Cheque" },
  { key: "addressProof", label: "Business Address Proof" },
];

export default function BusinessKycTab({ user = {}, setUser, ujbCode }) {
  const [open, setOpen] = useState(false);
  const business = user?.businessKYC || {};

  return (
    <>
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Building2 size={18} className="text-orange-500" />
            <h3 className="font-semibold text-gray-200 text-lg">Business KYC</h3>
          </div>
          <button onClick={() => setOpen(true)}>
            <Pencil size={16} className="text-gray-500 hover:text-orange-500 transition" />
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          {BUSINESS_DOCS.map((doc) => (
            <KycRow key={doc.key} label={doc.label} file={business?.[doc.key]} />
          ))}
        </div>
      </section>

      <EditBusinessKycSheet
        open={open}
        setOpen={setOpen}
        user={user}
        setUser={setUser}
        ujbCode={ujbCode}
      />
    </>
  );
}

function KycRow({ label, file }) {
  const status = file ? (file?.verified ? "verified" : "pending") : "missing";

  return (
    <div className="px-5 py-4 space-y-3 border-b border-gray-200 last:border-b-0">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">{label}</p>
        <StatusBadge status={status} />
      </div>
      {file?.url && (
        <a
          href={file.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-orange-500 hover:underline"
        >
          View Document
        </a>
      )}
    </div>
  );
}

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
    <span className={`px-3 py-1 text-xs rounded-full font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

