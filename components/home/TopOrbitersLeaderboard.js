"use client";

import { Trophy } from "lucide-react";

export default function TopOrbitersLeaderboard({ leaders }) {
  const safeLeaders = leaders || [];

  if (safeLeaders.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl p-5 shadow-md space-y-4">
      <div className="flex items-center gap-2">
        <Trophy size={18} className="text-orange-500" />
        <h3 className="text-lg font-semibold text-slate-900">Top Orbiters This Month</h3>
      </div>

      <div className="space-y-3">
        {safeLeaders.map((item, index) => (
          <div key={index} className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-3">
              <span className="text-orange-500 font-semibold">#{index + 1}</span>
              <span className="font-medium text-slate-800">{item.name}</span>
            </div>
            <span className="text-slate-500">{item.count} referrals</span>
          </div>
        ))}
      </div>
    </div>
  );
}

