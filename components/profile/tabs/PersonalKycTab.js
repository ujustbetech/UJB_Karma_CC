"use client";

import { useState } from "react";
import { ShieldCheck, Pencil } from "lucide-react";
import EditPersonalKycSheet from "./EditPersonalKycSheet";

export default function PersonalKycTab({ user = {}, setUser, ujbCode }) {
  const [open, setOpen] = useState(false);
  const personal = user?.personalKYC || {};

  return (
    <>
      <div className="space-y-8">
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-orange-500" />
              <h3 className="font-semibold text-gray-800">Personal KYC</h3>
            </div>
            <button onClick={() => setOpen(true)}>
              <Pencil size={16} className="text-gray-500 hover:text-orange-500 transition" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <InfoItem label="PAN Number" value={user?.panNumber || user?.IDNumber} />
            <InfoItem label="Aadhaar Number" value={user?.aadhaarNumber} />
          </div>
        </section>

        <Section
          title="Documents"
          items={[
            { label: "PAN Card", file: personal?.panCard },
            { label: "Aadhaar Front", file: personal?.aadhaarFront },
            { label: "Aadhaar Back", file: personal?.aadhaarBack },
            { label: "Address Proof", file: personal?.addressProof },
          ]}
        />
      </div>

      <EditPersonalKycSheet
        open={open}
        setOpen={setOpen}
        user={user}
        setUser={setUser}
        ujbCode={ujbCode}
      />
    </>
  );
}

function Section({ title, items }) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <ShieldCheck size={18} className="text-orange-500" />
        <h3 className="font-semibold text-gray-200 text-lg">{title}</h3>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        {items.map((item, index) => (
          <KycRow key={`${item.label}-${index}`} {...item} />
        ))}
      </div>
    </section>
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

function InfoItem({ label, value }) {
  return (
    <div>
      <p className="text-gray-500">{label}</p>
      <p className="font-medium text-gray-800">{value || "-"}</p>
    </div>
  );
}

