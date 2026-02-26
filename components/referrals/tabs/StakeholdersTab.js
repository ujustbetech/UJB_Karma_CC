'use client';

import { useState } from "react";
import {
  Phone,
  MessageCircle,
  Mail,
  BadgeCheck,
  User
} from "lucide-react";


import InfoCard from "../shared/InfoCard";
import InfoRow from "../shared/InfoRow";
import ChatModal from "../ChatModal";

function getInitials(name = "") {
  return name
    .split(" ")
    .map(w => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function StakeholdersTab({ referral }) {

  const [chatUser, setChatUser] = useState(null);

  const currentUserUjbCode =
    typeof window !== "undefined"
      ? localStorage.getItem("mmUJBCode")
      : null;

  const StakeholderCard = ({ person, role }) => {

    if (!person) return null;

    // Normalize UJB Code safely
    const normalizedUjbCode =
      person?.ujbCode ||
      person?.cosmoUjbCode ||
      referral?.cosmoUjbCode ||
      null;

    return (
      <InfoCard icon={User}>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">

          {person?.profilePic ? (
            <img
              src={person.profilePic}
              alt={person.name}
              className="h-12 w-12 rounded-full object-cover"
            />
          ) : (
            <div className="h-12 w-12 rounded-full bg-slate-200 flex items-center justify-center font-semibold text-slate-700">
              {getInitials(person?.name)}
            </div>
          )}

          <div>
            <p className="font-semibold">{person?.name}</p>
            <p className="text-xs text-slate-500">{role}</p>
          </div>

        </div>

        <InfoRow label="Email" value={person?.email} />
        <InfoRow label="Phone" value={person?.phone} />
        <InfoRow label="UJB Code" value={normalizedUjbCode} />

        {/* Actions */}
        <div className="grid grid-cols-3 gap-3 mt-4">

          {person?.phone && (
            <a
              href={`tel:${person.phone}`}
              className="flex items-center justify-center gap-1 bg-green-50 text-green-700 text-sm py-2 rounded-lg"
            >
              <Phone size={14} />
              Call
            </a>
          )}

          <button
            onClick={() =>
              setChatUser({
                ...person,
                ujbCode: normalizedUjbCode
              })
            }
            className="flex items-center justify-center gap-1 bg-blue-50 text-blue-700 text-sm py-2 rounded-lg"
          >
            <MessageCircle size={14} />
            Chat
          </button>

          {person?.email && (
            <a
              href={`mailto:${person.email}`}
              className="flex items-center justify-center gap-1 bg-slate-50 text-slate-700 text-sm py-2 rounded-lg"
            >
              <Mail size={14} />
              Email
            </a>
          )}

        </div>

      </InfoCard>
    );
  };

  return (
    <div className="mt-5 space-y-5">

      <StakeholderCard
        person={referral?.orbiter}
        role="Primary Referrer"
      />

      <StakeholderCard
        person={referral?.cosmoOrbiter}
        role="Client Handler"
      />

      {chatUser && (
        <ChatModal
          referralId={referral?.id}
          currentUserUjbCode={currentUserUjbCode}
          otherUser={chatUser}
          onClose={() => setChatUser(null)}
        />
      )}

    </div>
  );
}