"use client";

import { useState } from "react";
import {
  Users,
  HeartHandshake,
  Phone,
  Mail,
  ChevronDown,
} from "lucide-react";

export default function NetworkTab({ user = {} }) {
  const [active, setActive] = useState("connections");

  const connects = Array.isArray(user?.connects)
    ? user.connects
    : [];

  const closeConnections = Array.isArray(user?.closeConnections)
    ? user.closeConnections
    : [];

  const list =
    active === "connections"
      ? connects
      : closeConnections;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center gap-2">
        <Users size={18} className="text-orange-500" />
        <h3 className="font-semibold text-gray-200">
          Network
        </h3>
      </div>

      {/* ✅ Segmented Tabs (Same as Services) */}
      <div className="bg-gray-100 p-1 rounded-xl flex">

        <button
          onClick={() => setActive("connections")}
          className={`flex-1 flex items-center justify-center gap-2 text-sm font-medium py-2 rounded-lg transition
            ${
              active === "connections"
                ? "bg-white shadow text-orange-500"
                : "text-gray-500"
            }`}
        >
          <Users size={16} />
          Connections
          <span className="font-medium text-gray-200">
            {connects.length}
          </span>
        </button>

        <button
          onClick={() => setActive("close")}
          className={`flex-1 flex items-center justify-center gap-2 text-sm font-medium py-2 rounded-lg transition
            ${
              active === "close"
                ? "bg-white shadow text-orange-500"
                : "text-gray-500"
            }`}
        >
          <HeartHandshake size={16} />
          Close
          <span className="font-medium text-gray-700">
            {closeConnections.length}
          </span>
        </button>

      </div>

      {/* Content */}
      {list.length > 0 ? (
        <div className="space-y-3">
          {list.map((item, i) => (
            <ExpandableCard
              key={i}
              item={item}
              showRelationship={active === "close"}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-sm text-gray-400">
          No {active === "connections" ? "connections" : "close connections"} added yet.
        </div>
      )}

    </div>
  );
}

/* ---------------- Expandable Card ---------------- */

function ExpandableCard({ item, showRelationship }) {
  const [open, setOpen] = useState(false);
  const initials = getInitials(item?.name);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

      {/* Header */}
      <div
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition"
      >
        <div className="flex items-center gap-3">

          {/* Avatar with initials */}
          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-semibold text-sm">
            {initials}
          </div>

          <div>
            <p className="font-medium text-gray-800">
              {item?.name || "-"}
            </p>

            {showRelationship && item?.relationship && (
              <p className="text-xs text-orange-500">
                {item.relationship}
              </p>
            )}
          </div>

        </div>

        <ChevronDown
          size={18}
          className={`text-gray-400 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </div>

      {/* Expandable Body */}
      <div
        className={`transition-all duration-300 overflow-hidden ${
          open ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-4 pb-4 space-y-2 text-sm text-gray-600">

          {item?.phone && (
            <div className="flex items-center gap-2">
              <Phone size={14} />
              {item.phone}
            </div>
          )}

          {item?.email && (
            <div className="flex items-center gap-2">
              <Mail size={14} />
              {item.email}
            </div>
          )}

        </div>
      </div>

    </div>
  );
}

/* ---------------- Helper ---------------- */

function getInitials(name = "") {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}