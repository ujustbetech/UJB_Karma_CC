"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Slider from "react-slick";
import { CalendarDays } from "lucide-react";
import { Forum } from "next/font/google";
import { useToast } from "@/components/ui/ToastProvider";
import { registerUserForMonthlyMeeting } from "@/services/monthlyMeetingService";

const forum = Forum({
  subsets: ["latin"],
  weight: "400",
});

export default function MeetingsSection({ data }) {
  const router = useRouter();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState("monthly");
  const [now, setNow] = useState(new Date());
  const [registeringId, setRegisteringId] = useState("");
  const [registeredIds, setRegisteredIds] = useState(new Set());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const monthlyEvents = useMemo(
    () =>
      (data?.monthlyEvents || [])
        .map((event) => ({
          ...event,
          time: event?.time ? new Date(event.time) : null,
        }))
        .filter((event) => event.time && !Number.isNaN(event.time.getTime())),
    [data]
  );

  const conclaveEvents = useMemo(
    () =>
      (data?.conclaveEvents || [])
        .map((event) => ({
          ...event,
          time: event?.time ? new Date(event.time) : null,
        }))
        .filter((event) => event.time && !Number.isNaN(event.time.getTime())),
    [data]
  );

  const loading = !data;

  const getMonthlySliderData = () => {
    const upcoming = monthlyEvents
      .filter((event) => event.time > now)
      .sort((left, right) => left.time - right.time)
      .slice(0, 1);

    const recent = monthlyEvents
      .filter((event) => event.time <= now)
      .sort((left, right) => right.time - left.time)
      .slice(0, 2);

    if (upcoming.length > 0) {
      return [...upcoming, ...recent];
    }

    return monthlyEvents
      .filter((event) => event.time <= now)
      .sort((left, right) => right.time - left.time)
      .slice(0, 3);
  };

  const sliderData =
    activeTab === "monthly" ? getMonthlySliderData() : conclaveEvents.slice(0, 3);

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

  const getDestination = (event) => {
    if (activeTab === "monthly") {
      return `/user/monthlymeeting/${event.id}`;
    }

    return `/user/conclave/meeting/${event.id}`;
  };

  const renderCard = (event) => {
    const isUpcoming = event.time > now;
    const isRegistered = event.isUserRegistered || registeredIds.has(event.id);
    const enrollmentOpen =
      event.isEnrollmentOpen !== undefined
        ? event.isEnrollmentOpen
        : typeof event.enrollmentEnabled === "boolean"
        ? event.enrollmentEnabled
        : !event.enrollmentDeadline ||
          new Date(event.enrollmentDeadline).getTime() >= Date.now();
    const monthlyStatusText =
      isRegistered ? "Registered" : enrollmentOpen ? "Open" : "Enrollment Closed";
    const monthlyStatusClass = isRegistered
      ? "text-emerald-600"
      : enrollmentOpen
      ? "text-blue-600"
      : "text-rose-600";

    const handleRegister = async (clickEvent) => {
      clickEvent.stopPropagation();
      if (activeTab !== "monthly" || isRegistered || registeringId === event.id) return;

      try {
        setRegisteringId(event.id);
        const response = await registerUserForMonthlyMeeting(event.id);
        setRegisteredIds((prev) => new Set([...prev, event.id]));
        toast.success(
          response?.alreadyRegistered
            ? "You are already registered for this meeting"
            : "Registration successful"
        );
      } catch (error) {
        toast.error(error?.message || "Failed to register");
      } finally {
        setRegisteringId("");
      }
    };

    return (
      <div key={event.id} className="px-2">
        <div
          className={`relative overflow-hidden rounded-xl border bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
            isUpcoming ? "border-blue-200" : "border-slate-200"
          }`}
        >
          <div
            className={`h-1 w-full ${
              isUpcoming
                ? "bg-gradient-to-r from-blue-500 to-indigo-500"
                : "bg-gradient-to-r from-slate-300 to-slate-200"
            }`}
          />

          <div className="flex gap-4 p-4">
            <div
              className={`flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg ${
                isUpcoming ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-500"
              }`}
            >
              {event.image ? (
                <img
                  src={event.image}
                  alt={event.title}
                  className="h-full w-full rounded-lg object-cover"
                />
              ) : (
                <CalendarDays size={22} />
              )}
            </div>

            <div className="flex-1">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                {activeTab === "monthly" ? "Event" : "Conclave"}
              </p>

              <h3 className="mt-1 text-sm font-semibold leading-snug text-slate-900">
                {event.title || "Community Event"}
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-3 border-t border-slate-200 text-center">
            <div className="py-3">
              <p className="text-sm font-semibold text-slate-900">
                {event.time.toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                })}
              </p>
              <p className="mt-1 text-xs text-slate-400">Date</p>
            </div>

            <div className="border-x border-slate-200 py-3">
              <p className="text-sm font-semibold text-slate-900">
                {event.time.toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
              <p className="mt-1 text-xs text-slate-400">Time</p>
            </div>

            <div className="py-3">
              <p
                className={`text-sm font-semibold ${
                  activeTab === "monthly"
                    ? monthlyStatusClass
                    : isUpcoming
                    ? "text-blue-600"
                    : "text-slate-600"
                }`}
              >
                {activeTab === "monthly" ? monthlyStatusText : isUpcoming ? "Open" : "Closed"}
              </p>
              <p className="mt-1 text-xs text-slate-400">Status</p>
            </div>
          </div>

          <div className="grid grid-cols-2 border-t border-slate-200">
            {activeTab === "monthly" ? (
              <button
                onClick={handleRegister}
                disabled={!enrollmentOpen || isRegistered || registeringId === event.id}
                className="py-3 text-sm font-medium text-emerald-600 transition hover:bg-emerald-50 disabled:text-slate-400 disabled:hover:bg-transparent"
              >
                {isRegistered
                  ? "Registered"
                  : !enrollmentOpen
                  ? "Enrollment Closed"
                  : registeringId === event.id
                  ? "Registering..."
                  : "Register"}
              </button>
            ) : (
              <div />
            )}
            <button
              onClick={() => router.push(getDestination(event))}
              className="py-3 text-sm font-medium text-blue-600 transition hover:bg-blue-50"
            >
              View Details
            </button>
          </div>
        </div>
      </div>
    );
  };

  const SkeletonCard = () => (
    <div className="px-2">
      <div className="animate-pulse rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex gap-4">
          <div className="h-16 w-16 rounded-lg bg-slate-200" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-20 rounded bg-slate-200" />
            <div className="h-4 w-3/4 rounded bg-slate-200" />
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="h-6 rounded bg-slate-200" />
          <div className="h-6 rounded bg-slate-200" />
          <div className="h-6 rounded bg-slate-200" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <CalendarDays size={18} className="text-orange-500" />
        <h3
          className={`${forum.className} text-xl tracking-wide`}
          style={{ color: "#a2cbda" }}
        >
          Meetings & Conclaves
        </h3>
      </div>

      <div className="flex flex-wrap gap-3">
        {["monthly", "conclave"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`min-w-[140px] rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
              activeTab === tab
                ? "bg-orange-500 text-white shadow-md"
                : "bg-blue-50 text-blue-600 hover:bg-blue-100"
            }`}
          >
            {tab === "monthly" ? "Monthly Meetings" : "Conclaves"}
          </button>
        ))}
      </div>

      {loading ? (
        <Slider {...sliderSettings}>
          <SkeletonCard />
          <SkeletonCard />
        </Slider>
      ) : sliderData.length === 0 ? (
        <p className="text-sm text-slate-500">No events available.</p>
      ) : (
        <Slider {...sliderSettings}>{sliderData.map((event) => renderCard(event))}</Slider>
      )}
    </div>
  );
}
