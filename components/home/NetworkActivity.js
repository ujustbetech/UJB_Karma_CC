"use client";

import { useRouter } from "next/navigation";
import { Users } from "lucide-react";

export default function NetworkActivity({ activities }) {
  const router = useRouter();
  const safeActivities = (activities || []).map((item) => ({
    ...item,
    createdAt: item?.createdAt ? new Date(item.createdAt) : null,
  }));

  if (!safeActivities.length) return null;

  const timeAgo = (date) => {
    if (!date) return "";
    const seconds = Math.floor((new Date() - date) / 1000);
    const intervals = [
      { label: "d", value: 86400 },
      { label: "h", value: 3600 },
      { label: "m", value: 60 },
    ];

    for (const item of intervals) {
      const interval = Math.floor(seconds / item.value);
      if (interval >= 1) return `${interval}${item.label} ago`;
    }

    return "just now";
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-md space-y-4">
      <div className="flex items-center gap-2">
        <Users size={18} className="text-orange-500" />
        <h3 className="text-lg font-semibold text-slate-900">Network Activity</h3>
      </div>

      <div className="space-y-3">
        {safeActivities.map((item) => (
          <div key={item.id} className="flex justify-between items-center text-sm">
            <div>
              <span className="font-medium text-slate-800">{item.orbiterName}</span>{" "}
              <span className="text-slate-500">passed referral for</span>{" "}
              <span className="text-slate-800 font-medium">{item.serviceName}</span>
            </div>

            <span className="text-xs text-slate-400">{timeAgo(item.createdAt)}</span>
          </div>
        ))}
      </div>

      <button
        onClick={() => router.push("/ReferralList")}
        className="text-sm text-orange-500 font-medium"
      >
        View All
      </button>
    </div>
  );
}
