"use client";

import Slider from "react-slick";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Forum } from "next/font/google";

const forum = Forum({
  subsets: ["latin"],
  weight: "400",
});

export default function RecommendedServices({ services }) {
  const router = useRouter();
  const safeServices = services || [];
  const loading = !services;

  const settings = {
    dots: true,
    infinite: true,
    autoplay: true,
    autoplaySpeed: 4000,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: false,
    responsive: [
      {
        breakpoint: 1024,
        settings: { slidesToShow: 2 },
      },
      {
        breakpoint: 768,
        settings: { slidesToShow: 1 },
      },
    ],
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-[#a2cbda]" />
          <h3
            className={`${forum.className} text-xl tracking-wide`}
            style={{ color: "#a2cbda" }}
          >
            Personalized For You
          </h3>
        </div>

        <span className="text-[10px] bg-orange-100 text-orange-600 px-2 py-1 rounded-full font-medium">
          AI Matched
        </span>
      </div>

      {loading && (
        <div className="grid md:grid-cols-2 gap-4">
          {[...Array(2)].map((_, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 animate-pulse"
            >
              <div className="h-20 bg-slate-200 rounded-lg" />
            </div>
          ))}
        </div>
      )}

      {!loading && safeServices.length > 0 && (
        <Slider {...settings}>
          {safeServices.map((item, index) => (
            <div key={index} className="px-2">
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-semibold text-sm">
                    {item.businessName?.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 line-clamp-1">
                      {item.businessName}
                    </h4>
                    <p className="text-[11px] text-[#16274f] bg-blue-50 inline-block px-2 py-0.5 rounded-full mt-1">
                      AI Match: {item.reason}
                    </p>
                  </div>
                </div>

                <p className="text-sm font-semibold text-slate-800">{item.serviceName}</p>

                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                  {item.description}
                </p>

                <button
                  onClick={() => router.push(`/business/${item.ujbCode}`)}
                  className="mt-4 w-full bg-[#16274f] hover:bg-[#1d356b] text-white text-sm font-semibold py-2.5 rounded-lg transition-all duration-200"
                >
                  Explore Business
                </button>
              </div>
            </div>
          ))}
        </Slider>
      )}
    </div>
  );
}

