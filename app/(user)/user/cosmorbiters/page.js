"use client";

import React, {
  useEffect,
  useState,
  useMemo,
  useRef,
  useCallback,
} from "react";
import Link from "next/link";
import {
  MapPin,
  Search,
  BadgeCheck,
  Sparkles,
  SlidersHorizontal,
  OrbitIcon,
} from "lucide-react";
import { Forum } from "next/font/google";
import { fetchCosmOrbiters } from "@/services/cosmorbitersService";

const forum = Forum({
  subsets: ["latin"],
  weight: "400",
});

const PAGE_SIZE = 10;

export default function AllEvents() {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("ai");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [showFilters, setShowFilters] = useState(false);

  const observerRef = useRef(null);
  const initialFetchDone = useRef(false);

  const fetchBusinesses = useCallback(async () => {
    try {
      setLoading(true);
      const nextBusinesses = await fetchCosmOrbiters();

      setBusinesses((prev) => {
        const map = new Map();
        [...prev, ...nextBusinesses].forEach((item) => {
          map.set(item.id, item);
        });
        return Array.from(map.values());
      });
    } catch (error) {
      console.error(error);
      setBusinesses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialFetchDone.current) return;
    initialFetchDone.current = true;
    fetchBusinesses();
  }, [fetchBusinesses]);

  const categories = useMemo(() => {
    const cats = businesses.map((item) => item.category1).filter(Boolean);
    return ["All", ...new Set(cats)];
  }, [businesses]);

  const filteredBusinesses = useMemo(() => {
    let list = [...businesses];

    if (searchQuery) {
      const queryText = searchQuery.toLowerCase();
      list = list.filter((item) =>
        [item.businessName, item.city, item.locality, item.state]
          .filter(Boolean)
          .some((field) => field.toLowerCase().includes(queryText))
      );
    }

    if (selectedCategory !== "All") {
      list = list.filter((item) => item.category1 === selectedCategory);
    }

    if (sortBy === "city") {
      list.sort((left, right) => left.city.localeCompare(right.city));
    }

    if (sortBy === "category") {
      list.sort((left, right) => left.category1.localeCompare(right.category1));
    }

    if (sortBy === "ai") {
      list.sort((left, right) => right.aiScore - left.aiScore);
    }

    return list;
  }, [businesses, searchQuery, selectedCategory, sortBy]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [searchQuery, selectedCategory, sortBy]);

  const visibleBusinesses = filteredBusinesses.slice(0, visibleCount);
  const hasMore = visibleCount < filteredBusinesses.length;

  useEffect(() => {
    const sentinel = observerRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          visibleCount < filteredBusinesses.length &&
          !isFetchingMore
        ) {
          setIsFetchingMore(true);
          window.setTimeout(() => {
            setVisibleCount((prev) => prev + PAGE_SIZE);
            setIsFetchingMore(false);
          }, 200);
        }
      },
      { threshold: 1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [filteredBusinesses.length, visibleCount, isFetchingMore]);

  const BusinessSkeleton = () => (
    <div className="rounded-2xl bg-white p-4 border border-gray-100 shadow-sm animate-pulse">
      <div className="flex gap-4">
        <div className="h-14 w-14 rounded-full bg-gray-200" />
        <div className="flex-1 space-y-3">
          <div className="h-3 w-24 bg-gray-200 rounded" />
          <div className="h-4 w-40 bg-gray-200 rounded" />
          <div className="h-3 w-32 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  );

  return (
    <main className="min-h-screen">
      <div className="flex items-center gap-2 pt-6 pb-3">
        <OrbitIcon size={24} className="text-orange-500" />
        <h3
          className={`${forum.className} text-3xl tracking-wide`}
          style={{ color: "#a2cbda" }}
        >
          CosmOrbiters
        </h3>
      </div>

      <div className="sticky top-0 z-30 pb-3 pt-2">
        <div className="relative">
          <Search className="absolute left-4 top-3 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-gray-200 pl-10 pr-4 py-2.5 text-sm focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition"
          />
        </div>
      </div>

      <div className="space-y-4">
        {loading && (
          <>
            {[...Array(6)].map((_, index) => (
              <BusinessSkeleton key={index} />
            ))}
          </>
        )}

        {!loading &&
          visibleBusinesses.map((business) => (
            <Link
              key={business.id}
              href={`cosmorbiters/${business.id}`}
              className="block"
            >
              <div className="rounded-2xl bg-white p-4 shadow-sm border border-gray-100 hover:shadow-md transition active:scale-[0.98]">
                <div className="flex items-center space-x-4">
                  <div className="h-14 w-14 flex items-center justify-center rounded-full overflow-hidden bg-orange-50">
                    {business.logo && /^https?:\/\//.test(business.logo) ? (
                      <img
                        src={business.logo}
                        alt="Business Logo"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-14 w-14 flex items-center justify-center w-full h-full bg-gradient-to-br from-gray-200 to-gray-300">
                        <OrbitIcon className="w-5 h-5 text-orange-400" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs text-orange-500 font-medium">
                        {business.category1}
                      </p>

                      {business.verified && (
                        <span className="flex items-center text-xs bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full">
                          <BadgeCheck className="w-3 h-3 mr-1" />
                          Verified
                        </span>
                      )}

                      {business.aiScore > 8 && (
                        <span className="flex items-center text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">
                          <Sparkles className="w-3 h-3 mr-1" />
                          AI Recommended
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-semibold truncate mt-1">
                      {business.businessName}
                    </h3>

                    <div className="flex items-center text-xs text-gray-500 mt-1">
                      <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                      {[business.locality, business.city, business.state]
                        .filter(Boolean)
                        .join(", ")}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}

        {isFetchingMore && (
          <>
            {[...Array(2)].map((_, index) => (
              <BusinessSkeleton key={`more-${index}`} />
            ))}
          </>
        )}

        {hasMore && <div ref={observerRef} className="h-10" />}
      </div>

      <div className="fixed bottom-26 right-6 z-40">
        <button
          onClick={() => setShowFilters(true)}
          className="flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-lg active:scale-95 transition"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
        </button>
      </div>

      {showFilters && (
        <div className="fixed inset-0 z-99 flex items-end">
          <div
            onClick={() => setShowFilters(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />

          <div className="relative w-full max-h-[90vh] bg-white rounded-t-3xl animate-slideUp shadow-2xl flex flex-col">
            <div className="flex-1 overflow-y-auto px-6 pt-6 pb-4">
              <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-6" />

              <h3 className="text-xl font-semibold mb-4">Filter & Sort</h3>

              <div className="mb-6">
                <p className="text-sm font-medium mb-2">Category</p>

                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-3 py-1.5 rounded-full text-xs border transition ${
                        selectedCategory === category
                          ? "bg-orange-500 text-white border-orange-500"
                          : "bg-gray-100 text-gray-600 border-gray-200"
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <p className="text-sm font-medium mb-2">Sort By</p>

                <div className="flex bg-gray-100 rounded-xl p-1">
                  {["ai", "city", "category"].map((value) => (
                    <button
                      key={value}
                      onClick={() => setSortBy(value)}
                      className={`flex-1 text-xs py-2 rounded-lg transition ${
                        sortBy === value
                          ? "bg-white shadow text-orange-500"
                          : "text-gray-500"
                      }`}
                    >
                      {value === "ai"
                        ? "AI"
                        : value.charAt(0).toUpperCase() + value.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-6 pb-6 pt-4 border-t border-gray-100 bg-white">
              <button
                onClick={() => setShowFilters(false)}
                className="w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white py-3 rounded-xl font-medium active:scale-95 transition"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}


