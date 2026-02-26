import React from "react";
import Card from "@/components/ui/Card";
import Text from "@/components/ui/Text";
import { Phone, Mail, User } from "lucide-react";

function Avatar({ name, photoURL }) {
  const initial = name?.[0]?.toUpperCase() || "?";

  return (
    <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden">
      {photoURL ? (
        <img
          src={photoURL}
          alt={name || "Avatar"}
          className="w-full h-full object-cover"
        />
      ) : (
        <Text variant="body" className="font-semibold text-indigo-700">
          {initial}
        </Text>
      )}
    </div>
  );
}

export default function OrbiterDetailsCard({ orbiter, referralData }) {
  if (!orbiter) return null;

  const totalEarned =
    Number(referralData?.paidToOrbiter || 0) +
    Number(referralData?.paidToOrbiterMentor || 0);

  const adjustmentRemaining =
    orbiter.payment?.orbiter?.adjustmentRemaining ?? 0;

  return (
    <div className="p-0 border border-slate-200 border-0">

      {/* PROFILE HEADER */}
      <div className="flex items-center gap-3 mt-3">
        <Avatar name={orbiter.name} photoURL={orbiter.photoURL} />

        <div className="flex flex-col">
          <Text className="text-sm font-semibold leading-tight">
            {orbiter.name}
          </Text>

          <Text className="text-xs text-gray-400 mt-0.5">
            {orbiter.UJBCode || "—"}
          </Text>
        </div>
      </div>



      {/* EARNINGS HIGHLIGHT */}
      <div className="mt-4 p-5 rounded-xl bg-emerald-50">
        <Text variant="caption" className="text-gray-500">
          Total Earned (This Referral)
        </Text>

        <Text as="h2" className="text-emerald-700 font-semibold">
          ₹{totalEarned.toLocaleString("en-IN")}
        </Text>

        {adjustmentRemaining > 0 && (
          <Text variant="caption" className="text-amber-700">
            Adjustment Pending: ₹{adjustmentRemaining.toLocaleString("en-IN")}
          </Text>
        )}
      </div>

      {/* CONTACT INFO */}
      <div className="mt-4 space-y-2">

        <div className="flex items-center gap-2">
          <Phone size={14} className="text-gray-400" />
          <Text>{orbiter.phone || "—"}</Text>
        </div>

        <div className="flex items-center gap-2">
          <Mail size={14} className="text-gray-400" />
          <Text>{orbiter.email || "—"}</Text>
        </div>

      </div>

      {/* MENTOR SECTION */}
      <div className="mt-4 pt-3 border-t">
        <div className="flex items-center gap-2">
          <User size={14} className="text-gray-400" />
          <Text variant="caption" className="text-gray-500">
            Mentor
          </Text>
        </div>

        <Text className="font-medium mt-1">
          {orbiter.mentorName || "—"}
        </Text>
      </div>

    </div>
  );
}
