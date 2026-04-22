"use client";

import React, { useEffect, useMemo, useState } from "react";

import Text from "@/components/ui/Text";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import DateInput from "@/components/ui/DateInput";
import FormField from "@/components/ui/FormField";

const INITIAL_FORM = {
  callDate: "",
  orbiterName: "",
  occasion: "",
  referralId: "",
  eventName: "",
  otherOccasion: "",
  discussionDetails: "",
  orbiterSuggestions: [""],
  teamSuggestions: [""],
  referralPossibilities: [""],
  nextFollowupDate: "",
};

const OCCASION_OPTIONS = [
  { label: "Select", value: "" },
  { label: "Referral Follow up", value: "Referral Follow up" },
  { label: "Rapport building", value: "Rapport building" },
  { label: "Event Calling", value: "Event Calling" },
  { label: "Enquiry Follow ups", value: "Enquiry Follow ups" },
  { label: "Birthday Wishes", value: "Birthday Wishes" },
  { label: "Other", value: "Other" },
];

function normalizeDateOnly(value) {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDate(value) {
  const normalized = normalizeDateOnly(value);
  if (!normalized) return "—";

  const [year, month, day] = normalized.split("-");
  return `${day}/${month}/${year}`;
}

function validateEngagementForm(formData, userList, entries = []) {
  const nextErrors = {};
  const orbiterName = String(formData.orbiterName || "").trim();
  const discussionDetails = String(formData.discussionDetails || "").trim();
  const today = normalizeDateOnly(new Date().toISOString());
  const callDate = normalizeDateOnly(formData.callDate);
  const nextFollowupDate = normalizeDateOnly(formData.nextFollowupDate);
  const latestSavedCallDate = [...entries]
    .map((entry) => normalizeDateOnly(entry?.callDate))
    .filter(Boolean)
    .sort()
    .at(-1);

  if (!callDate) {
    nextErrors.callDate = "Date of calling is required.";
  } else if (callDate < today) {
    nextErrors.callDate = "Date of calling must be today's date.";
  } else if (callDate > today) {
    nextErrors.callDate = "Date of calling cannot be in the future.";
  } else if (latestSavedCallDate && callDate < latestSavedCallDate) {
    nextErrors.callDate =
      "Date of calling cannot be earlier than the latest saved engagement entry.";
  }

  if (!orbiterName) {
    nextErrors.orbiterName = "Orbiter name is required.";
  } else if (
    Array.isArray(userList) &&
    userList.length > 0 &&
    !userList.some((user) => String(user.name || "").trim() === orbiterName)
  ) {
    nextErrors.orbiterName = "Select a valid orbiter from the suggestions.";
  }

  if (!formData.occasion) {
    nextErrors.occasion = "Occasion is required.";
  }

  if (formData.occasion === "Other" && !String(formData.otherOccasion || "").trim()) {
    nextErrors.otherOccasion = "Please specify the occasion.";
  }

  if (!discussionDetails) {
    nextErrors.discussionDetails = "Discussion details are required.";
  } else if (discussionDetails.length < 5) {
    nextErrors.discussionDetails = "Discussion details must be at least 5 characters.";
  }

  if (!nextFollowupDate) {
    nextErrors.nextFollowupDate = "Next follow-up date is required.";
  } else if (callDate && nextFollowupDate < callDate) {
    nextErrors.nextFollowupDate =
      "Next follow-up date cannot be earlier than the call date.";
  }

  return nextErrors;
}

const EngagementForm = ({ id }) => {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [entries, setEntries] = useState([]);
  const [userList, setUserList] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [userSearch, setUserSearch] = useState("");
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState(INITIAL_FORM);

  const sortedEntries = useMemo(
    () =>
      [...entries].sort((a, b) => {
        const left = String(b.updatedAt?.seconds || b.updatedAt || b.callDate || "");
        const right = String(a.updatedAt?.seconds || a.updatedAt || a.callDate || "");
        return left.localeCompare(right);
      }),
    [entries]
  );

  const fetchTabData = async () => {
    if (!id) return;

    try {
      const res = await fetch(`/api/admin/prospects?id=${id}&section=engagementlogs`, {
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || "Failed to load engagement logs");
      }

      const users = Array.isArray(data.users) ? data.users : [];
      setUserList(users);
      setEntries(Array.isArray(data.entries) ? data.entries : []);

      setFormData((prev) => ({
        ...prev,
        orbiterName:
          prev.orbiterName ||
          data.prospect?.orbiterName ||
          "",
      }));
    } catch (err) {
      console.error("Error loading engagement logs:", err);
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchTabData();
  }, [id]);

  const handleSearchUser = (value) => {
    const nextValue = value;
    const lowered = nextValue.toLowerCase();

    setUserSearch(nextValue);
    setFormData((prev) => ({ ...prev, orbiterName: nextValue }));
    setErrors((prev) => ({ ...prev, orbiterName: "" }));

    const filtered = userList.filter((user) =>
      String(user.name || "").toLowerCase().includes(lowered)
    );

    setFilteredUsers(lowered ? filtered.slice(0, 8) : []);
  };

  const handleSelectUser = (user) => {
    const selectedName = user?.name || "";
    setFormData((prev) => ({ ...prev, orbiterName: selectedName }));
    setUserSearch(selectedName);
    setFilteredUsers([]);
    setErrors((prev) => ({ ...prev, orbiterName: "" }));
  };

  const handleChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "occasion" && value !== "Other" ? { otherOccasion: "" } : {}),
    }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSave = async () => {
    if (!id) {
      alert("Prospect ID missing!");
      return;
    }

    const validationErrors = validateEngagementForm(formData, userList, entries);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...formData,
        callDate: normalizeDateOnly(formData.callDate),
        nextFollowupDate: normalizeDateOnly(formData.nextFollowupDate),
        discussionDetails: String(formData.discussionDetails || "").trim(),
        orbiterName: String(formData.orbiterName || "").trim(),
        otherOccasion: String(formData.otherOccasion || "").trim(),
      };

      const res = await fetch(`/api/admin/prospects?id=${id}&section=engagementlogs`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ entry: payload }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || "Failed to save engagement log");
      }

      setEntries(Array.isArray(data.entries) ? data.entries : []);
      setFormData((prev) => ({
        ...INITIAL_FORM,
        orbiterName: prev.orbiterName,
      }));
      setUserSearch("");
      setFilteredUsers([]);
      setErrors({});
      alert("Engagement log saved successfully!");
    } catch (err) {
      console.error("Error saving engagement log:", err);
      alert(err.message || "Failed to save engagement log.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Text variant="h1">Engagement Logs</Text>

      <Card>
        <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Date of Calling" required error={errors.callDate}>
                <DateInput
                  value={formData.callDate}
                  min={normalizeDateOnly(new Date().toISOString())}
                  max={normalizeDateOnly(new Date().toISOString())}
                  onChange={(e) => handleChange("callDate", e.target.value)}
                />
            </FormField>

            <FormField label="Name of the Orbiter" required error={errors.orbiterName}>
              <div className="relative">
                <Input
                  placeholder="Search Orbiter"
                  value={formData.orbiterName}
                  onChange={(e) => handleSearchUser(e.target.value)}
                />

                {filteredUsers.length > 0 && (
                  <div className="absolute z-10 w-full bg-white border rounded mt-1 max-h-40 overflow-auto">
                    {filteredUsers.map((user) => (
                      <div
                        key={user.id}
                        className="px-3 py-2 hover:bg-slate-100 cursor-pointer"
                        onClick={() => handleSelectUser(user)}
                      >
                        {user.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </FormField>

            <FormField label="Occasion" required error={errors.occasion}>
              <Select
                value={formData.occasion}
                onChange={(v) => handleChange("occasion", v)}
                options={OCCASION_OPTIONS}
              />
            </FormField>

            <FormField
              label="Next Follow-up Date"
              required
              error={errors.nextFollowupDate}
            >
              <DateInput
                value={formData.nextFollowupDate}
                min={normalizeDateOnly(formData.callDate)}
                onChange={(e) => handleChange("nextFollowupDate", e.target.value)}
              />
            </FormField>

            {formData.occasion === "Other" && (
              <FormField
                label="Specify Occasion"
                required
                error={errors.otherOccasion}
                className="md:col-span-2"
              >
                <Input
                  value={formData.otherOccasion}
                  onChange={(e) => handleChange("otherOccasion", e.target.value)}
                  placeholder="Enter the specific occasion"
                />
              </FormField>
            )}
          </div>

          <FormField
            label="Discussion Details"
            required
            error={errors.discussionDetails}
          >
            <textarea
              className="w-full border rounded-lg p-3"
              name="discussionDetails"
              rows={4}
              value={formData.discussionDetails}
              onChange={(e) => handleChange("discussionDetails", e.target.value)}
            />
          </FormField>
        </form>
      </Card>

      <Card className="mt-6">
        <Text variant="h3">Saved Engagement Entries</Text>

        {initialLoading ? (
          <Text>Loading...</Text>
        ) : sortedEntries.length === 0 ? (
          <Text>No data found.</Text>
        ) : (
          <div className="overflow-x-auto mt-4">
            <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden">
              <thead className="bg-gray-100 text-gray-700 text-sm">
                <tr>
                  <th className="px-4 py-3 border-b text-left">Date</th>
                  <th className="px-4 py-3 border-b text-left">Orbiter</th>
                  <th className="px-4 py-3 border-b text-left">Occasion</th>
                  <th className="px-4 py-3 border-b text-left">Discussion</th>
                  <th className="px-4 py-3 border-b text-left">Next Followup</th>
                  <th className="px-4 py-3 border-b text-left">Last Updated</th>
                </tr>
              </thead>

              <tbody className="text-sm text-gray-700">
                {sortedEntries.map((entry, index) => (
                  <tr
                    key={entry.id}
                    className={`hover:bg-gray-50 ${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50"
                    }`}
                  >
                    <td className="px-4 py-3 border-b">{formatDate(entry.callDate)}</td>
                    <td className="px-4 py-3 border-b">{entry.orbiterName || "—"}</td>
                    <td className="px-4 py-3 border-b">
                      <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-700">
                        {entry.occasion === "Other" && entry.otherOccasion
                          ? entry.otherOccasion
                          : entry.occasion || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 border-b max-w-xs truncate">
                      {entry.discussionDetails || "—"}
                    </td>
                    <td className="px-4 py-3 border-b">
                      {formatDate(entry.nextFollowupDate)}
                    </td>
                    <td className="px-4 py-3 border-b text-gray-500">
                      {entry.updatedAt
                        ? formatDate(
                            entry.updatedAt.seconds
                              ? entry.updatedAt.toDate?.() || new Date(entry.updatedAt.seconds * 1000)
                              : entry.updatedAt
                          )
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="flex justify-end mt-4">
        <Button onClick={handleSave} disabled={loading}>
          {loading ? "Saving..." : "Save"}
        </Button>
      </div>
    </>
  );
};

export default EngagementForm;
