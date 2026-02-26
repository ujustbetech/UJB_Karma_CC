"use client";

import React, {
  useEffect,
  useState,
  useMemo,
  useRef,
  useCallback,
} from "react";
import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
} from "firebase/firestore";
import { app } from "@/firebaseConfig";
import Link from "next/link";
import {
  MapPin,
  Globe,
  Search,
  BadgeCheck,
  Sparkles,
  SlidersHorizontal,
  Droplet,
  OrbitIcon,
} from "lucide-react";
import { COLLECTIONS } from "@/lib/utility_collection";

import { Forum, Orbit } from "next/font/google";


const forum = Forum({
  subsets: ["latin"],
  weight: "400",
});


const db = getFirestore(app);
const PAGE_SIZE = 10;

export default function AllEvents() {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("ai");
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const observerRef = useRef(null);
  const initialFetchDone = useRef(false);

  // 🔥 Fetch Businesses
  const fetchBusinesses = useCallback(
    async (isLoadMore = false) => {
      if (isLoadMore && (isFetchingMore || !hasMore)) return;

      try {
        if (isLoadMore) setIsFetchingMore(true);
        else setLoading(true);

        let q = query(
          collection(db, COLLECTIONS.userDetail),
          where("Category", "==", "CosmOrbiter"),
          orderBy("BusinessName"),
          limit(PAGE_SIZE)
        );

        if (isLoadMore && lastDoc) {
          q = query(
            collection(db, COLLECTIONS.userDetail),
            where("Category", "==", "CosmOrbiter"),
            orderBy("BusinessName"),
            startAfter(lastDoc),
            limit(PAGE_SIZE)
          );
        }

        const snapshot = await getDocs(q);

        const newList = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();

          const servicesArr = data.services
            ? Object.values(data.services)
            : [];
          const productsArr = data.products
            ? Object.values(data.products)
            : [];

          const aiScore =
            servicesArr.length * 2 +
            productsArr.length +
            (data.Verified ? 5 : 0);

          return {
            id: docSnap.id,
            businessName: data.BusinessName || "N/A",
            city: data.City || "",
            locality: data.Locality || "",
            state: data.State || "",
            category1: data.Category1 || "",
            verified: data.Verified || false,
            logo:
              data.BusinessLogo ||
              data["Business Logo"] ||
              data.ProfilePhotoURL ||
              "",
            aiScore,
          };
        });

        // Deduplicate
        setBusinesses((prev) => {
          const map = new Map();
          [...prev, ...newList].forEach((item) =>
            map.set(item.id, item)
          );
          return Array.from(map.values());
        });

        setLastDoc(snapshot.docs.at(-1) || null);
        setHasMore(snapshot.docs.length === PAGE_SIZE);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
        setIsFetchingMore(false);
      }
    },
    [lastDoc, isFetchingMore, hasMore]
  );

  useEffect(() => {
    if (initialFetchDone.current) return;
    initialFetchDone.current = true;
    fetchBusinesses();
  }, [fetchBusinesses]);

  // Infinite Scroll
  useEffect(() => {
    const sentinel = observerRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          hasMore &&
          !isFetchingMore
        ) {
          fetchBusinesses(true);
        }
      },
      { threshold: 1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [fetchBusinesses, hasMore, isFetchingMore]);

  // Categories
  const categories = useMemo(() => {
    const cats = businesses
      .map((b) => b.category1)
      .filter(Boolean);
    return ["All", ...new Set(cats)];
  }, [businesses]);

  // Filter + Sort
  const filteredBusinesses = useMemo(() => {
    let list = [...businesses];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter((b) =>
        [b.businessName, b.city, b.locality, b.state]
          .filter(Boolean)
          .some((field) =>
            field.toLowerCase().includes(q)
          )
      );
    }

    if (selectedCategory !== "All") {
      list = list.filter(
        (b) => b.category1 === selectedCategory
      );
    }

    if (sortBy === "city") {
      list.sort((a, b) =>
        a.city.localeCompare(b.city)
      );
    }

    if (sortBy === "category") {
      list.sort((a, b) =>
        a.category1.localeCompare(b.category1)
      );
    }

    if (sortBy === "ai") {
      list.sort((a, b) => b.aiScore - a.aiScore);
    }

    return list;
  }, [businesses, searchQuery, selectedCategory, sortBy]);

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

      {/* Header */}
      {/* Header Title (scrolls normally) */}
      <div className="flex items-center gap-2 pt-6 pb-3">
        <OrbitIcon size={24} className="text-orange-500" />
        <h3
          className={`${forum.className} text-3xl tracking-wide`}
          style={{ color: "#a2cbda" }}
        >
          CosmOrbiters
        </h3>
      </div>

      {/* Sticky Search Bar */}
      {/* Sticky Search */}
      <div className="sticky top-0 z-30 pb-3 pt-2">

        <div className="relative">
          <Search className="absolute left-4 top-3 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-gray-200 pl-10 pr-4 py-2.5 text-sm focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition"
          />
        </div>

      </div>

      {/* Business List */}
      <div className="space-y-4">

        {/* ✅ INITIAL SKELETON */}
        {loading && (
          <>
            {[...Array(6)].map((_, i) => (
              <BusinessSkeleton key={i} />
            ))}
          </>
        )}

        {/* ✅ DATA LIST */}
        {!loading && filteredBusinesses.map((b) => (
          <Link
            key={b.id}
            href={`cosmorbiters/${b.id}`}
            className="block"
          >
            <div className="rounded-2xl bg-white p-4 shadow-sm border border-gray-100 hover:shadow-md transition active:scale-[0.98]">
              <div className="flex items-center space-x-4">

                <div className="h-14 w-14 flex items-center justify-center rounded-full overflow-hidden bg-orange-50">
                  {b.logo && /^https?:\/\//.test(b.logo) ? (
                    <img
                      src={b.logo}
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
                      {b.category1}
                    </p>

                    {b.verified && (
                      <span className="flex items-center text-xs bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full">
                        <BadgeCheck className="w-3 h-3 mr-1" />
                        Verified
                      </span>
                    )}

                    {b.aiScore > 8 && (
                      <span className="flex items-center text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">
                        <Sparkles className="w-3 h-3 mr-1" />
                        AI Recommended
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-semibold truncate mt-1">
                    {b.businessName}
                  </h3>

                  <div className="flex items-center text-xs text-gray-500 mt-1">
                    <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                    {[b.locality, b.city, b.state]
                      .filter(Boolean)
                      .join(", ")}
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}

        {/* ✅ LOAD MORE SKELETON */}
        {isFetchingMore && (
          <>
            {[...Array(2)].map((_, i) => (
              <BusinessSkeleton key={`more-${i}`} />
            ))}
          </>
        )}

        {hasMore && <div ref={observerRef} className="h-10" />}
      </div>

      {/* Floating Filter Button */}
      <div className="fixed bottom-26 right-6 z-40">
        <button
          onClick={() => setShowFilters(true)}
          className="flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-lg active:scale-95 transition"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
        </button>
      </div>

      {/* Bottom Sheet */}
      {/* Bottom Sheet */}
      {showFilters && (
        <div className="fixed inset-0 z-99 flex items-end">

          {/* Backdrop */}
          <div
            onClick={() => setShowFilters(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />

          {/* Sheet Container */}
          <div className="relative w-full max-h-[90vh] bg-white rounded-t-3xl animate-slideUp shadow-2xl flex flex-col">

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-6 pt-6 pb-4">

              {/* Drag Handle */}
              <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-6" />

              <h3 className="text-xl font-semibold mb-4">
                Filter & Sort
              </h3>

              {/* Category */}
              <div className="mb-6">
                <p className="text-sm font-medium mb-2">
                  Category
                </p>

                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-full text-xs border transition ${selectedCategory === cat
                        ? "bg-orange-500 text-white border-orange-500"
                        : "bg-gray-100 text-gray-600 border-gray-200"
                        }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* iOS Segmented Sort */}
              <div className="mb-6">
                <p className="text-sm font-medium mb-2">
                  Sort By
                </p>

                <div className="flex bg-gray-100 rounded-xl p-1">
                  {["ai", "city", "category"].map((value) => (
                    <button
                      key={value}
                      onClick={() => setSortBy(value)}
                      className={`flex-1 text-xs py-2 rounded-lg transition ${sortBy === value
                        ? "bg-white shadow text-orange-500"
                        : "text-gray-500"
                        }`}
                    >
                      {value === "ai"
                        ? "AI"
                        : value.charAt(0).toUpperCase() +
                        value.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Sticky Bottom Button */}
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