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

export default function CosmoOrbiterDetailsCard({
  cosmoOrbiter,
  referralData,
}) {
  if (!cosmoOrbiter) return null;

  const paidToCosmoMentor = Number(referralData?.paidToCosmoMentor || 0);

  return (
    <div className="">

      {/* PROFILE HEADER */}

      {/* PROFILE HEADER */}
      <div className="flex items-center gap-3 mt-3">
        <Avatar name={cosmoOrbiter.name} photoURL={cosmoOrbiter.photoURL} />

        <div className="flex flex-col">
          <Text className="text-sm font-semibold leading-tight">
            {cosmoOrbiter.name}
          </Text>

          <Text className="text-xs text-gray-400 mt-0.5">
            {cosmoOrbiter.UJBCode || "—"}
          </Text>
        </div>
      </div>

      {/* EARNINGS HIGHLIGHT */}
      <div className="mt-4 p-5 rounded-xl bg-emerald-50">
        <Text variant="caption" className="text-gray-500">
          Total Earned (Cosmo Mentor)
        </Text>

        <Text as="h2" className="text-emerald-700 font-semibold">
          ₹{paidToCosmoMentor.toLocaleString("en-IN")}
        </Text>
      </div>

      {/* CONTACT INFO */}
      <div className="mt-4 space-y-2">

        <div className="flex items-center gap-2">
          <Phone size={14} className="text-gray-400" />
          <Text>{cosmoOrbiter.phone || "—"}</Text>
        </div>

        <div className="flex items-center gap-2">
          <Mail size={14} className="text-gray-400" />
          <Text>{cosmoOrbiter.email || "—"}</Text>
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
          {cosmoOrbiter.mentorName || "—"}
        </Text>

        <div className="flex items-center gap-2 mt-1">
          <Phone size={13} className="text-gray-400" />
          <Text variant="caption">
            {cosmoOrbiter.mentorPhone || "—"}
          </Text>
        </div>

      </div>

    </div>
  );
}
