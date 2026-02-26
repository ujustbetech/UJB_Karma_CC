"use client";

import { useState } from "react";
import clsx from "clsx";

/* ================================
   Base styles
================================ */
const TABS_BASE =
  "inline-flex items-center rounded-xl bg-slate-100 p-1";

/* ================================
   Tab button styles
================================ */
const TAB_BASE =
  "flex h-9 items-center justify-center rounded-lg px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300";

/* ================================
   Variants
================================ */
const TAB_ACTIVE =
  "bg-white text-slate-900 shadow-none";

const TAB_INACTIVE =
  "text-slate-600 hover:text-slate-900 hover:bg-slate-200";

/* ================================
   Component
================================ */
export default function Tabs({ tabs = [], className }) {
  const [active, setActive] = useState(tabs[0]?.id);

  return (
    
    <div>
      <div className={clsx(TABS_BASE, className)}>
        {tabs.map((tab) => {
          const isActive = active === tab.id;

          return (
            <button
              key={tab.id}                  // ✅ UNIQUE KEY
              type="button"
              onClick={() => setActive(tab.id)}
              className={clsx(
                TAB_BASE,
                isActive ? TAB_ACTIVE : TAB_INACTIVE
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="mt-4">
        {tabs.find((t) => t.id === active)?.content}
      </div>
    </div>
  );
}
