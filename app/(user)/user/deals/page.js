"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Search, Store } from "lucide-react";
import { fetchApprovedCcDeals } from "@/services/userCcMarketplaceService";
import UserPageHeader from "@/components/user/UserPageHeader";

const DealsForYou = () => {
  const [deals, setDeals] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  /* ================= FETCH DEALS ================= */
  useEffect(() => {
    const fetchDeals = async () => {
      try {
        const approved = await fetchApprovedCcDeals();
        setDeals(approved);
      } finally {
        setLoading(false);
      }
    };

    fetchDeals();
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) {
      return deals;
    }

    return deals.filter((deal) => deal.searchText.includes(search.toLowerCase()));
  }, [search, deals]);

  const renderCard = (deal) => {
    return (
      <Link
        key={deal.id}
        href={`/user/deals/${deal.id}`}
        className="bg-white rounded-3xl shadow-lg hover:shadow-2xl hover:-translate-y-2 transition duration-300 cursor-pointer overflow-hidden"
      >
        {deal.displayImage && (
          <img
            src={deal.displayImage}
            alt={deal.displayName}
            className="w-full h-52 object-cover"
          />
        )}

        <div className="p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-2">
            {deal.displayName}
          </h3>

          <p className="text-sm text-gray-600 line-clamp-3 mb-4">
            {deal.displayDescription}
          </p>

          <p className="text-xs text-indigo-600 font-semibold">
            By {deal.cosmo?.Name}
          </p>
        </div>
      </Link>
    );
  };

  return (
    <main className="min-h-screen ">

      {/* PAGE HEADER */}
      <div className="max-w-7xl mx-auto mb-12 space-y-5">
        <UserPageHeader
          title="CC Referral Marketplace"
          description="Browse approved marketplace offers and open any deal to submit a lead requirement."
          icon={Store}
          align="center"
        />

        <div className="relative max-w-md mx-auto">
          <Search
            size={18}
            className="absolute left-4 top-3.5 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search Product / Service"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
      </div>

      {/* DEAL GRID */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          <div className="col-span-full text-center text-gray-500">
            Loading marketplace...
          </div>
        ) : filtered.length > 0 ? (
          filtered.map(renderCard)
        ) : (
          <div className="col-span-full text-center text-gray-500">
            No exact match found.
          </div>
        )}
      </div>

    </main>
  );
};

export default DealsForYou;


