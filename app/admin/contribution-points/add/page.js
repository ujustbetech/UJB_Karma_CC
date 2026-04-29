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
  };

  const handleActivityChange = async (event) => {
    const nextId = event.target.value;
    setSelectedActivityId(nextId);
    setMessage("");

    await loadActivities();

    const activity = cpActivities.find((item) => item.id === nextId) || null;
    setSelectedActivity(activity);
  };

  const handleFocusActivity = async () => {
    await loadActivities();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedMember || !selectedActivity) {
      setMessage("Please select both a member and an activity.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      await assignCpActivityToMember(selectedMember, selectedActivity);
      setMessage("Activity added successfully.");
      setSelectedActivityId("");
      setSelectedActivity(null);
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
        <Card className="border border-orange-200 bg-orange-50 shadow-sm">
          <Text className="text-orange-700">{message}</Text>
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
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
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
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400"
            >
              <option value="">Select Activity</option>
              {cpActivities.map((activity) => (
                <option key={activity.id} value={activity.id}>
                  {activity.activityName}
                </option>
              ))}
            </select>
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
            <Button type="submit" loading={saving}>
              Add Activity
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
