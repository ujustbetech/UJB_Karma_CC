"use client";

import { useEffect, useMemo, useState } from "react";
import { PlusCircle } from "lucide-react";
import { useToast } from "@/components/ui/ToastProvider";
import {
  createApprovedRedeemDeal,
  fetchAllRedeemUsers,
  getAveragePercent,
  getOriginalPercent,
} from "@/services/adminRedeemService";

export default function AdminAddRedeemPage() {
  const toast = useToast();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [mode, setMode] = useState("");
  const [category, setCategory] = useState("");
  const [selectedItemName, setSelectedItemName] = useState("");
  const [multipleItemNames, setMultipleItemNames] = useState([]);
  const [originalPercent, setOriginalPercent] = useState(0);
  const [enhanceRequired, setEnhanceRequired] = useState("");
  const [enhancedPercent, setEnhancedPercent] = useState(0);
  const [finalPercent, setFinalPercent] = useState(0);
  const [minPoints, setMinPoints] = useState("");
  const [maxPoints, setMaxPoints] = useState("");

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        setUsers(await fetchAllRedeemUsers());
      } catch (error) {
        console.error(error);
        toast.error("Unable to load users.");
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, [toast]);

  const filteredUsers = useMemo(() => {
    const term = search.toLowerCase();
    if (!term) return users;

    return users.filter((user) =>
      [user.name, user.ujbCode, user.phone].filter(Boolean).join(" ").toLowerCase().includes(term)
    );
  }, [search, users]);

  const selectedUser = users.find((item) => item.id === selectedUserId) || null;
  const allItems = useMemo(() => {
    if (!selectedUser) return [];
    return [...selectedUser.services, ...selectedUser.products];
  }, [selectedUser]);

  const selectedItem = allItems.find((item) => item.name === selectedItemName) || null;
  const selectedMultipleItems = allItems.filter((item) => multipleItemNames.includes(item.name));

  const resetModeState = () => {
    setSelectedItemName("");
    setMultipleItemNames([]);
    setOriginalPercent(0);
    setEnhanceRequired("");
    setEnhancedPercent(0);
    setFinalPercent(0);
    setMinPoints("");
    setMaxPoints("");
  };

  const handleModeChange = (value) => {
    setMode(value);
    resetModeState();

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

  const toggleMultipleItem = (value) => {
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

  const handleSubmit = async () => {
    if (!selectedUser || !mode || !category || !minPoints || !maxPoints) {
      toast.error("Fill all required fields.");
      return;
    }

    if (Number(minPoints) > Number(maxPoints)) {
      toast.error("Min points cannot exceed max points.");
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
      await createApprovedRedeemDeal({
        user: selectedUser,
        category,
        mode,
        selectedItem,
        multipleItems: selectedMultipleItems,
        originalPercent,
        enhanceRequired,
        enhancedPercent,
        finalPercent,
        minPoints,
        maxPoints,
      });

      toast.success("Redeem deal added.");
      setSelectedUserId("");
      setSearch("");
      setMode("");
      setCategory("");
      resetModeState();
    } catch (error) {
      console.error(error);
      toast.error("Unable to add redeem deal.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="space-y-6">
  
      <div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-200 space-y-6">
        <EditableField
          label="Search Member"
          value={search}
          onChange={setSearch}
          placeholder="Search by name, phone, or UJB code"
        />

        <FormSelect
          label="Select Member"
          value={selectedUserId}
          onChange={(value) => {
            setSelectedUserId(value);
            setMode("");
            setCategory("");
            resetModeState();
          }}
          options={[
            { value: "", label: loading ? "Loading users..." : "Choose a member" },
            ...filteredUsers.map((user) => ({
              value: user.id,
              label: `${user.name} | ${user.ujbCode}`,
            })),
          ]}
        />

        {selectedUser && (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <FormSelect
                label="Mode"
                value={mode}
                onChange={handleModeChange}
                options={[
                  { value: "", label: "Select mode" },
                  { value: "single", label: "Single item" },
                  { value: "multiple", label: "Multiple items" },
                  { value: "all", label: "All items" },
                ]}
              />

              <FormSelect
                label="Category"
                value={category}
                onChange={setCategory}
                options={[
                  { value: "", label: "Select category" },
                  { value: "H", label: "Health" },
                  { value: "W", label: "Wealth" },
                  { value: "R", label: "Relationship" },
                ]}
              />
            </div>

            {mode === "single" && (
              <FormSelect
                label="Select Item"
                value={selectedItemName}
                onChange={handleSingleChange}
                options={[
                  { value: "", label: "Choose one" },
                  ...allItems.map((item) => ({ value: item.name, label: item.name })),
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
                        onClick={() => toggleMultipleItem(item.name)}
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

            {((mode === "single" && selectedItem) ||
              (mode === "multiple" && selectedMultipleItems.length > 0) ||
              mode === "all") && (
              <div className="grid gap-4 md:grid-cols-2">
                <EditableField
                  label="Min Redeem Points"
                  type="number"
                  value={minPoints}
                  onChange={setMinPoints}
                />
                <EditableField
                  label="Max Redeem Points"
                  type="number"
                  value={maxPoints}
                  onChange={setMaxPoints}
                />
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="rounded-2xl bg-orange-500 px-5 py-3 text-sm font-medium text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {submitting ? "Adding..." : "Add Redeem Deal"}
              </button>
            </div>
          </>
        )}
      </div>
    </main>
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

function EditableField({ label, value, onChange, type = "text", placeholder }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-400"
      />
    </div>
  );
}


