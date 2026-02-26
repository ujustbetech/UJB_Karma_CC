"use client";

import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function AdminLayout({ children, role }) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("sidebar-collapsed");
    if (stored) setCollapsed(stored === "true");
  }, []);

  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", collapsed);
  }, [collapsed]);

  return (
    <div className="min-h-screen bg-gray-200">
      <Sidebar
        role={role}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />

      <div
        className={`flex flex-col min-h-screen transition-all duration-300
        ${collapsed ? "ml-16" : "ml-[240px]"}`}
      >
        <Topbar />
        <main className="h-[calc(100vh-64px)] overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
