"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Card from "@/components/ui/Card";
import Text from "@/components/ui/Text";
import {
  filterCpActivities,
  getCpCategoryLabel,
} from "@/services/contributionPointShared";
import { fetchCpBoardSummary } from "@/services/adminContributionPointService";

const CATEGORY_OPTIONS = ["All", "R", "H", "W"];

export default function AdminContributionPointDetailsPage() {
  const params = useParams();
  const ujbCode = params?.ujbCode;
  const [summary, setSummary] = useState({
    user: null,
    activities: [],
    totals: { total: 0, relation: 0, health: 0, wealth: 0 },
  });
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ujbCode) {
      setLoading(false);
      return;
    }

    let active = true;

    const loadSummary = async () => {
      try {
        const nextSummary = await fetchCpBoardSummary(ujbCode);
        if (active) {
          setSummary(nextSummary);
        }
      } catch (error) {
        console.error("Failed to load CP member detail", error);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadSummary();

    return () => {
      active = false;
    };
  }, [ujbCode]);

  const filteredActivities = useMemo(
    () => filterCpActivities(summary.activities, activeCategory, searchTerm),
    [summary.activities, activeCategory, searchTerm]
  );

  return (
    <div className="space-y-6">
      <div>
        <Text as="h1" variant="h1">
          {summary.user?.name || "Contribution Point Detail"}
        </Text>
        <Text variant="muted">
          {ujbCode || "-"} · {summary.user?.role || "Member"}
        </Text>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="shadow-sm">
          <Text variant="caption">Total</Text>
          <Text as="p" variant="h1">{summary.totals.total}</Text>
        </Card>
        <Card className="shadow-sm">
          <Text variant="caption">Relation</Text>
          <Text as="p" variant="h1">{summary.totals.relation}</Text>
        </Card>
        <Card className="shadow-sm">
          <Text variant="caption">Health</Text>
          <Text as="p" variant="h1">{summary.totals.health}</Text>
        </Card>
        <Card className="shadow-sm">
          <Text variant="caption">Wealth</Text>
          <Text as="p" variant="h1">{summary.totals.wealth}</Text>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        {CATEGORY_OPTIONS.map((option) => (
          <button
            key={option}
            onClick={() => setActiveCategory(option)}
            className={`rounded-full px-3 py-2 text-sm transition ${
              activeCategory === option
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-600 border border-slate-200"
            }`}
          >
            {option === "All" ? "All" : getCpCategoryLabel(option)}
          </button>
        ))}
      </div>

      <input
        type="text"
        placeholder="Search activity or purpose..."
        value={searchTerm}
        onChange={(event) => setSearchTerm(event.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400"
      />

      <Card className="overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-6">
            <Text variant="muted">Loading contribution point activity...</Text>
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="p-6">
            <Text variant="muted">No contribution point activities found.</Text>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="text-left text-slate-500">
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Activity</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Points</th>
                  <th className="px-4 py-3 font-medium">Purpose</th>
                </tr>
              </thead>
              <tbody>
                {filteredActivities.map((activity) => (
                  <tr key={activity.id} className="border-t border-slate-100">
                    <td className="px-4 py-3">
                      {activity.addedAt?.seconds
                        ? new Date(activity.addedAt.seconds * 1000).toLocaleDateString()
                        : activity.month || "-"}
                    </td>
                    <td className="px-4 py-3">{activity.activityName}</td>
                    <td className="px-4 py-3">
                      {getCpCategoryLabel(activity.categories?.[0] || "W")}
                    </td>
                    <td className="px-4 py-3">{activity.points || 0}</td>
                    <td className="px-4 py-3">{activity.purpose || "-"}</td>
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


