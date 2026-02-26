import React, { useState, useRef } from "react";
import {
  FileText,
  Upload,
  Link,
  Calendar,
  Tag,
  Package,
  Image as ImageIcon,
  Hash,
  FolderOpen
} from "lucide-react";

import Card from "@/components/ui/Card";
import Text from "@/components/ui/Text";
import Button from "@/components/ui/Button";

export default function ReferralInfoCard({ referralData, onUploadLeadDoc }) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const description =
    referralData.description ||
    referralData.dealDescription ||
    referralData.leadDescription ||
    "";

  const leadDocs = (referralData.supportingDocs || []).filter(
    (d) => d.type === "lead"
  );

  const createdAt =
    referralData.createdAt?.seconds
      ? new Date(referralData.createdAt.seconds * 1000).toLocaleDateString()
      : referralData.createdAt
      ? new Date(referralData.createdAt).toLocaleDateString()
      : "—";

  const handleLeadDocChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !onUploadLeadDoc) return;

    setUploading(true);
    const res = await onUploadLeadDoc(file);
    if (res?.error) alert(res.error);
    setUploading(false);
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-2">
        <FolderOpen size={18} />
        <Text as="h3" variant="h3">Referral Info</Text>
      </div>

      {/* Info Grid */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2">
          <Hash size={14} />
          <Text variant="body">
            <strong>ID:</strong>{" "}
            <span className="font-mono">
              {referralData.referralId || referralData.id || "—"}
            </span>
          </Text>
        </div>

        <div className="flex items-center gap-2">
          <Tag size={14} />
          <Text variant="body">
            <strong>Source:</strong> {referralData.referralSource || "—"}
          </Text>
        </div>

        <div className="flex items-center gap-2">
          <Calendar size={14} />
          <Text variant="body">
            <strong>Created:</strong> {createdAt}
          </Text>
        </div>

        {referralData.agreedTotal && (
          <div className="flex items-center gap-2">
            <FileText size={14} />
            <Text variant="body">
              <strong>Agreed:</strong> ₹{referralData.agreedTotal}
            </Text>
          </div>
        )}
      </div>

      {/* Description */}
      {description && (
        <div className="mt-4 p-3 bg-gray-50 rounded border border-slate-200">
          <div className="flex items-start gap-2">
            <FileText size={16} className="mt-1" />
            <Text variant="body">
              <strong>Deal / Lead Description</strong>
              <br />
              <span className="whitespace-pre-wrap">{description}</span>
            </Text>
          </div>
        </div>
      )}

      {/* Service / Product */}
      {referralData.service?.name && (
        <div className="mt-5 pt-4 border-t border-slate-200">
          <div className="flex items-center gap-2 mb-2">
            <Package size={16} />
            <Text as="h3" variant="h3">Service / Product</Text>
          </div>

          <div className="flex gap-4 items-start">
            {referralData.service.imageURL ? (
              <img
                src={referralData.service.imageURL}
                alt="Service"
                className="w-20 h-20 object-cover rounded border border-slate-200"
              />
            ) : (
              <div className="w-20 h-20 flex items-center justify-center border border-slate-200 rounded bg-gray-50">
                <ImageIcon size={20} />
              </div>
            )}

            <div className="space-y-1">
              <Text variant="body">
                <strong>Name:</strong> {referralData.service.name}
              </Text>

              {referralData.service.description && (
                <Text variant="body">
                  <strong>Description:</strong>
                  <br />
                  {referralData.service.description}
                </Text>
              )}

              {referralData.service.keywords && (
                <Text variant="body">
                  <strong>Keywords:</strong> {referralData.service.keywords}
                </Text>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Lead Documents */}
      <div className="mt-5 pt-4 border-t border-slate-200">
        <div className="flex items-center gap-2 mb-2">
          <FileText size={16} />
          <Text as="h3" variant="h3">Lead Documents</Text>
        </div>

        {leadDocs.length ? (
          <div className="space-y-2">
            {leadDocs.map((d, i) => (
              <div
                key={i}
                className="flex items-center justify-between border border-slate-200 rounded px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <Link size={14} />
                  <Text variant="body">
                    {d.name || `Lead Document ${i + 1}`}
                  </Text>
                </div>

                <a
                  href={d.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm underline"
                >
                  View
                </a>
              </div>
            ))}
          </div>
        ) : (
          <Text variant="muted" className="mt-2">
            No lead documents yet. Add the first document to support this referral.
          </Text>
        )}

        {/* Upload */}
        <div className="mt-4 pt-3 border-t border-slate-200">
          <Button
            variant="outline"
            disabled={uploading}
            className={`flex items-center gap-2 ${uploading ? "opacity-70" : ""}`}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={16} />
            {uploading ? "Uploading…" : "Add Lead Document"}
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,image/*"
            onChange={handleLeadDocChange}
            disabled={uploading}
            style={{ display: "none" }}
          />

          {uploading && (
            <Text variant="caption" className="block mt-2">
              Uploading lead document…
            </Text>
          )}
        </div>
      </div>
    </>
  );
}
