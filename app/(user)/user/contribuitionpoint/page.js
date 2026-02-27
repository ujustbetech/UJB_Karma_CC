"use client";

import { useEffect, useState, useMemo } from "react";
import {
  collection,
  query,
  orderBy,
  getDocs,
} from "firebase/firestore";

import { db } from "@/firebaseConfig";
import {
  Trophy,
  Heart,
  Users,
  Wallet,
  LayoutGrid,
} from "lucide-react";
import { useAuth } from "@/context/authContext";
import { useRouter } from "next/navigation";

export default function CPBoardDetails() {
  const router = useRouter();
  const { user: sessionUser, loading: authLoading } = useAuth();
  const ujbCode = sessionUser?.profile?.ujbCode;

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  const minimumRequired = 250;

  /* ================= FETCH ================= */
  useEffect(() => {
    if (authLoading) return;

    if (!ujbCode) {
      setLoading(false);
      return;
    }

    const fetchActivities = async () => {
      try {
        const q = query(
          collection(db, "CPBoard", ujbCode, "activities"),
          orderBy("addedAt", "desc")
        );

        const snap = await getDocs(q);

        setActivities(
          snap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
        );
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [ujbCode, authLoading]);

  /* ================= POINT CALCULATIONS ================= */

  const totalPoints = useMemo(
    () => activities.reduce((sum, a) => sum + Number(a.points || 0), 0),
    [activities]
  );

  const relationPoints = useMemo(
    () =>
      activities
        .filter((a) => a.categories?.includes("R"))
        .reduce((sum, a) => sum + Number(a.points || 0), 0),
    [activities]
  );

  const healthPoints = useMemo(
    () =>
      activities
        .filter((a) => a.categories?.includes("H"))
        .reduce((sum, a) => sum + Number(a.points || 0), 0),
    [activities]
  );

  const wealthPoints = useMemo(
    () =>
      activities
        .filter((a) => a.categories?.includes("W"))
        .reduce((sum, a) => sum + Number(a.points || 0), 0),
    [activities]
  );

  const canRedeem = totalPoints >= minimumRequired;

  /* ================= FILTER ================= */

  const filteredActivities = useMemo(() => {
    return activities.filter((a) => {
      const matchesTab =
        activeTab === "All" || a.categories?.includes(activeTab);

      const matchesSearch =
        a.activityName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.purpose?.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesTab && matchesSearch;
    });
  }, [activities, activeTab, searchTerm]);

  /* ================= TABS CONFIG ================= */

  const tabs = [
    { key: "All", label: "All", icon: LayoutGrid },
    { key: "R", label: "Relation", icon: Users },
    { key: "H", label: "Health", icon: Heart },
    { key: "W", label: "Wealth", icon: Wallet },
  ];

  /* ================= LOADER ================= */

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-10 w-10 border-4 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen py-10 ">
      <section className="max-w-5xl mx-auto px-4">

        {/* HEADER */}
        <div className="mb-10">
          <h2 className="text-3xl font-bold text-gray-800">
            Contribution Points
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Track your contribution performance
          </p>
        </div>

        {/* TOTAL CARD */}
        <div className="bg-white rounded-3xl p-8 shadow-lg border mb-10">
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="text-xs tracking-wider text-gray-500 uppercase">
                Total Points
              </p>
              <h3 className="text-4xl font-bold text-green-600 mt-2">
                {totalPoints}
              </h3>
            </div>

            <div className="bg-green-100 p-4 rounded-2xl">
              <Trophy className="text-green-600" size={30} />
            </div>
          </div>

          <button
            disabled={!canRedeem}
            onClick={() => router.push("/Dealsforyou")}
            className={`w-full py-3 rounded-xl text-sm font-medium transition ${
              canRedeem
                ? "bg-orange-600 text-white hover:bg-orange-700"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            Redeem Now
          </button>

          {!canRedeem && (
            <p className="text-xs text-red-500 mt-3">
              Need {minimumRequired - totalPoints} more points to redeem
            </p>
          )}
        </div>

        {/* CATEGORY SUMMARY */}
        <div className="grid grid-cols-3 gap-6 mb-10 text-center">
          <div className="bg-white rounded-2xl p-4 shadow border">
            <p className="text-sm text-gray-500">Relation</p>
            <p className="text-xl font-bold text-blue-600">{relationPoints}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow border">
            <p className="text-sm text-gray-500">Health</p>
            <p className="text-xl font-bold text-green-600">{healthPoints}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow border">
            <p className="text-sm text-gray-500">Wealth</p>
            <p className="text-xl font-bold text-purple-600">{wealthPoints}</p>
          </div>
        </div>

        {/* TABS WITH ICONS */}
        <div className="flex overflow-x-auto no-scrollbar bg-white rounded-2xl shadow mb-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;

            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex flex-col items-center justify-center min-w-[100px] px-6 py-4 transition-all duration-200 relative ${
                  isActive
                    ? "text-orange-600"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-xs mt-1">
                  {tab.label}
                </span>

                {isActive && (
                  <div className="absolute bottom-0 h-[3px] w-10 bg-orange-500 rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        {/* SEARCH */}
        <div className="mb-8">
          <input
            type="text"
            placeholder="Search activity..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border bg-white shadow-sm"
          />
        </div>

        {/* ACTIVITY CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          {filteredActivities.map((a) => {
            const category = a.categories?.[0] || "W";

            const categoryLabel =
              category === "R"
                ? "Relation"
                : category === "H"
                ? "Health"
                : "Wealth";

            return (
              <div
                key={a.id}
                className="bg-white rounded-3xl p-7 shadow-md border hover:shadow-xl transition"
              >
                <p className="text-xs text-gray-400 mb-3">
                  {a.addedAt?.seconds
                    ? new Date(a.addedAt.seconds * 1000).toLocaleDateString()
                    : "—"}
                </p>

                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  {a.activityName}
                </h3>

                <div className="flex items-center justify-between mb-5">
                  <span className="px-4 py-1 text-xs rounded-full border border-indigo-400 text-indigo-600">
                    {categoryLabel}
                  </span>

                  <p className="text-lg font-bold text-indigo-600">
                    +{a.points}
                  </p>
                </div>

                {a.purpose && (
                  <div className="text-sm text-gray-500 border-t pt-4">
                    Redeemed for{" "}
                    <span className="font-medium text-gray-700">
                      {a.purpose}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </section>
    </main>
  );
}