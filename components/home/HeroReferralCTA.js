"use client";

import { useRouter } from "next/navigation";
import { Search, UserPlus } from "lucide-react";

export default function HeroReferralCTA() {
  const router = useRouter();

  return (
    <div className="bg-white rounded-2xl p-5 shadow-md">

      <h2 className="text-lg font-semibold text-slate-900">
        Pass a Referral Today
      </h2>

      <p className="text-sm text-slate-500 mt-1">
        Help your network grow and increase your contribution.
      </p>

      <div className="flex gap-3 mt-4">

        <button
          onClick={() => router.push("/Search")}
          className="flex-1 bg-gradient-to-br 
                     from-orange-400 via-orange-500 to-orange-600
                     text-white py-3 rounded-xl 
                     flex items-center justify-center gap-2
                     shadow-md active:scale-95 transition"
        >
          <Search size={18} />
          Search Services
        </button>

        <button
          onClick={() => router.push("/UsersProspect")}
          className="flex-1 bg-slate-100 text-slate-700
                     py-3 rounded-xl 
                     flex items-center justify-center gap-2
                     hover:bg-slate-200 transition"
        >
          <UserPlus size={18} />
          Add Prospect
        </button>

      </div>

    </div>
  );
}