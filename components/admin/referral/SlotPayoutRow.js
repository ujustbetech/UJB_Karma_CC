"use client";

import React, { useState } from "react";
import Text from "@/components/ui/Text";
import Button from "@/components/ui/Button";
import StatusBadge from "@/components/ui/StatusBadge";

import {
  CheckCircle2,
  Send,
  AlertCircle,
  User,
} from "lucide-react";

function getInitials(name = "") {
  const parts = name.trim().split(" ");
  if (!parts.length) return "U";
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || "U";
  return (
    (parts[0][0] || "").toUpperCase() +
    (parts[1][0] || "").toUpperCase()
  );
}

export default function SlotPayoutRow({
  label,
  totalShare = 0,
  paidSoFar = 0,
  onRequestPayout,
  recipientName,
  recipientUjbCode,
}) {
  const [confirming, setConfirming] = useState(false);

  const total = Number(totalShare || 0);
  const paid = Number(paidSoFar || 0);
  const remaining = Math.max(total - paid, 0);

  const progress =
    total > 0 ? Math.round((paid / total) * 100) : 0;

  const isPaid = remaining === 0;
  const isPartial = paid > 0 && !isPaid;

  return (
    <div className="flex items-center justify-between px-4 py-3 rounded-xl border hover:bg-slate-50 transition border-slate-200">
      
      {/* LEFT — Identity + Role */}
      <div className="flex items-center gap-3 min-w-[260px]">
        {/* Avatar chip */}
        <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-xs font-semibold text-slate-600">
          {recipientName ? getInitials(recipientName) : <User size={14} />}
        </div>

        <div className="leading-tight">
          <div className="flex items-center gap-2">
            <Text variant="body" className="font-semibold">
              {label}
            </Text>

            {/* Role badge */}
            <span className="text-[10px] px-2 py-[2px] rounded bg-slate-100 text-slate-600">
              Slot
            </span>
          </div>

          {recipientName && (
            <Text variant="caption" className="text-slate-500">
              {recipientName}
            </Text>
          )}

          {recipientUjbCode && (
            <Text variant="caption" className="text-slate-400">
              UJB: {recipientUjbCode}
            </Text>
          )}
        </div>
      </div>

      {/* CENTER — Financial Intelligence */}
      <div className="flex flex-col items-end min-w-[200px]">
        <div className="flex items-center gap-2">
          {!isPaid && (
            <AlertCircle size={14} className="text-amber-500" />
          )}

          <Text variant="h3" className="font-semibold tracking-tight">
            ₹{remaining.toLocaleString("en-IN")}
          </Text>
        </div>

        <Text variant="caption" className="text-slate-500">
          ₹{paid.toLocaleString("en-IN")} / ₹{total.toLocaleString("en-IN")} paid
        </Text>

        {/* Premium thin progress bar */}
        <div className="w-36 h-[3px] bg-slate-200 rounded-full mt-2">
          <div
            className={`h-[3px] rounded-full ${
              isPaid ? "bg-green-600" : "bg-slate-700"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* RIGHT — Action Zone */}
      <div className="flex items-center justify-end min-w-[180px]">
        {isPaid ? (
          <StatusBadge status="success" className="flex items-center gap-1">
            <CheckCircle2 size={14} />
            Settled
          </StatusBadge>
        ) : confirming ? (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => {
                onRequestPayout?.(remaining);
                setConfirming(false);
              }}
            >
              Confirm
            </Button>

            <Button
              size="sm"
              variant="secondary"
              onClick={() => setConfirming(false)}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            onClick={() => setConfirming(true)}
            className="flex items-center gap-1"
          >
            <Send size={14} />
            Release ₹{remaining.toLocaleString("en-IN")}
          </Button>
        )}
      </div>
    </div>
  );
}
