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
import { Trophy } from "lucide-react";

export default function TopOrbitersLeaderboard() {
  const { user } = useAuth();
  const [leaders, setLeaders] = useState([]);

  useEffect(() => {
    async function fetchLeaderboard() {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const snap = await getDocs(collection(db, "Referraldev"));

      const map = {};

      snap.forEach((doc) => {
        const data = doc.data();
        const createdAt = data.createdAt?.toDate?.();

        if (
          createdAt &&
          createdAt.getMonth() === currentMonth &&
          createdAt.getFullYear() === currentYear
        ) {
          const ujb = data.cosmoOrbiter?.ujbCode;
          const name = data.cosmoOrbiter?.name || "Orbiter";

          if (!map[ujb]) {
            map[ujb] = { name, count: 0 };
          }

          map[ujb].count += 1;
        }
      });

      const sorted = Object.values(map)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setLeaders(sorted);
    }

    fetchLeaderboard();
  }, []);

  if (leaders.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl p-5 shadow-md space-y-4">

      <div className="flex items-center gap-2">
        <Trophy size={18} className="text-orange-500" />
        <h3 className="text-lg font-semibold text-slate-900">
          Top Orbiters This Month
        </h3>
      </div>

      <div className="space-y-3">
        {leaders.map((item, index) => (
          <div
            key={index}
            className="flex justify-between items-center text-sm"
          >
            <div className="flex items-center gap-3">
              <span className="text-orange-500 font-semibold">
                #{index + 1}
              </span>
              <span className="font-medium text-slate-800">
                {item.name}
              </span>
            </div>

            <span className="text-slate-500">
              {item.count} referrals
            </span>
          </div>
        ))}
      </div>

    </div>
  );
}