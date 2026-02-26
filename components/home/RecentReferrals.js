"use client";

import { useEffect, useState, useRef } from "react";
import { db } from "@/firebaseConfig";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
} from "firebase/firestore";
import Slider from "react-slick";
import {
  Clock,
  Send,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Forum } from "next/font/google";

const forum = Forum({
  subsets: ["latin"],
  weight: "400",
});

export default function RecentPassReferral() {
  const [referrals, setReferrals] = useState([]);
  const router = useRouter();
  const sliderRef = useRef(null);
  // const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "Referral"),
      orderBy("timestamp", "desc"),
      limit(5)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => {
        const d = doc.data();
        return {
          id: doc.id,
          name: d.cosmoOrbiter?.name || "Orbiter",
          serviceName: d.service?.name || "Service",
          createdAt: d.timestamp?.toDate?.() || null,
          status: d.dealStatus || "Pending",
        };
      });

      setReferrals(data);
      setLoading(false); // 👈 stop loading
    });

    return () => unsubscribe();
  }, []);

  const timeAgo = (date) => {
    if (!date) return "";
    const seconds = Math.floor((new Date() - date) / 1000);

    if (seconds > 86400) return `${Math.floor(seconds / 86400)}d ago`;
    if (seconds > 3600) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds > 60) return `${Math.floor(seconds / 60)}m ago`;

    return "just now";
  };

 // 🎯 ONLY badge color changes
const getStatusBadge = (status) => {
  switch (status) {
    case "Deal Won":
    case "Closed": // optional if both mean success
      return "bg-emerald-500 text-white";

    case "Discussion in Progress":
      return "bg-amber-500 text-white";

    case "Pending":
      return "bg-blue-500 text-white";

    case "Lost":
      return "bg-rose-500 text-white";

    default:
      return "bg-slate-500 text-white";
  }
};

  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    arrows: false,
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Send size={18} className="text-[#a2cbda]" />
          <h3
            className={`${forum.className} text-xl tracking-wide`}
            style={{ color: "#a2cbda" }}
          >
            Recent Pass Referral
          </h3>
        </div>

        <button
          onClick={() => router.push("/ReferralList")}
          className="text-sm font-medium text-sky-600 hover:text-sky-700"
        >
          See all
        </button>
      </div>

      {/* Carousel */}
      <div className="relative">

        {/* Prev */}
        {/* <button
          onClick={() => sliderRef.current?.slickPrev()}
          className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 
                     bg-white border border-slate-200 
                     rounded-full p-2 shadow-sm hover:bg-slate-50"
        >
          <ChevronLeft size={16} />
        </button> */}

        {/* Next */}
        {/* <button
          onClick={() => sliderRef.current?.slickNext()}
          className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 
                     bg-white border border-slate-200 
                     rounded-full p-2 shadow-sm hover:bg-slate-50"
        >
          <ChevronRight size={16} />
        </button> */}

        {loading && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 animate-pulse">
            <div className="flex justify-between items-start mb-4">
              <div className="space-y-2 w-2/3">
                <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                <div className="h-3 bg-slate-200 rounded w-1/2"></div>
              </div>
              <div className="h-6 w-20 bg-slate-200 rounded-full"></div>
            </div>

            <div className="h-3 bg-slate-200 rounded w-24"></div>
          </div>
        )}

        {!loading && (
          <Slider ref={sliderRef} {...settings}>
            {referrals.map((item) => (
              <div key={item.id} className="px-2">
                <div
                  onClick={() => router.push(`/ReferralList/${item.id}`)}
                  className="bg-white border border-slate-200 
                           rounded-2xl p-6 cursor-pointer 
                           hover:shadow-md transition-all duration-300"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-semibold text-slate-900 text-base">
                        {item.serviceName}
                      </h4>
                      <p className="text-sm text-slate-500 mt-1">
                        Passed by {item.name}
                      </p>
                    </div>

                    {/* 🎯 Colored Badge Only */}
                    <span
                      className={`text-xs font-semibold px-3 py-1 rounded-full ${getStatusBadge(
                        item.status
                      )}`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <div className="flex items-center text-xs text-slate-400 gap-1">
                    <Clock size={12} />
                    {timeAgo(item.createdAt)}
                  </div>
                </div>
              </div>
            ))}
          </Slider>
        )}


      </div>
    </div>
  );
}