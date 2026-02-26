"use client";

import { CheckCircle } from "lucide-react";

export default function SuccessModal({ open, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl w-[90%] max-w-md p-6 animate-scaleIn">
        <div className="flex flex-col items-center text-center space-y-4">
          <CheckCircle className="h-12 w-12 text-green-500" />

          <h2 className="text-lg font-semibold text-slate-800">
            Prospect Added Successfully
          </h2>

          <p className="text-sm text-slate-500">
            Your prospect has been registered successfully.
          </p>

          <button
            onClick={onClose}
            className="mt-4 bg-orange-500 hover:bg-orange-600
                       text-white px-6 py-2 rounded-lg font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}