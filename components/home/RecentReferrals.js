"use client";

import { useMemo, useRef } from "react";
import Slider from "react-slick";
import { Clock, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { Forum } from "next/font/google";

const forum = Forum({
  subsets: ["latin"],
  weight: "400",
});

export default function RecentPassReferral({ referrals }) {
  const router = useRouter();
  const sliderRef = useRef(null);
  const loading = !referrals;
  const safeReferrals = useMemo(
    () =>
      (referrals || []).map((item) => ({
        ...item,
        createdAt: item?.createdAt ? new Date(item.createdAt) : null,
      })),
    [referrals]
  );

  const timeAgo = (date) => {
    if (!date) return "";
    const seconds = Math.floor((new Date() - date) / 1000);

    if (seconds > 86400) return `${Math.floor(seconds / 86400)}d ago`;
    if (seconds > 3600) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds > 60) return `${Math.floor(seconds / 60)}m ago`;

    return "just now";
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Deal Won":
      case "Closed":
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

      <div className="relative">
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

        {!loading && safeReferrals.length > 0 && (
          <Slider ref={sliderRef} {...settings}>
            {safeReferrals.map((item) => (
              <div key={item.id} className="px-2">
                <div
                  onClick={() => router.push(`/ReferralList/${item.id}`)}
                  className="bg-white border border-slate-200 rounded-2xl p-6 cursor-pointer hover:shadow-md transition-all duration-300"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-semibold text-slate-900 text-base">
                        {item.serviceName}
                      </h4>
                      <p className="text-sm text-slate-500 mt-1">Passed by {item.name}</p>
                    </div>

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

