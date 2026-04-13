"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, LayoutGrid, Heart, Users, Wallet } from "lucide-react";
import Card from "@/components/ui/Card";
import Text from "@/components/ui/Text";
import Button from "@/components/ui/Button";
import {
  fetchCpBoardSummary,
  filterCpActivities,
  getCpCategoryLabel,
} from "@/services/contributionPointService";

const FILTERS = [
  { key: "All", label: "All", icon: LayoutGrid },
  { key: "R", label: "Relation", icon: Users },
  { key: "H", label: "Health", icon: Heart },
  { key: "W", label: "Wealth", icon: Wallet },
];

export default function ContributionPointBoardPage() {
  const params = useParams();
  const ujbCode = params?.ujbCode;
  const [summary, setSummary] = useState({
    user: null,
    activities: [],
    totals: { total: 0, relation: 0, health: 0, wealth: 0 },
  });
  const [activeFilter, setActiveFilter] = useState("All");
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
        console.error("Failed to load CP board details", error);
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
    () => filterCpActivities(summary.activities, activeFilter, searchTerm),
    [summary.activities, activeFilter, searchTerm]
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-10 w-10 rounded-full border-4 border-slate-300 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen py-6">
      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <Text as="h1" variant="h1">CP Activity Log</Text>
            <Text variant="muted">
              {summary.user?.name || "User"} ({ujbCode || "-"})
            </Text>
          </div>

          <Link href="/user/contribuitionpoint">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft size={16} />
              Back
            </Button>
          </Link>
        </div>

        {summary.user && (
          <Card className="space-y-2 shadow-sm">
            <Text as="p" variant="body"><strong>Name:</strong> {summary.user.name || "-"}</Text>
            <Text as="p" variant="body"><strong>Phone:</strong> {summary.user.phoneNumber || "-"}</Text>
            <Text as="p" variant="body"><strong>Role:</strong> {summary.user.role || "-"}</Text>
          </Card>
        )}

        <div className="grid grid-cols-4 gap-3">
          {FILTERS.map((filter) => {
            const Icon = filter.icon;
            const isActive = activeFilter === filter.key;

            return (
              <button
                key={filter.key}
                onClick={() => setActiveFilter(filter.key)}
                className={`rounded-2xl border px-3 py-3 text-center transition ${
                  isActive
                    ? "border-orange-300 bg-orange-50 text-orange-600"
                    : "border-slate-200 bg-white text-slate-500"
                }`}
              >
                <Icon className="mx-auto h-4 w-4" />
                <div className="mt-1 text-xs font-medium">{filter.label}</div>
              </button>
            );
          })}
        </div>

        <input
          type="text"
          placeholder="Search activity or purpose..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm outline-none focus:border-orange-300"
        />

        <div className="space-y-4">
          {filteredActivities.length === 0 ? (
            <Card className="text-center shadow-sm">
              <Text variant="muted">No CP activities found.</Text>
            </Card>
          ) : (
            filteredActivities.map((activity) => {
              const category = activity.categories?.[0] || "W";

              return (
                <Card key={activity.id} className="space-y-3 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Text as="h2" variant="h2">{activity.activityName}</Text>
                      <Text variant="caption">
                        {activity.addedAt?.seconds
                          ? new Date(activity.addedAt.seconds * 1000).toLocaleDateString()
                          : activity.month || "-"}
                      </Text>
                    </div>

                    <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-600">
                      +{activity.points || 0}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600">
                      {getCpCategoryLabel(category)}
                    </span>

                    <Text variant="muted">{activity.purpose || "-"}</Text>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </section>
    </main>
  );
}
