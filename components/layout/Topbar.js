"use client";

import { Search, Plus } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useEffect, useState } from "react";

export default function Topbar() {
  const { title } = usePageMeta();

  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const data = sessionStorage.getItem("AdminData");

    if (data) {
      const parsed = JSON.parse(data);
      console.log("✅ Loaded Admin:", parsed);
      setCurrentUser(parsed);
    }

    setLoading(false);
  }, []);

  const getName = () => {
    return currentUser?.name || currentUser?.currentuser || "";
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .trim()
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleColor = (role) => {
    return role === "Super" ? "bg-purple-600" : "bg-blue-500";
  };

  const userName = getName();

  return (
    <header className="sticky top-0 z-30 h-16 bg-gray-200 shadow-sm">
      <div className="flex items-center h-16 px-6">
        
        <h1 className="text-3xl font-bold tracking-tight text-slate-800">
          {title}
        </h1>

        <div className="flex-1" />

        <div className="flex items-center gap-3">
          
          <button className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100">
            <Plus className="h-4 w-4" />
          </button>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search"
              className="h-10 w-[260px] rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm focus:outline-none"
            />
          </div>

          {/* ✅ PROFILE */}
          <div title={userName || "User"}>
            {loading ? (
              <div className="h-10 w-10 rounded-full bg-gray-300 animate-pulse" />
            ) : currentUser?.photo ? (
              <img
                src={currentUser.photo}
                alt="profile"
                className="h-10 w-10 rounded-full object-cover border border-slate-300"
              />
            ) : (
              <div
                className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold ${getRoleColor(
                  currentUser?.role
                )}`}
              >
                {getInitials(userName)}
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}