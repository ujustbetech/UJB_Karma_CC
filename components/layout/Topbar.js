"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { useAdminSession } from "@/hooks/useAdminSession";

export default function Topbar({ collapsed, setCollapsed }) {
  const { title } = usePageMeta();
  const router = useRouter();
  const { admin: currentUser, loading, logout } = useAdminSession();

  const getName = () => currentUser?.name || "";

  const getInitials = (name) => {
    if (!name) return "U";

    return name
      .trim()
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleColor = (role) => {
    return role === "Super" ? "bg-purple-600" : "bg-blue-500";
  };

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: "Logout?",
      text: "Are you sure you want to logout?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#2563eb",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, Logout",
    });

    if (!result.isConfirmed) {
      return;
    }

    await logout();

    await Swal.fire({
      title: "Logged out!",
      text: "You have been successfully logged out.",
      icon: "success",
      timer: 1500,
      showConfirmButton: false,
    });

    router.replace("/");
  };

  const userName = getName();

  return (
    <header className="sticky top-0 z-30 h-16 bg-gray-200 shadow-sm">
      <div className="flex items-center h-16 px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-5 w-5" />
            ) : (
              <PanelLeftClose className="h-5 w-5" />
            )}
          </button>

          <h1 className="text-3xl font-bold tracking-tight text-slate-800">
            {title}
          </h1>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-3">
          

          <div title="Logout" onClick={handleLogout} className="cursor-pointer">
            {loading ? (
              <div className="h-10 w-10 animate-pulse rounded-full bg-gray-300" />
            ) : currentUser?.photo ? (
              <img
                src={currentUser.photo}
                alt="profile"
                className="h-10 w-10 rounded-full border border-slate-300 object-cover transition hover:opacity-80"
              />
            ) : (
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full text-white font-semibold transition hover:opacity-80 ${getRoleColor(
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

