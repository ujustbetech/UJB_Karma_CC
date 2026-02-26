"use client";

import { X } from "lucide-react";
import clsx from "clsx";
import { useEffect } from "react";

/* ================================
   Overlay
================================ */
const OVERLAY =
  "fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20";

/* ================================
   Modal container
================================ */
const BASE =
  "relative w-full rounded-2xl bg-white";

/* ================================
   Size presets
================================ */
const SIZES = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
};

/* ================================
   Component
================================ */
export default function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = "md",
}) {
  useEffect(() => {
    if (!open) return;

    const onEsc = (e) => {
      if (e.key === "Escape") {
        onClose?.();
      }
    };

    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className={OVERLAY}
      onClick={onClose}
    >
      <div
        className={clsx(
          BASE,
          SIZES[size]
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <h3 className="text-base font-semibold text-slate-900">
              {title}
            </h3>

            <button
              onClick={onClose}
              className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-900"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Body */}
        <div className="max-h-[70vh] overflow-y-auto px-6 py-4">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
