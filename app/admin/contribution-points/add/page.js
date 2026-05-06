"use client";

import { useState } from "react";
import Card from "@/components/ui/Card";
import Text from "@/components/ui/Text";
import Button from "@/components/ui/Button";
import {
  assignCpActivityToMember,
  fetchActiveCpActivityDefinitions,
  searchCpMembersByName,
} from "@/services/adminContributionPointService";

export default function ContributionPointAddPage() {
  const [cpActivities, setCpActivities] = useState([]);
  const [selectedActivityId, setSelectedActivityId] = useState("");
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [searchName, setSearchName] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState({});

  const getFormErrors = () => {
    const nextErrors = {};
    if (!searchName.trim() || !selectedMember) {
      nextErrors.member = "Please select a member from the search results.";
    }
    if (!selectedActivity) {
      nextErrors.activity = "Please select an activity.";
    }
    return nextErrors;
  };

  const loadActivities = async () => {
    if (cpActivities.length > 0) {
      return;
    }

    try {
      const rows = await fetchActiveCpActivityDefinitions();
      setCpActivities(rows);
    } catch (error) {
      console.error("Failed to load active CP activities", error);
      setMessage("Could not load active CP activities.");
    }
  };

  const handleSearchChange = async (event) => {
    const value = event.target.value;
    setSearchName(value);
    setSelectedMember(null);
    setMessage("");
    setErrors((current) => ({ ...current, member: "" }));

    if (value.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setLoadingMembers(true);

    try {
      const results = await searchCpMembersByName(value);
      setSearchResults(results);
    } catch (error) {
      console.error("Failed to search CP members", error);
      setMessage("Could not search members.");
      setSearchResults([]);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleSelectMember = (member) => {
    setSelectedMember(member);
    setSearchName(member.name);
    setSearchResults([]);
    setErrors((current) => ({ ...current, member: "" }));
  };

  const handleActivityChange = async (event) => {
    const nextId = event.target.value;
    setSelectedActivityId(nextId);
    setMessage("");
    setErrors((current) => ({ ...current, activity: "" }));

    await loadActivities();

    const activity = cpActivities.find((item) => item.id === nextId) || null;
    setSelectedActivity(activity);
  };

  const handleFocusActivity = async () => {
    await loadActivities();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = getFormErrors();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setMessage("Please fix the form errors before submitting.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      await assignCpActivityToMember(selectedMember, selectedActivity);
      setMessage("Activity added successfully.");
      setSearchName("");
      setSearchResults([]);
      setSelectedMember(null);
      setSelectedActivityId("");
      setSelectedActivity(null);
      setErrors({});
    } catch (error) {
      console.error("Failed to assign CP activity", error);
      setMessage(error.message || "Could not add the activity.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Text variant="muted">
          Assign an active contribution point activity to a member.
        </Text>
      </div>

      {message ? (
        <Card
          className={`border shadow-sm ${
            message.toLowerCase().includes("success")
              ? "border-emerald-200 bg-emerald-50"
              : "border-orange-200 bg-orange-50"
          }`}
        >
          <Text
            className={
              message.toLowerCase().includes("success")
                ? "text-emerald-700"
                : "text-orange-700"
            }
          >
            {message}
          </Text>
        </Card>
      ) : null}

      <Card className="space-y-5 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Text variant="caption">Search Member</Text>
            <div className="relative">
              <input
                type="text"
                value={searchName}
                onChange={handleSearchChange}
                placeholder="Type member name"
                className={`w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-slate-400 ${
                  errors.member ? "border-rose-300 bg-rose-50" : "border-slate-200"
                }`}
              />

              {searchResults.length > 0 ? (
                <div className="absolute z-10 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                  {searchResults.map((member) => (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => handleSelectMember(member)}
                      className="block w-full border-b border-slate-100 px-4 py-3 text-left text-sm text-slate-700 last:border-b-0 hover:bg-slate-50"
                    >
                      <div className="font-medium">{member.name}</div>
                      <div className="text-xs text-slate-500">
                        {member.ujbCode} · {member.phoneNumber || "-"}
                      </div>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            {loadingMembers ? <Text variant="caption">Searching members...</Text> : null}
            {errors.member ? <Text className="text-xs text-rose-600">{errors.member}</Text> : null}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Text variant="caption">Phone Number</Text>
              <input
                type="text"
                readOnly
                value={selectedMember?.phoneNumber || ""}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600"
              />
            </div>

            <div className="space-y-2">
              <Text variant="caption">UJB Code</Text>
              <input
                type="text"
                readOnly
                value={selectedMember?.ujbCode || ""}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Text variant="caption">Select Activity</Text>
            <select
              value={selectedActivityId}
              onChange={handleActivityChange}
              onFocus={handleFocusActivity}
              className={`w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none focus:border-slate-400 ${
                errors.activity ? "border-rose-300 bg-rose-50" : "border-slate-200"
              }`}
            >
              <option value="">Select Activity</option>
              {cpActivities.map((activity) => (
                <option key={activity.id} value={activity.id}>
                  {activity.activityName} ({activity.activityNo || activity.id})
                </option>
              ))}
            </select>
            {errors.activity ? (
              <Text className="text-xs text-rose-600">{errors.activity}</Text>
            ) : null}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Text variant="caption">Activity No</Text>
              <input
                type="text"
                readOnly
                value={selectedActivity?.activityNo || selectedActivity?.id || ""}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600"
              />
            </div>

            <div className="space-y-2">
              <Text variant="caption">Points</Text>
              <input
                type="text"
                readOnly
                value={selectedActivity?.points ?? ""}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600"
              />
            </div>

            <div className="space-y-2">
              <Text variant="caption">Mentor Points</Text>
              <input
                type="text"
                readOnly
                value={selectedActivity?.mentorPoints ?? 0}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600"
              />
            </div>

            <div className="space-y-2">
              <Text variant="caption">Category</Text>
              <input
                type="text"
                readOnly
                value={selectedActivity?.category || selectedActivity?.categories?.[0] || ""}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Text variant="caption">Activity Description</Text>
            <textarea
              readOnly
              rows={4}
              value={selectedActivity?.purpose || ""}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600"
            />
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              loading={saving}
              disabled={!selectedMember || !selectedActivity || saving}
            >
              Add Activity
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}


