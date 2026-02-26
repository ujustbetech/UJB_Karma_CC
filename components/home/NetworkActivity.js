"use client";

import { useEffect, useState } from "react";
import { db } from "@/firebaseConfig";
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Users } from "lucide-react";

export default function NetworkActivity() {
  const router = useRouter();
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    async function fetchRecentReferrals() {
      const q = query(
        collection(db, "Referraldev"),
        orderBy("createdAt", "desc"),
        limit(5)
      );

      const snap = await getDocs(q);

      const data = snap.docs.map((doc) => {
        const d = doc.data();

        return {
          id: doc.id,
          orbiterName: d.cosmoOrbiter?.name || "Orbiter",
          serviceName: d.serviceName || "a service",
          createdAt: d.createdAt?.toDate?.(),
        };
      });

      setActivities(data);
    }

    fetchRecentReferrals();
  }, []);

  if (activities.length === 0) return null;

  const timeAgo = (date) => {
    if (!date) return "";
    const seconds = Math.floor((new Date() - date) / 1000);

    const intervals = [
      { label: "d", value: 86400 },
      { label: "h", value: 3600 },
      { label: "m", value: 60 },
    ];

    for (let i of intervals) {
      const interval = Math.floor(seconds / i.value);
      if (interval >= 1) return `${interval}${i.label} ago`;
    }

    return "just now";
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-md space-y-4">

      <div className="flex items-center gap-2">
        <Users size={18} className="text-orange-500" />
        <h3 className="text-lg font-semibold text-slate-900">
          Network Activity
        </h3>
      </div>

      <div className="space-y-3">

        {activities.map((item) => (
          <div
            key={item.id}
            className="flex justify-between items-center text-sm"
          >
            <div>
              <span className="font-medium text-slate-800">
                {item.orbiterName}
              </span>{" "}
              <span className="text-slate-500">
                passed referral for
              </span>{" "}
              <span className="text-slate-800 font-medium">
                {item.serviceName}
              </span>
            </div>

            <span className="text-xs text-slate-400">
              {timeAgo(item.createdAt)}
            </span>
          </div>
        ))}

      </div>

      <button
        onClick={() => router.push("/ReferralList")}
        className="text-sm text-orange-500 font-medium"
      >
        View All →
      </button>

    </div>
  );
}