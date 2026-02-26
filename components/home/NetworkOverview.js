"use client";

import { useEffect, useState, useRef } from "react";
import { db } from "@/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import {
  Users,
  Sparkles,
  Share2,
  IndianRupee,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { Forum } from "next/font/google";

export const forum = Forum({
  subsets: ["latin"],
  weight: "400",
});

export default function NetworkOverview() {
  const [stats, setStats] = useState({
    totalOrbiters: 0,
    totalCosmOrbiters: 0,
    totalReferrals: 0,
    totalBusiness: 0,
  });

  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [userSnap, referralSnap] = await Promise.all([
          getDocs(collection(db, "usersdetail")),
          getDocs(collection(db, "Referraldev")),
        ]);

        const totalOrbiters = userSnap.size; // ✅ total usersDetail docs

        let totalCosmOrbiters = 0;
        let totalBusiness = 0;

        userSnap.forEach((doc) => {
          if (doc.data().Category === "CosmOrbiter") {
            totalCosmOrbiters++;
          }
        });

        referralSnap.forEach((doc) => {
          totalBusiness += Number(doc.data().amount || 0);
        });

        setStats({
          totalOrbiters,
          totalCosmOrbiters,
          totalReferrals: referralSnap.size,
          totalBusiness,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  const scroll = (dir) => {
    if (!scrollRef.current) return;
    const width = scrollRef.current.offsetWidth;
    scrollRef.current.scrollBy({
      left: dir === "left" ? -width : width,
      behavior: "smooth",
    });
  };

  const cards = [
    {
      icon: Users,
      label: "Total Orbiters",
      value: stats.totalOrbiters,
      gradient: "from-blue-600 to-blue-500",
    },
    {
      icon: Sparkles,
      label: "CosmOrbiters",
      value: stats.totalCosmOrbiters,
      gradient: "from-purple-600 to-indigo-500",
    },
    {
      icon: Share2,
      label: "Total Referrals",
      value: stats.totalReferrals,
      gradient: "from-emerald-600 to-teal-500",
    },
    {
      icon: IndianRupee,
      label: "Business Generated",
      value: `₹ ${stats.totalBusiness.toLocaleString()}`,
      gradient: "from-orange-600 to-amber-500",
    },
  ];

  return (
    <div className="relative w-full">

      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-white text-base font-semibold">
          Network Overview
        </h3>

        <div className="flex gap-2">
          <button
            onClick={() => scroll("left")}
            className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition"
          >
            <ChevronLeft size={16} className="text-white" />
          </button>
          <button
            onClick={() => scroll("right")}
            className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition"
          >
            <ChevronRight size={16} className="text-white" />
          </button>
        </div>
      </div>

      {/* Carousel */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth"
      >
        {cards.map((card, index) => {
          const Icon = card.icon;

          return (
            <div
              key={index}
              className={`min-w-full sm:min-w-[280px] snap-center
              rounded-2xl px-5 py-4
              bg-gradient-to-br ${card.gradient}
              text-white shadow-lg relative overflow-hidden`}
            >
              {/* Subtle Glow */}
              <div className="absolute -right-8 -top-8 w-28 h-28 bg-white/10 rounded-full blur-2xl"></div>

              <div className="relative z-10 flex items-center justify-between">

                {/* Left Content */}
                <div>
                  {loading ? (
                    <div className="h-6 w-20 bg-white/20 animate-pulse rounded mb-1" />
                  ) : (
                    <p className="text-2xl font-bold leading-tight">
                      {card.value}
                    </p>
                  )}
                  <p className="text-xs opacity-80 mt-1">
                    {card.label}
                  </p>
                </div>

                {/* Icon */}
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur">
                  <Icon size={20} />
                </div>

              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}