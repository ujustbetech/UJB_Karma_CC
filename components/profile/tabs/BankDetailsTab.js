"use client";

import { useState } from "react";
import { Landmark, Pencil, Lock } from "lucide-react";
import EditBankDetailsSheet from "./EditBankDetailsSheet";

export default function BankDetailsTab({ user = {}, setUser, ujbCode }) {
  const [open, setOpen] = useState(false);
  const bank = user?.bankDetails || {};

  return (
    <>
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Landmark size={18} className="text-orange-500" />
            <h3 className="font-semibold text-gray-200 text-lg">Bank Details</h3>
          </div>
          <button onClick={() => setOpen(true)}>
            <Pencil size={16} className="text-gray-500 hover:text-orange-500 transition" />
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <SecureRow label="Account Holder" value={bank.accountHolderName} />
          <SecureRow label="Bank Name" value={bank.bankName} />
          <SecureRow label="Account Number" value={bank.accountNumber} masked />
          <SecureRow label="IFSC Code" value={bank.ifscCode} />
          <SecureRow label="Proof Type" value={bank.proofType} />

          {bank?.proofFile?.url && (
            <div className="px-5 py-4 border-t border-gray-200">
              <a
                href={bank.proofFile.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-orange-500 hover:underline"
              >
                View Bank Proof
              </a>
            </div>
          )}
        </div>
      </section>

      <EditBankDetailsSheet
        open={open}
        setOpen={setOpen}
        user={user}
        setUser={setUser}
        ujbCode={ujbCode}
      />
    </>
  );
}

function SecureRow({ label, value, masked = false }) {
  const display = masked && value ? String(value).replace(/.(?=.{4})/g, "*") : value || "Encrypted";

  return (
    <div className="flex justify-between items-center px-5 py-4 border-b border-gray-200 last:border-b-0">
      <p className="text-sm text-gray-500">{label}</p>
      <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
        <Lock size={14} className="text-gray-400" />
        {display}
      </div>
    </div>
  );
}

