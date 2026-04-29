"use client";

import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";

export default function NewlyAddedSection({ services }) {
  const router = useRouter();
  const safeServices = services || [];

  if (safeServices.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles size={18} className="text-orange-500" />
        <h3 className="text-lg font-semibold text-white">Newly Added</h3>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2">
        {safeServices.map((item, index) => (
          <div key={index} className="min-w-[240px] bg-white rounded-2xl p-4 shadow-md">
            <span className="text-[10px] text-orange-500 font-semibold">NEW</span>
            <h4 className="text-sm font-semibold text-slate-900 mt-1">{item.serviceName}</h4>
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.description}</p>
            <button
              onClick={() => router.push(`/business/${item.ujbCode}`)}
              className="mt-3 text-xs text-orange-500 font-medium"
            >
              View Details
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

