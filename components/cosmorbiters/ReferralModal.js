"use client";

import { X, User, Users } from "lucide-react";
import { useMemo, useState } from "react";
import {
  buildReferralDuplicateKey,
  validateReferralPayload,
} from "@/lib/referrals/referralWorkflow.mjs";

export default function ReferralModal({
  services,
  products,
  handlePassReferral,
  orbiterDetails,
  loading,
  onClose,
  userDetails,
  existingDuplicateLookup = new Set(),
}) {
  const [selectedIndex, setSelectedIndex] = useState("");
  const [selectedFor, setSelectedFor] = useState("self");
  const [leadDescription, setLeadDescription] = useState("");
  const [otherName, setOtherName] = useState("");
  const [otherPhone, setOtherPhone] = useState("");
  const [otherEmail, setOtherEmail] = useState("");
  const [submitError, setSubmitError] = useState("");

  const allItems = [...services, ...products];

  const selectedItem =
    selectedIndex !== "" ? allItems[Number(selectedIndex)] : null;
  const duplicateKey = useMemo(() => {
    if (!selectedItem || !orbiterDetails || !userDetails) {
      return "";
    }

    return buildReferralDuplicateKey({
      selectedItem,
      selectedFor,
      otherName,
      otherPhone,
      otherEmail,
      cosmoDetails: userDetails,
      orbiterDetails,
    });
  }, [
    selectedItem,
    selectedFor,
    otherName,
    otherPhone,
    otherEmail,
    userDetails,
    orbiterDetails,
  ]);
  const duplicateBlocked =
    Boolean(duplicateKey) && existingDuplicateLookup.has(duplicateKey);
  const blockingMessage = duplicateBlocked
    ? "You have already passed this referral."
    : "";

  const submitReferral = async () => {
    if (loading || blockingMessage) {
      return;
    }

    const validation = validateReferralPayload({
      selectedItem,
      leadDescription,
      selectedFor,
      otherName,
      otherPhone,
      otherEmail,
      cosmoDetails: userDetails,
      orbiterDetails,
    });

    if (!validation.ok) {
      setSubmitError(validation.message);
      return;
    }

    setSubmitError("");

    await handlePassReferral({
      selectedItem,
      leadDescription,
      selectedFor,
      otherName,
      otherPhone,
      otherEmail,
    });
  };

  return (
    <div className="fixed inset-0 z-[99] flex items-end justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-t-3xl p-6 max-h-[90vh] overflow-y-auto">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Pass Referral</h2>
          <button onClick={onClose} disabled={loading}>
            <X size={22} />
          </button>
        </div>

        {/* SERVICE / PRODUCT */}
        <div className="mb-4">
          <label className="text-sm font-medium text-gray-700">
            Service / Product *
          </label>
          <select
            className="w-full mt-2 border rounded-xl p-3 text-sm"
            value={selectedIndex}
            onChange={(e) => {
              setSelectedIndex(e.target.value);
              setSubmitError("");
            }}
            disabled={loading}
          >
            <option value="">Select option</option>
            {allItems.map((item, i) => (
              <option key={i} value={i}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        {/* SELF / SOMEONE */}
        <div className="flex gap-3 mb-4">
          <button
            type="button"
            disabled={loading}
            onClick={() => {
              setSelectedFor("self");
              setSubmitError("");
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl border transition ${
              selectedFor === "self"
                ? "bg-orange-50 border-orange-400 text-orange-600"
                : "border-gray-300"
            }`}
          >
            <User size={16} />
            For Self
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => {
              setSelectedFor("someone");
              setSubmitError("");
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl border transition ${
              selectedFor === "someone"
                ? "bg-orange-50 border-orange-400 text-orange-600"
                : "border-gray-300"
            }`}
          >
            <Users size={16} />
            For Someone
          </button>
        </div>

        {/* LEAD DESCRIPTION */}
        <div className="mb-4">
          <label className="text-sm font-medium text-gray-700">
            Lead Description *
          </label>
          <textarea
            rows={3}
            className="w-full mt-2 border rounded-xl p-3 text-sm"
            placeholder="Enter short description..."
            value={leadDescription}
            onChange={(e) => {
              setLeadDescription(e.target.value);
              setSubmitError("");
            }}
            disabled={loading}
          />
        </div>

        {/* OTHER PERSON DETAILS */}
        {selectedFor === "someone" && (
          <div className="space-y-3 mb-6">
            <input
              type="text"
              placeholder="Name *"
              className="w-full border rounded-xl p-3 text-sm"
              value={otherName}
              onChange={(e) => {
                setOtherName(e.target.value);
                setSubmitError("");
              }}
              disabled={loading}
            />

            <input
              type="tel"
              placeholder="Phone *"
              className="w-full border rounded-xl p-3 text-sm"
              value={otherPhone}
              onChange={(e) => {
                setOtherPhone(e.target.value);
                setSubmitError("");
              }}
              disabled={loading}
            />

            <input
              type="email"
              placeholder="Email"
              className="w-full border rounded-xl p-3 text-sm"
              value={otherEmail}
              onChange={(e) => {
                setOtherEmail(e.target.value);
                setSubmitError("");
              }}
              disabled={loading}
            />
          </div>
        )}

        {/* SUBMIT */}
        {(blockingMessage || submitError) && (
          <p className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
            {blockingMessage || submitError}
          </p>
        )}
        <button
          onClick={submitReferral}
          disabled={loading || Boolean(blockingMessage)}
          className="w-full bg-orange-500 text-white py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Passing..." : blockingMessage ? "Already Passed" : "Send Referral"}
        </button>

      </div>
    </div>
  );
}
