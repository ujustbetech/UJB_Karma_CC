import clsx from "clsx";

/* ================================
   Base styles
================================ */
const BASE =
  "inline-flex items-center font-medium whitespace-nowrap";

/* ================================
   Variant styles
================================ */
const VARIANTS = {
  /* Default / general usage */
  neutral: "bg-slate-100 text-slate-700",
  primary: "bg-blue-50 text-blue-700",
  secondary: "bg-slate-100 text-slate-700",
  danger: "bg-rose-50 text-rose-700",

  /* Table-specific (REFERENCE MATCH) */
  "table-approved":
    "bg-emerald-50 text-emerald-600",
  "table-pending":
    "bg-orange-50 text-orange-600",
  "table-rejected":
    "bg-rose-50 text-rose-600",
};

/* ================================
   Size / shape presets
================================ */
const SIZES = {
  default: "rounded-md px-3 py-1.5 text-sm",
  table: "rounded-full px-3 py-1 text-xs",
};

export default function Badge({
  children,
  variant = "neutral",
  size = "default", // "default" | "table"
  className,
}) {
  return (
    <span
      className={clsx(
        BASE,
        VARIANTS[variant],
        SIZES[size],
        className
      )}
    >
      {children}
    </span>
  );
}
