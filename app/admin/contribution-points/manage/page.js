"use client";

import { useEffect, useMemo, useState } from "react";
import Card from "@/components/ui/Card";
import Text from "@/components/ui/Text";
import Button from "@/components/ui/Button";
import {
  deleteCpActivityDefinition,
  fetchCpActivityDefinitions,
  saveCpActivityDefinition,
  toggleCpActivityStatus,
} from "@/services/adminContributionPointService";

const EMPTY_FORM = {
  activityName: "",
  category: "R",
  points: "",
  purpose: "",
  automationType: "AUTO",
  status: "ACTIVE",
};

const TABS = ["ALL", "AUTO", "SEMI", "MANUAL"];

export default function ContributionPointActivityManagePage() {
  const [activities, setActivities] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState("ALL");
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadActivities = async () => {
    setLoading(true);
    setError("");

    try {
      const rows = await fetchCpActivityDefinitions();
      setActivities(rows);
    } catch (loadError) {
      console.error("Failed to load CP activities", loadError);
      setError("Could not load CP activities.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivities();
  }, []);

  const filteredActivities = useMemo(() => {
    return [...activities]
      .filter((activity) => {
        if (activeTab !== "ALL" && activity.automationType !== activeTab) {
          return false;
        }

        if (
          search &&
          !activity.activityName?.toLowerCase().includes(search.toLowerCase())
        ) {
          return false;
        }

        return true;
      })
      .sort((left, right) => {
        if (sortBy === "points") return Number(right.points || 0) - Number(left.points || 0);
        if (sortBy === "usage") return Number(right.usageCount || 0) - Number(left.usageCount || 0);
        return String(left.activityName || "").localeCompare(String(right.activityName || ""));
      });
  }, [activities, activeTab, search, sortBy]);

  const openCreateForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(true);
    setError("");
  };

  const openEditForm = (activity) => {
    setEditingId(activity.id);
    setForm({
      activityName: activity.activityName || "",
      category: activity.category || activity.categories?.[0] || "R",
      points: activity.points || "",
      purpose: activity.purpose || "",
      automationType: activity.automationType || "AUTO",
      status: activity.status || "ACTIVE",
    });
    setShowForm(true);
    setError("");
  };

  const handleSave = async () => {
    if (!form.activityName.trim() || form.points === "") {
      setError("Activity name and points are required.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await saveCpActivityDefinition(form, editingId);
      setForm(EMPTY_FORM);
      setEditingId(null);
      setShowForm(false);
      await loadActivities();
    } catch (saveError) {
      console.error("Failed to save CP activity", saveError);
      setError("Could not save the activity.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (activity) => {
    try {
      await toggleCpActivityStatus(activity);
      await loadActivities();
    } catch (toggleError) {
      console.error("Failed to toggle CP activity status", toggleError);
      setError("Could not update activity status.");
    }
  };

  const handleDelete = async (activity) => {
    try {
      await deleteCpActivityDefinition(activity);
      await loadActivities();
    } catch (deleteError) {
      console.error("Failed to delete CP activity", deleteError);
      setError(deleteError.message || "Could not delete activity.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
      
          <Text variant="muted">
            Create, update, activate, and retire contribution point activities.
          </Text>
        </div>

        <Button onClick={openCreateForm}>Add Activity</Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-full px-4 py-2 text-sm transition ${
              activeTab === tab
                ? "bg-slate-900 text-white"
                : "border border-slate-200 bg-white text-slate-600"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_220px]">
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search activity name"
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400"
        />

        <select
          value={sortBy}
          onChange={(event) => setSortBy(event.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400"
        >
          <option value="name">Sort by Name</option>
          <option value="points">Sort by Points</option>
          <option value="usage">Sort by Usage</option>
        </select>
      </div>

      {error ? (
        <Card className="border border-rose-200 bg-rose-50 shadow-sm">
          <Text className="text-rose-700">{error}</Text>
        </Card>
      ) : null}

      {showForm ? (
        <Card className="space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <Text as="h2" variant="h2">
              {editingId ? "Edit Activity" : "Add Activity"}
            </Text>
            <Button variant="ghost" onClick={() => setShowForm(false)}>
              Close
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Text variant="caption">Activity Name</Text>
              <input
                type="text"
                value={form.activityName}
                onChange={(event) =>
                  setForm((current) => ({ ...current, activityName: event.target.value }))
                }
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
              />
            </div>

            <div className="space-y-2">
              <Text variant="caption">Category</Text>
              <select
                value={form.category}
                onChange={(event) =>
                  setForm((current) => ({ ...current, category: event.target.value }))
                }
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
              >
                <option value="R">Relationship</option>
                <option value="W">Wealth</option>
                <option value="H">Health</option>
              </select>
            </div>

            <div className="space-y-2">
              <Text variant="caption">Points</Text>
              <input
                type="number"
                value={form.points}
                onChange={(event) =>
                  setForm((current) => ({ ...current, points: event.target.value }))
                }
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
              />
            </div>

            <div className="space-y-2">
              <Text variant="caption">Automation Type</Text>
              <select
                value={form.automationType}
                onChange={(event) =>
                  setForm((current) => ({ ...current, automationType: event.target.value }))
                }
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
              >
                <option value="AUTO">Auto</option>
                <option value="SEMI">Semi-Auto</option>
                <option value="MANUAL">Manual</option>
              </select>
            </div>

            <div className="space-y-2">
              <Text variant="caption">Status</Text>
              <select
                value={form.status}
                onChange={(event) =>
                  setForm((current) => ({ ...current, status: event.target.value }))
                }
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Text variant="caption">Purpose</Text>
              <textarea
                value={form.purpose}
                onChange={(event) =>
                  setForm((current) => ({ ...current, purpose: event.target.value }))
                }
                rows={4}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} loading={saving}>
              {editingId ? "Update Activity" : "Add Activity"}
            </Button>
          </div>
        </Card>
      ) : null}

      <Card className="overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-6">
            <Text variant="muted">Loading CP activities...</Text>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="text-left text-slate-500">
                  <th className="px-4 py-3 font-medium">#</th>
                  <th className="px-4 py-3 font-medium">Activity</th>
                  <th className="px-4 py-3 font-medium">Cat</th>
                  <th className="px-4 py-3 font-medium">Points</th>
                  <th className="px-4 py-3 font-medium">Automation</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Usage</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredActivities.map((activity, index) => (
                  <tr
                    key={activity.id}
                    className={`border-t border-slate-100 ${
                      activity.status === "INACTIVE" ? "bg-slate-50" : ""
                    }`}
                  >
                    <td className="px-4 py-3">{index + 1}</td>
                    <td className="px-4 py-3">{activity.activityName}</td>
                    <td className="px-4 py-3">{activity.category}</td>
                    <td className="px-4 py-3">{activity.points}</td>
                    <td className="px-4 py-3">{activity.automationType}</td>
                    <td className="px-4 py-3">{activity.status}</td>
                    <td className="px-4 py-3">{activity.usageCount}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditForm(activity)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant={activity.status === "ACTIVE" ? "secondary" : "primary"}
                          onClick={() => handleToggleStatus(activity)}
                        >
                          {activity.status === "ACTIVE" ? "Deactivate" : "Activate"}
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleDelete(activity)}
                          disabled={activity.usageCount > 0}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
