"use client";

import { useEffect, useState } from "react";
import { db } from "@/firebaseConfig";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { useAuth } from "@/context/authContext";
import { Award, TrendingUp } from "lucide-react";

export default function PerformanceSnapshot() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalReferrals: 0,
    monthlyReferrals: 0,
    totalCP: 0,
  });

  useEffect(() => {
    async function fetchStats() {
      if (!user?.profile?.ujbCode) return;

      const ujbCode = user.profile.ujbCode;
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      let totalReferrals = 0;
      let monthlyReferrals = 0;

      // Fetch referrals
      const referralSnap = await getDocs(
        query(
          collection(db, "Referraldev"),
          where("cosmoOrbiter.ujbCode", "==", ujbCode)
        )
      );

      referralSnap.forEach((doc) => {
        totalReferrals++;

        const data = doc.data();
        const createdAt = data.createdAt?.toDate?.();

        if (
          createdAt &&
          createdAt.getMonth() === currentMonth &&
          createdAt.getFullYear() === currentYear
        ) {
          monthlyReferrals++;
        }
      });

      // Fetch CP
      let totalCP = 0;

      const activitiesSnap = await getDocs(
        collection(db, "Orbiters", user.phone, "activities")
      );

      activitiesSnap.forEach((doc) => {
        totalCP += Number(doc.data()?.points || 0);
      });

      setStats({
        totalReferrals,
        monthlyReferrals,
        totalCP,
      });
    }

    fetchStats();
  }, [user]);

  const motivationalText =
    stats.monthlyReferrals >= 5
      ? "🔥 You're on fire this month!"
      : stats.monthlyReferrals >= 2
      ? "🚀 Keep pushing, you're growing!"
      : "Start your first referral this month 💡";

  return (
    <div className="bg-white rounded-2xl p-5 shadow-md space-y-4">

      <div className="flex items-center gap-2">
        <Award size={18} className="text-orange-500" />
        <h3 className="text-lg font-semibold text-slate-900">
          Your Performance
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-4 text-center">

        <div className="bg-slate-50 rounded-xl p-3">
          <p className="text-lg font-semibold text-slate-900">
            {stats.totalReferrals}
          </p>
          <p className="text-xs text-slate-500">
            Total Referrals
          </p>
        </div>

        <div className="bg-slate-50 rounded-xl p-3">
          <p className="text-lg font-semibold text-slate-900">
            {stats.monthlyReferrals}
          </p>
          <p className="text-xs text-slate-500">
            This Month
          </p>
        </div>

        <div className="bg-slate-50 rounded-xl p-3 col-span-2">
          <p className="text-lg font-semibold text-orange-500">
            {stats.totalCP}
          </p>
          <p className="text-xs text-slate-500">
            Contribution Points
          </p>
        </div>

      </div>

      <div className="flex items-center gap-2 text-sm text-slate-600">
        <TrendingUp size={14} />
        {motivationalText}
      </div>

    </div>
  );
}