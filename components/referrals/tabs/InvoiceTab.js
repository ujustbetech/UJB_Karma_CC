'use client';

import { useState } from "react";
import {
  FileText,
  Image as ImageIcon,
  Eye,
  Download
} from "lucide-react";
import InfoCard from "../shared/InfoCard";

export default function InvoiceTab({ referral }) {

  const [preview, setPreview] = useState(false);

  const documentURL = referral?.dealDocumentURL;

  if (!documentURL) {
    return (
      <div className="mt-5">
        <InfoCard>
          <p className="text-sm text-slate-500">
            No invoice or agreement uploaded.
          </p>
        </InfoCard>
      </div>
    );
  }

  const isPDF = documentURL.toLowerCase().includes(".pdf");

  return (
    <div className="mt-5 space-y-5">

      <InfoCard title="Invoice / Agreement" icon={FileText}>

        <div className="flex items-center justify-between">

          <div className="flex items-center gap-2">
            {isPDF ? (
              <FileText size={18} className="text-red-500" />
            ) : (
              <ImageIcon size={18} className="text-blue-500" />
            )}

            <span className="text-xs px-2 py-1 bg-slate-100 rounded-full">
              {isPDF ? "PDF" : "IMAGE"}
            </span>
          </div>

          <div className="flex gap-3">

            <button
              onClick={() => setPreview(true)}
              className="text-orange-600 text-sm flex items-center gap-1"
            >
              <Eye size={14} /> Preview
            </button>

            <a
              href={documentURL}
              target="_blank"
              className="text-slate-500 text-sm flex items-center gap-1"
            >
              <Download size={14} /> Download
            </a>

          </div>

        </div>

      </InfoCard>

      {/* Preview Modal */}
      {preview && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
          <div className="bg-white w-[95%] h-[85%] rounded-xl overflow-hidden relative">

            <button
              onClick={() => setPreview(false)}
              className="absolute top-3 right-3 text-slate-600"
            >
              ✕
            </button>

            {isPDF ? (
              <iframe
                src={documentURL}
                className="w-full h-full"
              />
            ) : (
              <img
                src={documentURL}
                alt="Invoice"
                className="w-full h-full object-contain"
              />
            )}

          </div>
        </div>
      )}

    </div>
  );
}