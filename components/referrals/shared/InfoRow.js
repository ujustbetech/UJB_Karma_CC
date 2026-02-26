'use client';

import { Copy, Check } from "lucide-react";
import { useState } from "react";

export default function InfoRow({
  label,
  value,
  icon: Icon,
  copyable = false,
  valueClassName = "",
  onClick
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!value) return;
    await navigator.clipboard.writeText(value.toString());
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex justify-between items-start gap-3">

      {/* Label */}
      <div className="flex items-center gap-2 text-slate-500">
        {Icon && <Icon size={14} />}
        <span className="text-sm">{label}</span>
      </div>

      {/* Value */}
      <div className="flex items-center gap-2 max-w-[60%] text-right">

        <span
          onClick={onClick}
          className={`text-sm font-medium break-words ${
            onClick ? "cursor-pointer hover:underline" : ""
          } ${valueClassName}`}
        >
          {value || "—"}
        </span>

        {copyable && value && (
          <button
            onClick={handleCopy}
            className="text-slate-400 hover:text-slate-700"
          >
            {copied ? (
              <Check size={14} className="text-green-600" />
            ) : (
              <Copy size={14} />
            )}
          </button>
        )}
      </div>
    </div>
  );
}