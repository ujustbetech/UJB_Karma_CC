"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Trophy, Heart, Users, Wallet, LayoutGrid } from "lucide-react";
import { useAuth } from "@/context/authContext";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Text from "@/components/ui/Text";
import Button from "@/components/ui/Button";
import {
  fetchCpBoardSummary,
  filterCpActivities,
  getCpCategoryLabel,
} from "@/services/contributionPointService";
import UserPageHeader from "@/components/user/UserPageHeader";

export default function ContributionPointPage() {
  const router = useRouter();
  const { user: sessionUser, loading: authLoading } = useAuth();
  const ujbCode = sessionUser?.profile?.ujbCode;
  const [summary, setSummary] = useState({
    user: null,
    activities: [],
    totals: { total: 0, relation: 0, health: 0, wealth: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const minimumRequired = 250;

  useEffect(() => {
    if (authLoading) return;

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
        console.error("Failed to load contribution points", error);
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
  }, [ujbCode, authLoading]);

  const filteredActivities = useMemo(
    () => filterCpActivities(summary.activities, activeTab, searchTerm),
    [summary.activities, activeTab, searchTerm]
  );

  const canRedeem = summary.totals.total >= minimumRequired;

  const tabs = [
    { key: "All", label: "All", icon: LayoutGrid },
    { key: "R", label: "Relation", icon: Users },
    { key: "H", label: "Health", icon: Heart },
    { key: "W", label: "Wealth", icon: Wallet },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-10 w-10 border-4 border-gray-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen py-6">
      <section className="space-y-5">
        <UserPageHeader
          title="Contribution Points"
          description="Track your contribution performance, category mix, and redemption readiness from one dashboard."
          icon={Trophy}
          action={
            ujbCode ? (
              <Link href={`/user/contribuitionpoint/${ujbCode}`}>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-orange-300/50 bg-white/10 text-slate-100 hover:bg-white/15 hover:text-white"
                >
                  Activity Log
                </Button>
              </Link>
            ) : null
          }
        />

        <Card className="space-y-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <Text variant="caption" className="uppercase tracking-wider">
                Total Points
              </Text>
              <Text as="p" variant="h1" className="mt-2 text-green-600">
                {summary.totals.total}
              </Text>
            </div>

            <div className="rounded-2xl bg-green-100 p-4">
              <Trophy className="text-green-600" size={30} />
            </div>
          </div>

          <Button
            className="w-full"
            disabled={!canRedeem}
            onClick={() => router.push("/user/deals")}
          >
            Redeem Now
          </Button>

          {!canRedeem ? (
            <Text variant="caption" className="text-red-500">
              Need {minimumRequired - summary.totals.total} more points to redeem
            </Text>
          ) : null}
        </Card>

        <div className="grid grid-cols-3 gap-3 text-center">
          <Card className="shadow-sm">
            <Text variant="muted">Relation</Text>
            <Text as="p" variant="h2" className="text-blue-600">
              {summary.totals.relation}
            </Text>
          </Card>
          <Card className="shadow-sm">
            <Text variant="muted">Health</Text>
            <Text as="p" variant="h2" className="text-green-600">
              {summary.totals.health}
            </Text>
          </Card>
          <Card className="shadow-sm">
            <Text variant="muted">Wealth</Text>
            <Text as="p" variant="h2" className="text-purple-600">
              {summary.totals.wealth}
            </Text>
          </Card>
        </div>

        <div className="flex overflow-x-auto rounded-2xl bg-white shadow-sm">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;

            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative flex min-w-[100px] flex-col items-center justify-center px-6 py-4 transition ${
                  isActive
                    ? "text-orange-600"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                <span className="mt-1 text-xs">{tab.label}</span>
                {isActive ? (
                  <div className="absolute bottom-0 h-[3px] w-10 rounded-full bg-orange-500" />
                ) : null}
              </button>
            );
          })}
        </div>

        <input
          type="text"
          placeholder="Search activity..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          className="w-full rounded-xl border bg-white px-4 py-3 shadow-sm outline-none"
        />

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {filteredActivities.map((activity) => {
            const category = activity.categories?.[0] || "W";

            return (
              <Card key={activity.id} className="space-y-4 border shadow-md transition hover:shadow-xl">
                <Text variant="caption">
                  {activity.addedAt?.seconds
                    ? new Date(activity.addedAt.seconds * 1000).toLocaleDateString()
                    : activity.month || "-"}
                </Text>

                <Text as="h3" variant="h3">{activity.activityName}</Text>

                <div className="flex items-center justify-between">
                  <span className="rounded-full border border-indigo-400 px-4 py-1 text-xs text-indigo-600">
                    {getCpCategoryLabel(category)}
                  </span>

                  <Text as="p" variant="h3" className="text-indigo-600">
                    +{activity.points || 0}
                  </Text>
                </div>

                {activity.purpose ? (
                  <div className="border-t pt-4 text-sm text-gray-500">
                    Redeemed for{" "}
                    <span className="font-medium text-gray-700">
                      {activity.purpose}
                    </span>
                  </div>
                ) : null}
              </Card>
            );
          })}
        </div>
      </section>
    </main>
  );
}
