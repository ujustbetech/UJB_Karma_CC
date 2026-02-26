"use client";

import { useEffect, useState } from "react";
import Slider from "react-slick";
import { db } from "@/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import { useAuth } from "@/context/authContext";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Forum } from "next/font/google";

const forum = Forum({
  subsets: ["latin"],
  weight: "400",
});

export default function RecommendedServices() {
  const { user } = useAuth();
  const router = useRouter();

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.profile) return;

    async function fetchRecommendations() {
      try {
        const profile = user.profile;
        const snap = await getDocs(collection(db, "usersdetail"));

        const userKeywords = [
          profile.Category1,
          profile.Category2,
          ...(profile.Skills || []),
          ...(profile.Mastery || []),
          ...(profile.InterestArea || []),
        ]
          .filter((v) => v && v !== "—")
          .map((v) => String(v).toLowerCase());

        const scoredServices = [];

        snap.forEach((doc) => {
          const data = doc.data();

          // ✅ Support array OR object services
          const servicesList = Array.isArray(data.services)
            ? data.services
            : Object.values(data.services || {});

          servicesList.forEach((service) => {
            if (!service?.name || !service?.description) return;

            // ✅ SAFE KEYWORDS HANDLING
            const keywordArray = Array.isArray(service.keywords)
              ? service.keywords
                  .filter(Boolean)
                  .map((k) => String(k).trim().toLowerCase())
              : typeof service.keywords === "string"
              ? service.keywords
                  .split(",")
                  .map((k) => k.trim().toLowerCase())
              : [];

            let score = 0;
            let reasons = [];

            // Category 1 match
            if (
              profile.Category1 &&
              keywordArray.includes(profile.Category1.toLowerCase())
            ) {
              score += 6;
              reasons.push(profile.Category1);
            }

            // Category 2 match
            if (
              profile.Category2 &&
              keywordArray.includes(profile.Category2.toLowerCase())
            ) {
              score += 5;
              reasons.push(profile.Category2);
            }

            // Skill & interest matches
            const matches = keywordArray.filter((k) =>
              userKeywords.includes(k)
            );

            if (matches.length > 0) {
              score += matches.length * 2;
              reasons.push(...matches.slice(0, 2));
            }

            // Local city boost
            if (
              profile.City &&
              data.City &&
              profile.City !== "—" &&
              profile.City === data.City
            ) {
              score += 2;
              reasons.push("Local");
            }

            // ✅ Only push relevant results
            if (score > 0) {
              scoredServices.push({
                score,
                businessName: data.BusinessName,
                serviceName: service.name,
                description: service.description,
                ujbCode: data.UJBCode,
                reason:
                  [...new Set(reasons)].slice(0, 2).join(" + ") ||
                  "Popular Service",
              });
            }
          });
        });

        scoredServices.sort((a, b) => b.score - a.score);
        setServices(scoredServices.slice(0, 6));
      } catch (error) {
        console.error("Recommendation error:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchRecommendations();
  }, [user]);

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
      {/* Heading */}
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

      {/* Skeleton */}
      {loading && (
        <div className="grid md:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 animate-pulse"
            >
              <div className="h-20 bg-slate-200 rounded-lg" />
            </div>
          ))}
        </div>
      )}

      {/* Carousel */}
      {!loading && services.length > 0 && (
        <Slider {...settings}>
          {services.map((item, index) => (
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

                <p className="text-sm font-semibold text-slate-800">
                  {item.serviceName}
                </p>

                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                  {item.description}
                </p>

                <button
                  onClick={() =>
                    router.push(`/business/${item.ujbCode}`)
                  }
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