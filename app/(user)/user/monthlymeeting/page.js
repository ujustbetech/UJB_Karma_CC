"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays } from "lucide-react";
import UserPageHeader from "@/components/user/UserPageHeader";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Text from "@/components/ui/Text";
import { useToast } from "@/components/ui/ToastProvider";
import {
  fetchUserMonthlyMeetings,
  registerUserForMonthlyMeeting,
} from "@/services/monthlyMeetingService";

function toDateValue(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value?.toDate === "function") return value.toDate();
  if (typeof value?.seconds === "number") return new Date(value.seconds * 1000);
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toPlainText(value) {
  return String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isEnrollmentOpen(event) {
  if (typeof event?.enrollmentEnabled === "boolean") return event.enrollmentEnabled;
  if (event?.isEnrollmentOpen !== undefined) return event.isEnrollmentOpen;
  if (!event?.enrollmentDeadline) return true;
  return new Date(event.enrollmentDeadline).getTime() >= Date.now();
}

export default function AllEvents() {
  const toast = useToast();
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [registeringId, setRegisteringId] = useState("");

  useEffect(() => {
    const fetchAllEvents = async () => {
      try {
        const eventList = await fetchUserMonthlyMeetings();
        setEvents(eventList);
      } catch (error) {
        console.error("Error fetching events:", error);
      } finally {
        setLoadingEvents(false);
      }
    };

    fetchAllEvents();
  }, []);

  const openRegisterConfirm = (event, clickEvent) => {
    clickEvent.preventDefault();
    clickEvent.stopPropagation();
    setSelectedEvent(event);
    setConfirmOpen(true);
  };

  const closeRegisterConfirm = () => {
    if (registeringId) return;
    setConfirmOpen(false);
    setSelectedEvent(null);
  };

  const handleConfirmRegister = async () => {
    if (!selectedEvent?.id) return;
    setRegisteringId(selectedEvent.id);

    try {
      const response = await registerUserForMonthlyMeeting(selectedEvent.id);
      setEvents((previous) =>
        previous.map((event) =>
          event.id === selectedEvent.id ? { ...event, isUserRegistered: true } : event
        )
      );
      toast.success(
        response?.alreadyRegistered
          ? "You are already registered for this meeting"
          : "Registration successful"
      );
      setConfirmOpen(false);
      setSelectedEvent(null);
    } catch (error) {
      console.error("Error registering for monthly meeting:", error);
      toast.error(error?.message || "Failed to register for this meeting");
    } finally {
      setRegisteringId("");
    }
  };

  const sortedEvents = [...events].sort((a, b) => {
    const dateA = toDateValue(a.time) || new Date(0);
    const dateB = toDateValue(b.time) || new Date(0);
    return dateB - dateA;
  });

  return (
    <main className="min-h-screen py-6">
      <div className="space-y-5">
        <UserPageHeader
          title="Monthly Meetings"
          description="Discover referrals, growth insights, shared learning, and community impact from every meeting."
          icon={CalendarDays}
        />

        <div className="grid grid-cols-1 gap-6">
          {loadingEvents ? (
            <>
              <MeetingCardSkeleton />
              <MeetingCardSkeleton />
              <MeetingCardSkeleton />
            </>
          ) : sortedEvents.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
              No monthly meetings available.
            </div>
          ) : (
            sortedEvents.map((event) => {
            const eventDate = toDateValue(event.time);
            const now = new Date();
            const diffMs = eventDate ? eventDate - now : 0;
            const isEnded = diffMs <= 0;
            const enrollmentOpen = isEnrollmentOpen(event);

            const referralCount = event.referralSections?.length || 0;
            const prospectCount = event.prospectSections?.length || 0;
            const requirementCount = event.requirementSections?.length || 0;
            const oneToOneCount = event.sections?.length || 0;
            const e2aCount = event.e2aSections?.length || 0;

              return (
              <Link
                key={event.id}
                href={`/user/monthlymeeting/${event.id}`}
                className="flex flex-col bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition duration-300 cursor-pointer"
              >
                {event.imageUploads?.[0]?.image?.url && (
                  <img src={event.imageUploads[0].image.url} className="w-full h-56 object-cover" />
                )}

                <div className="p-7 flex flex-col flex-1 min-h-[320px]">
                  <div className="flex justify-between items-center mb-4">
                    <span
                      className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        isEnded ? "bg-gray-200 text-gray-600" : "bg-indigo-100 text-indigo-600"
                      }`}
                    >
                      {isEnded ? "Completed" : "Upcoming"}
                    </span>

                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <CalendarDays size={14} />
                      {eventDate?.toLocaleString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-gray-800 mb-3">{event.Eventname}</h3>
                  {event.isUserRegistered && (
                    <div className="mb-3 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      Registered to this event
                    </div>
                  )}

                  <p className="text-sm text-gray-600 line-clamp-3 mb-6">
                    {toPlainText(event.description) || "No description available"}
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-center mb-6">
                    <MetricBox color="indigo" value={referralCount} label="Referrals" />
                    <MetricBox color="green" value={prospectCount} label="Prospects" />
                    <MetricBox color="purple" value={oneToOneCount} label="1-2-1" />
                    <MetricBox color="orange" value={requirementCount} label="Requirements" />
                    <MetricBox color="pink" value={e2aCount} label="E2A" />
                  </div>

                  <div className="mt-auto pt-3 border-t border-gray-100 flex justify-between items-center relative z-10 bg-white">
                    <span className="text-indigo-600 text-sm font-semibold">View Details</span>
                    {event.isUserRegistered ? (
                      <span className="text-xs text-green-600 font-semibold">Registered</span>
                    ) : !enrollmentOpen ? (
                      <span className="text-xs text-rose-600 font-semibold">Enrollment Closed</span>
                    ) : (
                      <button
                        onClick={(e) => openRegisterConfirm(event, e)}
                        disabled={registeringId === event.id}
                        className="bg-indigo-600 text-white text-xs px-4 py-2 rounded-xl hover:bg-indigo-700 transition"
                      >
                        {registeringId === event.id ? "Registering..." : "Register"}
                      </button>
                    )}
                  </div>
                </div>
              </Link>
              );
            })
          )}
        </div>
      </div>

      <Modal
        open={confirmOpen}
        onClose={closeRegisterConfirm}
        title="Confirm Registration"
        footer={
          <>
            <Button variant="secondary" onClick={closeRegisterConfirm} disabled={!!registeringId}>
              Cancel
            </Button>
            <Button onClick={handleConfirmRegister} loading={registeringId === selectedEvent?.id}>
              Register
            </Button>
          </>
        }
      >
        <Text variant="muted">
          {`Are you sure you want to register${
            selectedEvent?.Eventname ? ` for ${selectedEvent.Eventname}` : ""
          }?`}
        </Text>
      </Modal>
    </main>
  );
}

function MeetingCardSkeleton() {
  return (
    <div className="animate-pulse rounded-3xl border border-slate-200 bg-white p-7">
      <div className="mb-4 flex items-center justify-between">
        <div className="h-6 w-24 rounded-full bg-slate-200" />
        <div className="h-4 w-36 rounded bg-slate-200" />
      </div>
      <div className="mb-4 h-6 w-2/3 rounded bg-slate-200" />
      <div className="mb-6 h-12 w-full rounded bg-slate-200" />
      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="h-14 rounded-xl bg-slate-200" />
        <div className="h-14 rounded-xl bg-slate-200" />
        <div className="h-14 rounded-xl bg-slate-200" />
      </div>
      <div className="h-10 w-28 rounded-xl bg-slate-200" />
    </div>
  );
}

function MetricBox({ color, value, label }) {
  const bg = {
    indigo: "bg-indigo-50 text-indigo-600",
    green: "bg-green-50 text-green-600",
    purple: "bg-purple-50 text-purple-600",
    orange: "bg-orange-50 text-orange-600",
    pink: "bg-pink-50 text-pink-600",
  };

  return (
    <div className={`p-3 rounded-xl ${bg[color]}`}>
      <p className="text-lg font-bold">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}
