"use client";

import { useState } from "react";
import clsx from "clsx";

export default function Tooltip({ content, children }) {
  const [open, setOpen] = useState(false);

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {children}

      {open && (
        <span
          className={clsx(
            "pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full",
            "z-50 rounded-md bg-slate-900 px-2 py-1",
            "text-xs text-white whitespace-nowrap shadow-sm"
          )}
        >
          {content}
        </span>
      )}
    </span>
  );
}
