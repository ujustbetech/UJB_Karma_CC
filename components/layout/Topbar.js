"use client";

import { Search, Plus } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";

export default function Topbar() {
  const { title } = usePageMeta();

  return (
    <header className="sticky top-0 z-30 h-16 bg-gray-200">
      <div className="flex items-center h-16 px-6">
        
        <h1 className="text-3xl font-bold tracking-tight">
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
              className="h-10 w-[260px] rounded-lg border border-slate-300 bg-transparent pl-9 pr-3 text-sm focus:outline-none"
            />
          </div>

          <button className="h-10 w-10 rounded-full bg-slate-300" />
        </div>
      </div>
    </header>
  );
}
