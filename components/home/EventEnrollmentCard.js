"use client";

import { useEffect, useState } from "react";
import { db } from "@/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Slider from "react-slick";
import {
  CalendarDays,
  ArrowRight,
  Users,
  Droplet,
} from "lucide-react";
import { Forum } from "next/font/google";


const forum = Forum({
  subsets: ["latin"],
  weight: "400",
});


export default function MeetingsSection() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("monthly");
  const [monthlyEvents, setMonthlyEvents] = useState([]);
  const [conclaveEvents, setConclaveEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());

  // Refresh clock
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Fetch data
  useEffect(() => {
    async function fetchData() {
      try {
        const monthlySnap = await getDocs(
          collection(db, "MonthlyMeeting_dev")
        );

        let monthly = [];
        monthlySnap.forEach((doc) => {
          const data = doc.data();
          const time = data.time?.toDate?.();
          if (time) monthly.push({ id: doc.id, ...data, time });
        });
        setMonthlyEvents(monthly);

        const conclaveSnap = await getDocs(collection(db, "Conclaves_dev"));
        let conclaves = [];

        for (const conclaveDoc of conclaveSnap.docs) {
          const meetingsSnap = await getDocs(
            collection(db, "Conclaves_dev", conclaveDoc.id, "meetings")
          );

          meetingsSnap.forEach((doc) => {
            const data = doc.data();
            const time = data.time?.toDate?.();
            if (time) conclaves.push({ id: doc.id, ...data, time });
          });
        }

        setConclaveEvents(conclaves);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Monthly slider logic (1 upcoming + 2 recent)
  const getMonthlySliderData = () => {
    const upcoming = monthlyEvents
      .filter((e) => e.time > now)
      .sort((a, b) => a.time - b.time)
      .slice(0, 1);

    const recent = monthlyEvents
      .filter((e) => e.time <= now)
      .sort((a, b) => b.time - a.time)
      .slice(0, 2);

    if (upcoming.length > 0) {
      return [...upcoming, ...recent];
    }

    return monthlyEvents
      .filter((e) => e.time <= now)
      .sort((a, b) => b.time - a.time)
      .slice(0, 3);
  };

  const sliderData =
    activeTab === "monthly"
      ? getMonthlySliderData()
      : conclaveEvents.slice(0, 3);

  const sliderSettings = {
    dots: true,
    infinite: false,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: false,
    responsive: [
      {
        breakpoint: 768,
        settings: { slidesToShow: 1 },
      },
    ],
  };

  const renderCard = (event) => {
    const isUpcoming = event.time > now;

    return (
      <div key={event.id} className="px-2">
        <div
          className={`relative rounded-xl overflow-hidden border transition-all duration-300
          hover:shadow-lg hover:-translate-y-1
          ${isUpcoming ? "border-blue-200" : "border-slate-200"}
          bg-white`}
        >
          {/* Top Accent Gradient */}
          <div
            className={`h-1 w-full ${isUpcoming
              ? "bg-gradient-to-r from-blue-500 to-indigo-500"
              : "bg-gradient-to-r from-slate-300 to-slate-200"
              }`}
          />

          {/* Top Section */}
          <div className="flex gap-4 p-4">

            {/* Thumbnail */}
            <div
              className={`w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0
              ${isUpcoming
                  ? "bg-blue-50 text-blue-600"
                  : "bg-slate-100 text-slate-500"
                }`}
            >
              {event.image ? (
                <img
                  src={event.image}
                  alt={event.title}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <CalendarDays size={22} />
              )}
            </div>

            {/* Content */}
            <div className="flex-1">
              <p className="text-xs uppercase tracking-wide text-slate-400 font-medium">
                {activeTab === "monthly" ? "Event" : "Conclave"}
              </p>

              <h3 className="text-sm font-semibold text-slate-900 mt-1 leading-snug">
                {event.title || "Community Event"}
              </h3>
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-3 text-center border-t border-slate-200">

            {/* Date */}
            <div className="py-3">
              <p className="text-sm font-semibold text-slate-900">
                {event.time.toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                })}
              </p>
              <p className="text-xs text-slate-400 mt-1">Date</p>
            </div>

            {/* Time */}
            <div className="py-3 border-l border-r border-slate-200">
              <p className="text-sm font-semibold text-slate-900">
                {event.time.toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
              <p className="text-xs text-slate-400 mt-1">Time</p>
            </div>

            {/* Status */}
            <div className="py-3">
              <p
                className={`text-sm font-semibold ${isUpcoming ? "text-blue-600" : "text-slate-600"
                  }`}
              >
                {isUpcoming ? "Open" : "Closed"}
              </p>
              <p className="text-xs text-slate-400 mt-1">Status</p>
            </div>
          </div>

          {/* Footer CTA */}
          <div className="border-t border-slate-200">
            <button
              onClick={() =>
                router.push(
                  activeTab === "monthly"
                    ? "/Monthlymeetdetails"
                    : "/ConclaveMeeting"
                )
              }
              className="w-full py-3 text-sm font-medium text-blue-600 hover:bg-blue-50 transition"
            >
              View event →
            </button>
          </div>
        </div>
      </div>
    );
  };

  const SkeletonCard = () => (
    <div className="px-2">
      <div className="bg-white border border-slate-200 rounded-xl p-4 animate-pulse">
        <div className="flex gap-4">
          <div className="w-16 h-16 bg-slate-200 rounded-lg" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-slate-200 rounded w-20" />
            <div className="h-4 bg-slate-200 rounded w-3/4" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="h-6 bg-slate-200 rounded" />
          <div className="h-6 bg-slate-200 rounded" />
          <div className="h-6 bg-slate-200 rounded" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">

      {/* Section Heading */}
      <div className="flex items-center gap-2">
        <CalendarDays size={18} className="text-orange-500" />
        <h3
          className={`${forum.className} text-xl tracking-wide`}
          style={{ color: "#a2cbda" }}
        >
          Meetings & Conclaves
        </h3>
      </div>

      {/* Tabs */}
      <div className="flex gap-4">
        {["monthly", "conclave"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
        ${activeTab === tab
                ? "bg-orange-500 text-white shadow-md"
                : "bg-blue-50 text-blue-600 hover:bg-blue-100"
              }`}
          >
            {tab === "monthly"
              ? "Monthly Meetings"
              : "Conclaves"}
          </button>
        ))}
      </div>

      {/* Slider */}
      {loading ? (
        <Slider {...sliderSettings}>
          <SkeletonCard />
          <SkeletonCard />
        </Slider>
      ) : sliderData.length === 0 ? (
        <p className="text-sm text-slate-500">
          No events available.
        </p>
      ) : (
        <Slider {...sliderSettings}>
          {sliderData.map((event) => renderCard(event))}
        </Slider>
      )}

    </div>
  );
}