"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import {
  Droplet,
  UserPlus,
  Search,
  Users,
  Calendar,
  CalendarDays
} from "lucide-react";

export default function MobileBottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [showEventsMenu, setShowEventsMenu] = useState(false);
  const menuRef = useRef(null);

  const navItemsLeft = [
    { label: "Dewdrop", icon: Droplet, path: "/user/dewdrop/content" },
    { label: "Prospects", icon: UserPlus, path: "/user/prospects" },
  ];

  const navItemsRight = [
    { label: "Referrals", icon: Users, path: "/user/referrals" },
  ];

  const isActive = (path) =>
    pathname === path || pathname.startsWith(path);

  // Close floating menu on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowEventsMenu(false);
      }
    }

    if (showEventsMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showEventsMenu]);

  return (
    <div className="fixed bottom-4 w-full max-w-md px-4 z-50">
      <div
        className="relative flex justify-between items-center
                   bg-white border border-slate-200
                   rounded-2xl h-[68px] px-6
                   shadow-xl"
      >
        {/* LEFT SIDE */}
        {navItemsLeft.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <button
              key={item.label}
              onClick={() => router.push(item.path)}
              className="flex flex-col items-center"
            >
              <Icon
                size={20}
                className={`transition duration-200 ${
                  active
                    ? "text-orange-500 scale-110"
                    : "text-slate-500"
                }`}
              />
              <span
                className={`text-[10px] mt-1 ${
                  active
                    ? "text-orange-500 font-medium"
                    : "text-slate-500"
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}

        {/* CENTER SEARCH */}
        <button
          onClick={() => router.push("/user/cosmorbiters")}
          className="w-14 h-14 rounded-full
                     bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600
                     flex items-center justify-center
                     shadow-lg
                     active:scale-95 transition"
        >
          <Search size={22} className="text-white" />
        </button>

        {/* RIGHT SIDE */}
        {navItemsRight.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <button
              key={item.label}
              onClick={() => router.push(item.path)}
              className="flex flex-col items-center"
            >
              <Icon
                size={20}
                className={`transition duration-200 ${
                  active
                    ? "text-orange-500 scale-110"
                    : "text-slate-500"
                }`}
              />
              <span
                className={`text-[10px] mt-1 ${
                  active
                    ? "text-orange-500 font-medium"
                    : "text-slate-500"
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}

        {/* EVENTS BUTTON */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowEventsMenu(!showEventsMenu)}
            className="flex flex-col items-center"
          >
            <Calendar size={20} className="text-slate-500" />
            <span className="text-[10px] mt-1 text-slate-500">
              Events
            </span>
          </button>

          {/* Floating Menu */}
          {showEventsMenu && (
            <div
              className="absolute bottom-16 right-0 w-48
                         bg-white rounded-2xl
                         shadow-xl border border-slate-200
                         p-2 animate-fadeIn"
            >
              <button
                onClick={() => {
                  router.push("/ConclaveMeeting");
                  setShowEventsMenu(false);
                }}
                className="flex items-center gap-3 w-full
                           px-3 py-2 rounded-xl
                           hover:bg-slate-100 transition"
              >
                <CalendarDays size={18} className="text-orange-500" />
                <span className="text-sm text-slate-700">
                  Conclave
                </span>
              </button>

              <button
                onClick={() => {
                  router.push("/user/monthlymeeting");
                  setShowEventsMenu(false);
                }}
                className="flex items-center gap-3 w-full
                           px-3 py-2 rounded-xl
                           hover:bg-slate-100 transition"
              >
                <Users size={18} className="text-orange-500" />
                <span className="text-sm text-slate-700">
                  Monthly Meeting
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}