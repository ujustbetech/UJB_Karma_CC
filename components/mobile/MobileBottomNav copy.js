"use client";

import { useRouter, usePathname } from "next/navigation";
import { Home, UserPlus, Search, Users, Calendar } from "lucide-react";

export default function MobileBottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    { label: "Home", icon: Home, path: "/" },
    { label: "Prospects", icon: UserPlus, path: "/UsersProspect" },
    { label: "Referrals", icon: Users, path: "/ReferralList" },
    { label: "Events", icon: Calendar, path: "/Events" },
  ];

  const isActive = (path) =>
    path === "/" ? pathname === "/" : pathname.startsWith(path);

  return (
    <div className="fixed bottom-4 w-full max-w-md px-4 z-50">

      <div className="relative flex justify-between items-center
                      bg-black/70 backdrop-blur-xl
                      border border-white/10
                      rounded-2xl h-[68px] px-6
                      shadow-[0_8px_30px_rgba(0,0,0,0.6)]">

        {/* LEFT SIDE */}
        {navItems.slice(0, 2).map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <button
              key={item.label}
              onClick={() => router.push(item.path)}
              className="flex flex-col items-center justify-center"
            >
              <Icon
                size={20}
                className={`transition duration-200
                  ${active
                    ? "text-orange-500 scale-110"
                    : "text-slate-400"}`}
              />
              <span
                className={`text-[10px] mt-1
                  ${active
                    ? "text-orange-500"
                    : "text-slate-400"}`}
              >
                {item.label}
              </span>
            </button>
          );
        })}

        {/* CENTER SEARCH BUTTON */}
        <button
          onClick={() => router.push("/Search")}
          className="w-14 h-14 rounded-full
                     bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600
                     flex items-center justify-center
                     shadow-lg shadow-orange-500/30
                     active:scale-95 transition"
        >
          <Search size={22} className="text-white" />
        </button>

        {/* RIGHT SIDE */}
        {navItems.slice(2).map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <button
              key={item.label}
              onClick={() => router.push(item.path)}
              className="flex flex-col items-center justify-center"
            >
              <Icon
                size={20}
                className={`transition duration-200
                  ${active
                    ? "text-orange-500 scale-110"
                    : "text-slate-400"}`}
              />
              <span
                className={`text-[10px] mt-1
                  ${active
                    ? "text-orange-500"
                    : "text-slate-400"}`}
              >
                {item.label}
              </span>
            </button>
          );
        })}

      </div>
    </div>
  );
}