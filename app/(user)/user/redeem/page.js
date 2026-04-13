"use client";

import { useEffect, useMemo, useState } from "react";
import { Gift, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/authContext";
import { useToast } from "@/components/ui/ToastProvider";
import {
  acceptRedeemAgreement,
  fetchRedeemUserProfile,
  getAveragePercent,
  getOriginalPercent,
  submitRedeemRequest,
} from "@/services/redeemService";
import UserPageHeader from "@/components/user/UserPageHeader";

export default function RedeemRequestPage() {
  const { user, loading } = useAuth();
  const toast = useToast();

  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState("");
  const [selectedItemName, setSelectedItemName] = useState("");
  const [multipleItemNames, setMultipleItemNames] = useState([]);
  const [originalPercent, setOriginalPercent] = useState(0);
  const [enhanceRequired, setEnhanceRequired] = useState("");
  const [enhancedPercent, setEnhancedPercent] = useState(0);
  const [finalPercent, setFinalPercent] = useState(0);

  useEffect(() => {
    if (loading) return;

    const loadProfile = async () => {
      try {
        setLoadingProfile(true);
        const ujbCode = user?.profile?.ujbCode;
        if (!ujbCode) {
          setProfile(null);
          return;
        }

        setProfile(await fetchRedeemUserProfile(ujbCode));
      } catch (error) {
        console.error(error);
        toast.error("Unable to load redemption profile.");
      } finally {
        setLoadingProfile(false);
      }
    };

    loadProfile();
  }, [loading, toast, user]);

  const allItems = useMemo(() => {
    if (!profile) return [];
    return [...profile.services, ...profile.products];
  }, [profile]);

  const selectedItem = useMemo(
    () => allItems.find((item) => item.name === selectedItemName) || null,
    [allItems, selectedItemName]
  );

  const selectedMultipleItems = useMemo(
    () => allItems.filter((item) => multipleItemNames.includes(item.name)),
    [allItems, multipleItemNames]
  );

  const resetPercentState = () => {
    setSelectedItemName("");
    setMultipleItemNames([]);
    setOriginalPercent(0);
    setEnhanceRequired("");
    setEnhancedPercent(0);
    setFinalPercent(0);
  };

  const handleModeChange = (value) => {
    setMode(value);
    resetPercentState();

    if (value === "all") {
      const average = getAveragePercent(allItems);
      setOriginalPercent(average);
      setFinalPercent(average);
    }
  };

  const handleSingleChange = (value) => {
    setSelectedItemName(value);
    const nextItem = allItems.find((item) => item.name === value);
    const percent = getOriginalPercent(nextItem);
    setOriginalPercent(percent);
    setFinalPercent(percent);
    setEnhanceRequired("");
    setEnhancedPercent(0);
  };

  const handleMultipleChange = (value) => {
    const nextNames = multipleItemNames.includes(value)
      ? multipleItemNames.filter((name) => name !== value)
      : [...multipleItemNames, value];

    setMultipleItemNames(nextNames);

    const nextItems = allItems.filter((item) => nextNames.includes(item.name));
    const average = getAveragePercent(nextItems);
    setOriginalPercent(average);
    setFinalPercent(average);
    setEnhanceRequired("");
    setEnhancedPercent(0);
  };

  const handleAcceptAgreement = async () => {
    if (!profile?.ujbCode) return;

    try {
      await acceptRedeemAgreement(profile.ujbCode);
      setProfile((prev) => ({ ...prev, agreementAccepted: true }));
      toast.success("Agreement accepted.");
    } catch (error) {
      console.error(error);
      toast.error("Unable to accept agreement.");
    }
  };

  const handleSubmit = async () => {
    if (!profile) return;

    if (!mode) {
      toast.error("Select a redeem mode.");
      return;
    }

    if (mode === "single" && !selectedItem) {
      toast.error("Select one item.");
      return;
    }

    if (mode === "multiple" && !selectedMultipleItems.length) {
      toast.error("Select at least one item.");
      return;
    }

    try {
      setSubmitting(true);
      await submitRedeemRequest({
        profile,
        mode,
        selectedItem,
        multipleItems: selectedMultipleItems,
        originalPercent,
        enhanceRequired,
        enhancedPercent,
        finalPercent,
      });

      toast.success("Redeem request submitted.");
      setMode("");
      resetPercentState();
    } catch (error) {
      console.error(error);
      toast.error("Unable to submit request.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || loadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        Unable to load your redemption profile.
      </div>
    );
  }

  if (!profile.agreementAccepted) {
    return (
      <main className="min-h-screen py-6">
        <div className="space-y-5">
          <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
            <UserPageHeader
              title="CC Redemption Agreement"
              description="Confirm the redemption terms before you submit any marketplace redemption request for review."
              icon={ShieldCheck}
            />
            <p className="mt-4 text-sm leading-6 text-slate-600">
              Before requesting a CC redemption, please confirm that the agreed
              percentages and item details are correct and ready for admin review.
            </p>
            <button
              onClick={handleAcceptAgreement}
              className="mt-6 rounded-2xl bg-orange-500 px-5 py-3 text-sm font-medium text-white transition hover:bg-orange-600"
            >
              Accept Agreement
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen py-6">
      <div className="space-y-5">
        <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
          <UserPageHeader
            title="CC Redemption Request"
            description="Select the services or products you want to submit for redemption and review your agreed percentages before sending."
            icon={Gift}
          />

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <SummaryCard
              label="Member"
              value={profile.name}
              subvalue={profile.ujbCode}
            />
            <SummaryCard
              label="Inventory"
              value={`${allItems.length} items available`}
              subvalue={`${profile.services.length} services and ${profile.products.length} products`}
            />
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200 space-y-6">
          <FormSelect
            label="Redeem Mode"
            value={mode}
            onChange={handleModeChange}
            options={[
              { value: "", label: "Select mode" },
              { value: "single", label: "Single item" },
              { value: "multiple", label: "Multiple items" },
              { value: "all", label: "All items" },
            ]}
          />

          {mode === "single" && (
            <FormSelect
              label="Select Item"
              value={selectedItemName}
              onChange={handleSingleChange}
              options={[
                { value: "", label: "Choose one" },
                ...allItems.map((item) => ({
                  value: item.name,
                  label: item.name,
                })),
              ]}
            />
          )}

          {mode === "multiple" && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-700">
                Select Items
              </label>
              <div className="grid gap-3 md:grid-cols-2">
                {allItems.map((item) => {
                  const active = multipleItemNames.includes(item.name);

                  return (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => handleMultipleChange(item.name)}
                      className={`rounded-2xl border px-4 py-3 text-left transition ${
                        active
                          ? "border-orange-400 bg-orange-50"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <p className="font-medium text-slate-800">{item.name}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        Agreed {getOriginalPercent(item)}%
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {originalPercent > 0 && (
            <div className="grid gap-4 md:grid-cols-2">
              <ReadOnlyField label="Original Agreed %" value={originalPercent} />

              <FormSelect
                label="Enhancement Required?"
                value={enhanceRequired}
                onChange={(value) => {
                  setEnhanceRequired(value);
                  if (value === "NO") {
                    setEnhancedPercent(0);
                    setFinalPercent(originalPercent);
                  }
                }}
                options={[
                  { value: "", label: "Select" },
                  { value: "YES", label: "Yes" },
                  { value: "NO", label: "No" },
                ]}
              />
            </div>
          )}

          {enhanceRequired === "YES" && (
            <div className="grid gap-4 md:grid-cols-2">
              <EditableField
                label="Enhanced %"
                type="number"
                value={enhancedPercent}
                onChange={(value) => {
                  const extra = Number(value || 0);
                  setEnhancedPercent(extra);
                  setFinalPercent(originalPercent + extra);
                }}
              />
              <ReadOnlyField label="Final Agreed %" value={finalPercent} />
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="rounded-2xl bg-orange-500 px-5 py-3 text-sm font-medium text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {submitting ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

function SummaryCard({ label, value, subvalue }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 font-semibold text-slate-800">{value}</p>
      <p className="text-sm text-slate-500">{subvalue}</p>
    </div>
  );
}

function FormSelect({ label, value, onChange, options }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-400"
      >
        {options.map((option) => (
          <option key={option.value || option.label} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function ReadOnlyField({ label, value }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        value={value}
        disabled
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600"
      />
    </div>
  );
}

function EditableField({ label, value, onChange, type = "text" }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-400"
      />
    </div>
  );
}
